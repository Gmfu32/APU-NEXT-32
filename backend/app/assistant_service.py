from __future__ import annotations

import json
import math
import re
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any


CORPUS_PATH = Path(__file__).resolve().parents[1] / "knowledge" / "assistant_corpus.json"
TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
STOP_WORDS = {
    "a", "about", "after", "all", "am", "an", "and", "any", "are", "as", "at",
    "be", "but", "by", "can", "could", "do", "does", "for", "from",
    "get", "give", "has", "have", "how", "i", "if", "in", "into", "is", "it",
    "me", "my", "of", "on", "or", "please", "should", "so", "that", "the",
    "their", "then", "there", "this", "to", "under", "up", "was", "what",
    "when", "where", "which", "who", "why", "will", "with", "would", "you",
    "your",
}
QUERY_EXPANSIONS = {
    "find": {"search", "apply", "application", "applications", "job", "opportunity", "placement"},
    "need": {"required", "requirement", "requirements", "documents", "form"},
    "required": {"requirement", "requirements", "documents", "document", "form"},
    "submit": {"submission", "report", "documents", "components", "logbooks", "attendance", "clearance"},
    "preplacement": {"before", "prior", "commence", "commencement"},
    "placement": {"internship", "agreement", "offer", "indemnity"},
    "join": {"joining", "start", "starting", "commence", "commencement", "before"},
    "joining": {"join", "start", "starting", "commence", "commencement"},
    "start": {"starting", "join", "joining", "commence", "commencement"},
    "starting": {"start", "join", "joining", "commence", "commencement"},
    "before": {"prior", "pre", "commence", "commencement"},
    "requirement": {"required", "documents", "document", "form", "submit"},
    "requirements": {"required", "documents", "document", "form", "submit"},
    "document": {"documents", "form", "paperwork", "agreement", "indemnity", "offer", "letter", "components", "logbooks", "attendance", "clearance"},
    "documents": {"document", "form", "paperwork", "agreement", "indemnity", "offer", "letter", "components", "logbooks", "attendance", "clearance"},
    "agreement": {"sign", "signed", "signature", "placement", "contract"},
    "sign": {"signed", "signature", "agreement", "endorse"},
    "signs": {"signed", "signature", "agreement", "endorse"},
    "duration": {"minimum", "weeks", "continuous", "length"},
    "minimum": {"duration", "weeks", "continuous"},
    "cgpa": {"grade", "graded", "pass", "fail", "assessment"},
    "grade": {"graded", "cgpa", "pass", "fail", "assessment"},
    "logbook": {"log", "weekly", "daily", "activities", "supervisor"},
    "log": {"logbook", "weekly", "daily", "activities"},
    "part": {"report", "submission", "assessment"},
    "correction": {"corrections", "revise", "revision", "resubmit", "resubmission", "rejected", "rejection"},
    "corrections": {"correction", "revise", "revision", "resubmit", "resubmission", "rejected", "rejection"},
    "differ": {"difference", "part", "report", "submission", "logbook"},
    "difference": {"differ", "part", "report", "submission", "logbook"},
    "deadline": {"due", "date", "dates", "submit", "submission", "late", "extension"},
    "report": {"submission", "assessment", "grading", "logbook", "correction"},
    "late": {"deadline", "extension", "evidence", "submit"},
    "eligibility": {"eligible", "requirement", "requirements", "qualify"},
    "eligible": {"eligibility", "requirement", "requirements", "qualify"},
    "supervisor": {"mentor", "assessment", "assess", "sign"},
    "mentor": {"supervisor", "assessment", "assess", "sign"},
}
POLICY_TERMS = {
    "apu", "intern", "internship", "placement", "report", "logbook", "moodle",
    "cgpa", "eligibility", "eligible", "requirement", "requirements", "deadline",
    "agreement", "clearance", "assessment", "attendance", "graduation", "graduate",
    "part", "supervisor", "mentor", "indemnity", "submission",
}
GREETING_PATTERN = re.compile(
    r"^\s*(?:hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)"
    r"[\s!.?,]*$",
    re.I,
)

