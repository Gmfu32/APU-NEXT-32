from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import re
import subprocess
import tempfile
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any
from xml.etree import ElementTree


BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = BACKEND_DIR / "knowledge" / "assistant_corpus.json"
MAX_ARCHIVE_BYTES = 100 * 1024 * 1024
MAX_ENTRY_BYTES = 20 * 1024 * 1024
MAX_ENTRIES = 500
CHUNK_CHARACTERS = 1400
CHUNK_OVERLAP = 180
EMAIL_PATTERN = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
ID_PATTERN = re.compile(r"(?<!\d)\d{12}(?!\d)")
PHONE_PATTERN = re.compile(r"(?<!\w)\+?\d[\d ()-]{7,}\d(?!\w)")
YEAR_PATTERN = re.compile(r"\b(?:19|20)\d{2}\b")


def sanitize_text(text: str) -> str:
    text = EMAIL_PATTERN.sub("[contact email omitted]", text)
    text = ID_PATTERN.sub("[personal ID omitted]", text)
    text = PHONE_PATTERN.sub("[contact number omitted]", text)
    text = "".join(char if char in "\n\t" or ord(char) >= 32 else " " for char in text)
    return re.sub(r"[ \t]+", " ", text).strip()


def clean_paragraphs(paragraphs: list[str]) -> list[str]:
    cleaned = [sanitize_text(re.sub(r"\s+", " ", paragraph)).strip() for paragraph in paragraphs]
    return [paragraph for paragraph in cleaned if paragraph]


def extract_pdf(raw: bytes) -> list[tuple[str, str]]:
    from io import BytesIO
    from pypdf import PdfReader

    reader = PdfReader(BytesIO(raw))
    return [(f"Page {index + 1}", page.extract_text() or "") for index, page in enumerate(reader.pages)]


def extract_docx(raw: bytes) -> list[tuple[str, str]]:
    from io import BytesIO
    from docx import Document

    document = Document(BytesIO(raw))
    sections: list[tuple[str, list[str]]] = []
    current_title = "Document"

    def append_paragraph(text: str, heading: bool = False) -> None:
        nonlocal current_title
        clean = sanitize_text(re.sub(r"\s+", " ", text)).strip()
        if not clean:
            return
        if heading:
            current_title = clean[:160]
            sections.append((current_title, []))
        elif not sections:
            sections.append((current_title, [clean]))
        else:
            sections[-1][1].append(clean)

    for paragraph in document.paragraphs:
        style_name = paragraph.style.name.lower() if paragraph.style else ""
        is_heading = style_name.startswith("heading") or style_name in {"title", "subtitle"}
        append_paragraph(paragraph.text, is_heading)
    for table in document.tables:
        for row in table.rows:
            append_paragraph(" | ".join(cell.text.strip() for cell in row.cells))

    return [(section, "\n".join(lines)) for section, lines in sections if lines]


def extract_pptx(raw: bytes) -> list[tuple[str, str]]:
    import io

    extracted: list[tuple[str, str]] = []
    with zipfile.ZipFile(io.BytesIO(raw)) as presentation:
        slides = [
            name for name in presentation.namelist()
            if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)
        ]
        slides.sort(key=lambda name: int(re.search(r"slide(\d+)", name).group(1)))
        for slide_number, slide_name in enumerate(slides, start=1):
            root = ElementTree.fromstring(presentation.read(slide_name))
            texts = [
                node.text.strip()
                for node in root.iter()
                if node.tag.endswith("}t") and node.text and node.text.strip()
            ]
            extracted.append((f"Slide {slide_number}", "\n".join(texts)))
    return extracted


def extract_legacy_doc(raw: bytes, source_name: str) -> str:
    if os.name != "nt":
        raise RuntimeError("Legacy .doc extraction requires Microsoft Word on Windows")
    powershell = subprocess.run(
        ["where.exe", "powershell.exe"],
        capture_output=True,
        text=True,
        check=False,
    )
    if powershell.returncode:
        raise RuntimeError("PowerShell is required for legacy .doc extraction")

    with tempfile.TemporaryDirectory(prefix="apu-next-knowledge-") as directory:
        root = Path(directory)
        input_path = root / Path(source_name).name
        output_path = root / "extracted.txt"
        input_path.write_bytes(raw)
        quote = lambda value: "'" + str(value).replace("'", "''") + "'"
        script = (
            "$ErrorActionPreference='Stop';"
            "$word=New-Object -ComObject Word.Application;"
            "$word.Visible=$false;$word.DisplayAlerts=0;$word.AutomationSecurity=3;"
            "$doc=$null;"
            "try {"
            f"$doc=$word.Documents.Open({quote(input_path)},$false,$true,$false);"
            f"[IO.File]::WriteAllText({quote(output_path)},[string]$doc.Content.Text,"
            "[Text.UTF8Encoding]::new($false))"
            "} finally {"
            "if($doc){$doc.Close(0)};"
            "$word.Quit();"
            "[void][Runtime.InteropServices.Marshal]::ReleaseComObject($word)"
            "}"
        )
        encoded = base64.b64encode(script.encode("utf-16le")).decode("ascii")
        subprocess.run(
            [powershell.stdout.strip(), "-NoProfile", "-NonInteractive", "-EncodedCommand", encoded],
            check=True,
            capture_output=True,
            timeout=60,
        )
        return output_path.read_text(encoding="utf-8", errors="replace")