def _tokens(text: str) -> list[str]:
    return [
        token for token in TOKEN_PATTERN.findall(text.lower())
        if token not in STOP_WORDS and len(token) > 1
    ]


@lru_cache(maxsize=1)
def load_corpus() -> tuple[dict[str, Any], ...]:
    if not CORPUS_PATH.is_file():
        return ()
    raw = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    chunks = raw.get("chunks")
    if not isinstance(chunks, list):
        raise ValueError("Knowledge corpus has an invalid chunk list")
    records: list[dict[str, Any]] = []
    for item in chunks:
        if (
            isinstance(item, dict)
            and isinstance(item.get("text"), str)
            and item["text"].strip()
            and isinstance(item.get("references"), list)
        ):
            records.append(item)
    if not records:
        raise ValueError("Knowledge corpus contains no searchable passages")
    return tuple(records)


def expand_query(question: str) -> list[str]:
    original = _tokens(question)
    expanded = set(original)
    for token in original:
        expanded.update(QUERY_EXPANSIONS.get(token, set()))
    return sorted(expanded)


def retrieve_context(question: str, limit: int = 5) -> list[dict[str, Any]]:
    records = load_corpus()
    query_tokens = expand_query(question)
    if not query_tokens:
        return []
    requested_parts = set(re.findall(r"\bpart\s*([12])\b", question, re.I))

    tokenized = [
        _tokens(" ".join((
            str(item.get("title", "")),
            str(item.get("category", "")),
            str(item.get("text", "")),
        )))
        for item in records
    ]
    document_frequency: dict[str, int] = {}
    for words in tokenized:
        for token in set(words):
            document_frequency[token] = document_frequency.get(token, 0) + 1
    average_length = sum(map(len, tokenized)) / max(1, len(tokenized))
    average_length = max(1.0, average_length)
    query_set = set(query_tokens)
    scored: list[tuple[float, dict[str, Any]]] = []
    preplacement_documents = bool(
        re.search(r"\b(document|documents|form|forms|paperwork)\b", question, re.I)
        and re.search(r"\b(before|prior|starting|commencement)\b", question, re.I)
        and "part 2" not in question.lower()
    )

    for item, words in zip(records, tokenized):
        item_text = " ".join((str(item.get("title", "")), str(item.get("text", ""))))
        item_parts = set(re.findall(r"\bpart\s*([12])\b", item_text, re.I))
        if requested_parts and not requested_parts.intersection(item_parts):
            continue
        frequencies: dict[str, int] = {}
        for token in words:
            frequencies[token] = frequencies.get(token, 0) + 1
        length = len(words)
        score = 0.0
        for token in query_set:
            frequency = frequencies.get(token, 0)
            if not frequency:
                continue
            inverse_frequency = math.log(
                1 + (len(records) - document_frequency[token] + 0.5)
                / (document_frequency[token] + 0.5)
            )
            denominator = frequency + 1.5 * (1 - 0.75 + 0.75 * length / average_length)
            score += inverse_frequency * frequency * 2.5 / denominator
        if score:
            direct_matches = len(set(_tokens(question)) & set(words))
            score += direct_matches * 0.45
            if requested_parts:
                score += 5.0
            if requested_parts and "report consist of" in item_text.lower():
                score += 3.0
            if preplacement_documents and "Job Offer Letter" in item_text:
                score += 15.0
            if len(query_tokens) > 1:
                score *= 0.75 + 0.25 * direct_matches / len(query_tokens)
            scored.append((score, item))

    scored.sort(key=lambda result: result[0], reverse=True)
    results: list[dict[str, Any]] = []
    source_counts: dict[str, int] = {}
    for score, item in scored:
        reference = item["references"][0]
        source = str(reference.get("source", item.get("title", "APU document")))
        source_year = re.search(r"\b(?:19|20)\d{2}\b", Path(source).stem)
        if source_counts.get(source, 0) >= 3:
            continue
        source_counts[source] = source_counts.get(source, 0) + 1
        results.append({
            "title": str(item.get("title") or Path(source).stem),
            "source": source,
            "location": str(reference.get("location") or ""),
            "section": str(reference.get("section") or ""),
            "version": source_year.group() if source_year else None,
            "dateHints": sorted(set(re.findall(r"\b(?:19|20)\d{2}\b", item["text"]))),
            "text": item["text"],
            "score": round(score, 3),
        })
        if len(results) >= limit:
            break
    return results


def is_apu_policy_question(question: str) -> bool:
    return bool(set(_tokens(question)) & POLICY_TERMS)


def retrieval_question(question: str, history: list[dict[str, str]]) -> str:
    current_tokens = _tokens(question)
    if len(current_tokens) > 4 and not re.search(r"\b(it|they|them|that|those|this|there|what about|and)\b", question, re.I):
        return question
    previous_user = next(
        (item["text"] for item in reversed(history) if item.get("role") == "user" and item.get("text", "").strip()),
        "",
    )
    return f"{previous_user}\n{question}".strip() if previous_user else question


def is_apu_policy_followup(question: str, history: list[dict[str, str]]) -> bool:
    if is_apu_policy_question(question):
        return True
    if not re.search(r"\b(it|they|them|that|those|this|there|what about|and)\b", question, re.I):
        return False
    previous_user = next(
        (item["text"] for item in reversed(history) if item.get("role") == "user" and item.get("text", "").strip()),
        "",
    )
    return is_apu_policy_question(previous_user)


def is_greeting(question: str) -> bool:
    return bool(GREETING_PATTERN.fullmatch(question))


GENERAL_ADVICE: dict[str, str] = {
    "internship_search": """**Finding an Internship**

1. **Choose a target:** Identify the roles, industries, and locations that fit your studies.
2. **Prepare your application:** Tailor your CV to each role and highlight relevant coursework, projects, and skills.
3. **Search consistently:** Check job portals and company career pages, and contact employers whose work interests you.
4. **Track and follow up:** Keep a list of applications and follow up professionally.
5. **Ask for support:** Discuss your search with your academic mentor or Career Centre.""",
    "internship_difficulty": """**Finding an Internship**

The difficulty varies with the role, location, timing, and the skills employers need. You can improve your chances by starting early, tailoring your CV to each position, showing relevant projects, and applying consistently to roles that match your experience.""",
    "interview": """**Preparing for an Internship Interview**

1. Read about the company and the responsibilities in the job description.
2. Prepare a short introduction and examples of your work, teamwork, and problem-solving.
3. Practise explaining your projects and the choices you made.
4. Prepare a few thoughtful questions about the role and the team.
5. Check the interview time, location or video link, and equipment in advance.""",
    "cv": """**Building a Strong Internship CV**

- Put your education, relevant skills, projects, and experience in easy-to-scan sections.
- Describe what you contributed to each project and the tools or methods you used.
- Tailor the wording to the role, and keep the layout clear and consistent.
- If you have not had a job yet, use coursework, personal projects, volunteering, or student activities as evidence of your skills.""",
    "skills": """**Skills to Build Before Applying**

Start with the skills named in the roles you want. For software roles, practise one programming language, version control, debugging, and explaining a small project you have completed. Add role-specific tools as you see them repeated in job descriptions.""",
    "rejection": """**After an Application Rejection**

- Review whether your CV clearly matches the role requirements.
- Use specific examples to show your relevant skills and project contributions.
- Ask for feedback when the employer offers it, then use it to improve the next application.
- Keep applying to suitable roles and track what you have already sent.""",
    "application_email": """**Writing an Internship Application Email**

Include a clear subject line, the role you are applying for, a short introduction, and one or two points showing why your skills fit. Mention the attached CV, thank the reader, and close professionally. Keep the email concise and check the company and role names before sending.""",
    "linkedin": """**Improving Your LinkedIn Profile**

Use a specific headline, add a short summary of your interests and strengths, and include relevant projects, skills, and education. Keep your profile current and connect with people or organisations in fields you are exploring. Personalise connection messages rather than sending generic requests.""",
}