def extract_text_file(raw: bytes) -> list[tuple[str, str]]:
    return [("Document", raw.decode("utf-8-sig", errors="replace"))]


def split_text(text: str, maximum: int = CHUNK_CHARACTERS) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n{2,}", text) if part.strip()]
    chunks: list[str] = []
    current = ""
    for paragraph in paragraphs or [text.strip()]:
        while len(paragraph) > maximum:
            boundary = paragraph.rfind(" ", 0, maximum)
            boundary = boundary if boundary > maximum // 2 else maximum
            piece, paragraph = paragraph[:boundary].strip(), paragraph[boundary:].strip()
            if current:
                chunks.append(current)
                current = ""
            chunks.append(piece)
        candidate = f"{current}\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= maximum:
            current = candidate
            continue
        if current:
            chunks.append(current)
        overlap = current[-CHUNK_OVERLAP:].strip() if current else ""
        current = f"{overlap}\n{paragraph}".strip() if overlap else paragraph
    if current:
        chunks.append(current)
    return [chunk for chunk in chunks if len(chunk) >= 30]


def category_for(source: str, title: str) -> str:
    value = f"{source} {title}".lower()
    if any(term in value for term in ("cv", "cover letter", "application")):
        return "applications-and-cv"
    if any(term in value for term in ("part 1", "part 2", "report", "logbook", "assessment", "clearance")):
        return "reports-and-assessment"
    if any(term in value for term in ("agreement", "indemnity", "attendance", "placement", "briefing")):
        return "placement-process"
    return "internship-support"


def extract_entry(name: str, raw: bytes) -> list[tuple[str, str]]:
    extension = PurePosixPath(name).suffix.lower()
    if extension == ".pdf":
        return extract_pdf(raw)
    if extension == ".docx":
        return extract_docx(raw)
    if extension == ".pptx":
        return extract_pptx(raw)
    if extension in {".txt", ".md"}:
        return extract_text_file(raw)
    if extension == ".doc":
        return [("Document", extract_legacy_doc(raw, name))]
    raise ValueError(f"Unsupported document format: {extension or '(none)'}")


def build_index(archive_path: Path) -> tuple[list[dict[str, Any]], list[str], int]:
    records: list[dict[str, Any]] = []
    warnings: list[str] = []
    seen_chunks: dict[str, int] = {}
    with zipfile.ZipFile(archive_path) as archive:
        entries = [item for item in archive.infolist() if not item.is_dir()]
        if len(entries) > MAX_ENTRIES:
            raise ValueError(f"Archive contains more than {MAX_ENTRIES} files")
        total_size = sum(item.file_size for item in entries)
        if total_size > MAX_ARCHIVE_BYTES:
            raise ValueError("Archive is larger than the 100 MB extraction limit")

        supported_count = 0
        for entry in entries:
            if entry.file_size > MAX_ENTRY_BYTES:
                warnings.append(f"{entry.filename}: skipped because it exceeds the 20 MB file limit")
                continue
            try:
                segments = extract_entry(entry.filename, archive.read(entry))
            except ValueError as error:
                warnings.append(f"{entry.filename}: {error}")
                continue
            except Exception as error:
                warnings.append(f"{entry.filename}: extraction failed ({type(error).__name__})")
                continue

            supported_count += 1
            document_title = PurePosixPath(entry.filename).stem
            full_text = "\n".join(text for _, text in segments)
            years = sorted(set(YEAR_PATTERN.findall(full_text)))
            version = next(iter(YEAR_PATTERN.findall(document_title)), None)
            for location, raw_text in segments:
                text = sanitize_text(raw_text)
                for part_number, chunk in enumerate(split_text(text), start=1):
                    fingerprint = hashlib.sha256(
                        re.sub(r"\W+", " ", chunk.lower()).encode("utf-8")
                    ).hexdigest()
                    existing = seen_chunks.get(fingerprint)
                    reference = {
                        "source": entry.filename,
                        "location": location,
                        "version": version,
                        "section": location if not location.startswith(("Page ", "Slide ")) else "",
                    }
                    if existing is not None:
                        references = records[existing]["references"]
                        if reference not in references:
                            references.append(reference)
                        continue
                    seen_chunks[fingerprint] = len(records)
                    records.append({
                        "id": fingerprint[:20],
                        "title": document_title,
                        "category": category_for(entry.filename, document_title),
                        "version": version,
                        "dateHints": years,
                        "references": [reference],
                        "part": part_number,
                        "text": chunk,
                    })
    return records, warnings, supported_count


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a searchable APU internship document corpus.")
    parser.add_argument("archive", type=Path, help="Path to the supplied internship ZIP file")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    if not args.archive.is_file():
        raise SystemExit(f"Archive not found: {args.archive}")

    corpus, warnings, processed = build_index(args.archive)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps({"documentsProcessed": processed, "chunks": corpus}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Processed documents: {processed}")
    print(f"Unique searchable chunks: {len(corpus)}")
    print(f"Output: {args.output}")
    for warning in warnings:
        print(f"Warning: {warning}")


if __name__ == "__main__":
    main()