def _general_topic(question: str) -> str | None:
    value = question.lower()
    if re.search(r"\b(interview|interviews)\b", value) and re.search(
        r"\b(prepare|preparation|practice|practise|nervous|tips|questions)\b", value
    ):
        return "interview"
    if re.search(r"\b(internship|intern|placement)\b", value) and re.search(
        r"\b(difficult|difficulty|hard|competitive)\b", value
    ):
        return "internship_difficulty"
    if re.search(r"\b(cv|resume|résumé)\b", value) and re.search(
        r"\b(write|improve|make|build|without|no experience|review|better)\b", value
    ):
        return "cv"
    if re.search(r"\b(reject|rejection|rejected|not selected|no response)\b", value):
        return "rejection"
    if re.search(r"\b(skill|skills|learn|learning)\b", value) and re.search(
        r"\b(before|internship|apply|application|should)\b", value
    ):
        return "skills"
    if re.search(r"\b(email|application letter|cover letter)\b", value) and re.search(
        r"\b(write|send|apply|application)\b", value
    ):
        return "application_email"
    if re.search(r"\blinkedin\b", value) and re.search(
        r"\b(improve|profile|better|update)\b", value
    ):
        return "linkedin"
    if re.search(r"\b(internship|intern|placement|job|role|position)\b", value) and re.search(
        r"\b(find|search|look|apply|application)\b", value
    ) and not re.search(r"\b(cannot|can't|unable|fail|secure)\b", value):
        return "internship_search"
    return None


def should_retrieve_context(question: str, attachment_text: str | None = None) -> bool:
    topic = _general_topic(question)
    return bool(attachment_text) or (not is_greeting(question) and topic in {None, "internship_search"})


def _source_texts(contexts: list[dict[str, Any]]) -> list[str]:
    return [str(item.get("text", "")) for item in contexts]


def _has_old_dates(contexts: list[dict[str, Any]]) -> bool:
    return any(
        year.isdigit() and int(year) < datetime.now().year
        for item in contexts
        for year in item.get("dateHints", [])
    )


def _grounded_answer(
    question: str,
    contexts: list[dict[str, Any]],
) -> tuple[str, str]:
    question_lower = question.lower()
    texts = _source_texts(contexts)
    all_text = "\n".join(texts)

    if re.search(r"\bcgpa\b", question_lower) and re.search(r"\b(pass\s*/\s*fail|pass/fail)\b", all_text, re.I):
        answer = (
            "**Does Internship Affect Your CGPA?**\n\n"
            "The available APU briefing says the internship is assessed as **Pass/Fail** and is **not included "
            "in the CGPA calculation**."
        )
        return answer, "apu_grounded"

    if re.search(r"\bpart\s*2\b", question_lower) and re.search(r"\b(document|submit|report|component)\w*\b", question_lower):
        component_text = next(
            (text for text in texts if "A report consist of" in text and "IT001-4-3" in text),
            "",
        )
        components: list[str] = []
        if component_text:
            match = re.search(
                r"A report consist of\s*(.*?)\bStep 3 Report Submission\b",
                component_text,
                re.I | re.S,
            )
            if match:
                for line in match.group(1).splitlines():
                    clean = re.sub(r"\s+", " ", line).strip(" \t-*–")
                    if re.fullmatch(r"week\s*9\s+to\s+week\s*16", clean, re.I):
                        if components:
                            components[-1] += " (Weeks 9–16)"
                    elif clean:
                        components.append(clean)
        if components:
            components[0] = re.sub(r"^Cover$", "Report cover", components[0], flags=re.I)
            answer = (
                "**Internship Report — Part 2**\n\n"
                "The available briefing lists these report components:\n\n"
                + "\n".join(f"{index}. {component}" for index, component in enumerate(components, 1))
            )
            if any("ONE PDF" in text for text in texts):
                answer += "\n\nThe briefing weights Weeks 9–16 logbooks and the internship report at **50% each**. Combine the components into **one PDF**. Company documents need the supervisor’s signature and stamp; the mentor visit report needs your mentor’s signature."
            return answer, "apu_grounded"

    if re.search(r"\b(document|documents|form|forms|paperwork)\b", question_lower) and re.search(
        r"\b(before|prior|starting|commencement)\b", question_lower
    ) and "part 2" not in question_lower:
        if "Job Offer Letter" in all_text and "Indemnity letter" in all_text and "Internship Placement Agreement" in all_text:
            return (
                "**Documents Before Placement**\n\n"
                "The available placement briefing lists:\n\n"
                "- **Company job-offer letter**, on company letterhead and stamped.\n"
                "- **Indemnity letter.**\n"
                "- **Internship Placement Agreement.** The briefing says you sign it first, then your company supervisor signs and stamps it, and your mentor signs it.\n\n"
                "Check with your mentor for the current submission process and any intake-specific requirements."
            ), "apu_grounded"

    if re.search(r"\blog[\s-]?book\b", question_lower):
        relevant = next(
            (text for text in texts if "record the daily internship activities" in text.lower()),
            "",
        )
        if relevant or any("Accurate record of work conducted" in text for text in texts):
            return (
                "**Purpose of the Internship Logbook**\n\n"
                "Use it to keep a regular record of your internship work, learning, and experience. "
                "The briefing says to record work accurately each week, including assigned tasks, solutions, "
                "and discussions. Keep it up to date and have your company supervisor sign and stamp it as required."
            ), "apu_grounded"

    if re.search(r"\b(cannot|can't|unable|fail|secure)\b", question_lower) and re.search(r"\b(internship|placement)\b", question_lower):
        relevant = next(
            (text for text in texts if "Not able to secure a placement" in text),
            "",
        )
        if relevant:
            answer = (
                "**If You Haven’t Secured a Placement**\n\n"
                "The available placement briefing recommends starting your search early, applying through job portals "
                "and other websites, and contacting your mentor for guidance. It warns that not securing a company "
                "before the placement start date may result in a Fail. Timelines and requirements can change, so "
                "confirm the current timeline and rules with your mentor."
            )
            return answer, "apu_grounded"

    if re.search(r"\b(sign|signed|signature|signs)\b", question_lower) and re.search(
        r"\bagreement\b", question_lower
    ):
        if re.search(r"\b(student|supervisor|mentor|company)\b", all_text, re.I):
            return (
                "**Internship Placement Agreement Signatures**\n\n"
                "The available APU placement guidance says you should sign the agreement first, then ask your "
                "company supervisor to sign and stamp it, and your mentor to sign it."
            ), "apu_grounded"

    if re.search(r"\b(find|search|apply|application)\b", question_lower) and re.search(
        r"\b(internship|placement)\b", question_lower
    ):
        target = ""
        if re.search(r"\bsoftware\b", question_lower):
            target = " For software roles, prepare a small project you can explain and practise the tools named in each job description."
        if re.search(r"\b(kuala lumpur|kl)\b", question_lower):
            target += " Filter searches by Kuala Lumpur and check each employer’s own careers page; this guidance does not verify current vacancies."
        answer = (
            "**Finding an Internship**\n\n"
            "1. **Start early:** The available placement briefing recommends beginning your search about four months "
            "before the placement start date.\n"
            "2. **Search widely:** The briefing recommends job portals and other job websites. As general options, "
            "try LinkedIn, JobStreet, and employer career pages; these are not APU requirements.\n"
            "3. **Prepare for each role:** Tailor your CV to the position and highlight relevant projects and skills.\n"
            "4. **Ask for support:** Contact your mentor early if you need help with your search.\n\n"
            "**Important:** The placement guidance warns that not securing a company before the placement start date may result in a Fail. Confirm the current intake’s rules with your mentor.\n\n"
            "Confirm the current intake’s timeline with your mentor."
        )
        answer += target
        return answer, "mixed_guidance"

    if not contexts:
        return (
            "I couldn’t find this specific requirement in the available APU documents. "
            "Please confirm it with your academic mentor or the Career Centre."
        ), "knowledge_gap"

    if _has_old_dates(contexts):
        return (
            "The available documents include dated guidance, but they do not clearly confirm the current requirement. "
            "Please check with your academic mentor or the Career Centre before relying on it."
        ), "knowledge_gap"
    return (
        "I couldn’t confirm this specific requirement from the available APU documents. "
        "Please check with your academic mentor or the Career Centre."
    ), "knowledge_gap"


def _attachment_answer(attachment_text: str, attachment_name: str | None) -> str:
    words = re.findall(r"\b[\w'-]+\b", attachment_text)
    paragraphs = [part.strip() for part in re.split(r"\n{2,}", attachment_text) if part.strip()]
    label = Path(attachment_name or "your file").name
    return (
        f"**File received: {label}**\n\n"
        f"I could extract about **{len(words)} words** across {len(paragraphs)} text sections. "
        "I can’t provide an automated quality review without a language-analysis service. "
        "You can ask me to check a specific detail against the APU internship documents."
    )


def sources_for_answer(
    question: str,
    contexts: list[dict[str, Any]],
    mode: str,
) -> list[dict[str, Any]]:
    if mode not in {"apu_grounded", "mixed_guidance"}:
        return []
    question_lower = question.lower()
    if re.search(r"\bpart\s*2\b", question_lower):
        relevant = [
            item for item in contexts
            if re.search(r"\bweek 9 to week 16\b", item["text"], re.I)
            or ("report consist of" in item["text"].lower() and "IT001-4-3" in item["text"])
        ]
    elif re.search(r"\b(document|documents|form|forms|paperwork)\b", question_lower) and re.search(
        r"\b(before|prior|starting|commencement)\b", question_lower
    ):
        relevant = [item for item in contexts if "Job Offer Letter" in item["text"]][:1]
    elif re.search(r"\bcgpa\b", question_lower):
        relevant = [item for item in contexts if "CGPA" in item["text"] and "PASS/FAIL" in item["text"]]
    elif "logbook" in question_lower or "log-book" in question_lower:
        relevant = [
            item for item in contexts
            if "logbook" in item["text"].lower() or "log-book" in item["text"].lower()
        ][:2]
    elif "agreement" in question_lower:
        relevant = [
            item for item in contexts
            if "Internship Placement Agreement" in item["text"]
            or "Internship/Industrial Placement Agreement Form" in item["text"]
        ][:2]
    elif re.search(r"\b(find|search|apply|application)\b", question_lower):
        relevant = [item for item in contexts if "apply for internship positions" in item["text"].lower()][:1]
    elif re.search(r"\b(cannot|can't|unable|fail|secure)\b", question_lower):
        relevant = [item for item in contexts if "Not able to secure a placement" in item["text"]][:1]
    else:
        relevant = contexts[:2]
    return relevant[:2]


def answer_question(
    question: str,
    contexts: list[dict[str, Any]],
    history: list[dict[str, str]],
    attachment_text: str | None = None,
    attachment_name: str | None = None,
) -> tuple[str, str]:
    if is_greeting(question) and not attachment_text:
        return "Hi! I can help with APU internship guidance and practical career questions. What would you like to work on?", "greeting"
    if attachment_text:
        return _attachment_answer(attachment_text, attachment_name), "attachment_review"
    general_topic = _general_topic(question)
    if general_topic:
        if general_topic == "internship_search" and contexts:
            return _grounded_answer(question, contexts)
        answer = GENERAL_ADVICE[general_topic]
        return answer, "general_guidance"
    if not contexts and not CORPUS_PATH.is_file():
        return (
            "APU-specific internship reference documents are not configured in this copy. "
            "I can still help with general career questions; please confirm internship requirements "
            "with your academic mentor or the Career Centre.",
            "knowledge_gap",
        )
    return _grounded_answer(question, contexts)
