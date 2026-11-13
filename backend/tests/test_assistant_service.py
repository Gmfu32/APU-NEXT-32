import unittest
from pathlib import Path
from unittest.mock import patch

from app import assistant_service


@unittest.skipUnless(
    assistant_service.CORPUS_PATH.is_file(),
    "APU-specific source corpus is intentionally excluded from the public repository",
)
class AssistantAnswerTests(unittest.TestCase):
    def answer(self, question: str) -> tuple[str, str, list[dict[str, object]]]:
        contexts = (
            assistant_service.retrieve_context(question)
            if assistant_service.should_retrieve_context(question)
            else []
        )
        answer, mode = assistant_service.answer_question(question, contexts, [])
        return answer, mode, assistant_service.sources_for_answer(question, contexts, mode)

    def test_internship_search_combines_apu_and_general_guidance(self) -> None:
        answer, mode, sources = self.answer("How do I find an internship?")

        self.assertEqual(mode, "mixed_guidance")
        self.assertIn("Start early", answer)
        self.assertIn("Tailor your CV", answer)
        self.assertIn("may result in a Fail", answer)
        self.assertIn("LinkedIn", answer)
        self.assertIn("Confirm the current intake’s rules", answer)
        self.assertNotIn("2025", answer)
        self.assertEqual(len(sources), 1)
        self.assertEqual(sources[0]["location"], "Slide 20")
        self.assertNotIn("relevant passages", answer.lower())

    def test_cgpa_answer_is_concise_and_grounded(self) -> None:
        answer, mode, sources = self.answer("Does internship count towards my CGPA?")

        self.assertEqual(mode, "apu_grounded")
        self.assertIn("Pass/Fail", answer)
        self.assertIn("not included in the CGPA calculation", answer)
        self.assertEqual([source["location"] for source in sources], ["Slide 7"])

    def test_part_two_answer_formats_all_report_components(self) -> None:
        answer, mode, sources = self.answer("What documents do I need to submit for Part 2?")

        self.assertEqual(mode, "apu_grounded")
        for expected in (
            "Report cover",
            "Industrial Placement Report",
            "Report Clearance Form",
            "EIGHT weekly log books (Weeks 9–16)",
            "Attendance Sheet",
            "Company Supervisor Assessment Form",
            "Mentor Visit Report",
            "one PDF",
        ):
            self.assertIn(expected, answer)
        self.assertNotIn("Part 1", answer)
        self.assertEqual({source["location"] for source in sources}, {"Slide 40", "Slide 41"})

    def test_preplacement_documents_are_presented_as_a_checklist(self) -> None:
        answer, mode, sources = self.answer("What documents do I need before placement?")

        self.assertEqual(mode, "apu_grounded")
        self.assertIn("Company job-offer letter", answer)
        self.assertIn("Indemnity letter", answer)
        self.assertIn("Internship Placement Agreement", answer)
        self.assertEqual(sources[0]["location"], "Slide 23")

    def test_logbook_purpose_is_paraphrased(self) -> None:
        answer, mode, sources = self.answer("What is the purpose of the internship logbook?")

        self.assertEqual(mode, "apu_grounded")
        self.assertIn("regular record", answer)
        self.assertIn("assigned tasks", answer)
        self.assertNotIn("Industrial Supervisor’s signature & stamp: ____", answer)
        self.assertTrue(sources)

    def test_unsecured_placement_warning_includes_current_rules_caveat(self) -> None:
        answer, mode, sources = self.answer("What happens if I cannot secure an internship?")

        self.assertEqual(mode, "apu_grounded")
        self.assertIn("may result in a Fail", answer)
        self.assertIn("confirm the current timeline and rules", answer)
        self.assertNotIn("2025", answer)
        self.assertEqual(sources[0]["location"], "Slide 20")

    def test_interview_advice_does_not_retrieve_irrelevant_policy(self) -> None:
        answer, mode, sources = self.answer("How do I prepare for an internship interview?")

        self.assertEqual(mode, "general_guidance")
        self.assertIn("Practise explaining your projects", answer)
        self.assertEqual(sources, [])
        self.assertNotIn("APU policy", answer)

    def test_kuala_lumpur_software_search_is_general_and_has_no_vacancy_claim(self) -> None:
        answer, mode, _ = self.answer("How can I find a software engineering internship in Kuala Lumpur?")

        self.assertEqual(mode, "mixed_guidance")
        self.assertIn("Kuala Lumpur", answer)
        self.assertIn("software roles", answer)
        self.assertIn("does not verify current vacancies", answer)

    def test_agreement_signers_are_grounded(self) -> None:
        answer, mode, sources = self.answer("Who signs the Internship Placement Agreement?")

        self.assertEqual(mode, "apu_grounded")
        self.assertIn("you should sign the agreement first", answer)
        self.assertIn("company supervisor", answer)
        self.assertIn("mentor", answer)
        self.assertTrue(sources)

    def test_unknown_policy_does_not_invent_an_answer(self) -> None:
        answer, mode, sources = self.answer("What is the current internship deadline for my programme?")

        self.assertEqual(mode, "knowledge_gap")
        self.assertIn("couldn’t confirm this specific requirement", answer)
        self.assertEqual(sources, [])

    def test_attachment_response_does_not_claim_automated_review(self) -> None:
        answer, mode = assistant_service.answer_question(
            "Please review this file.",
            [],
            [],
            "My internship CV content with education and project sections.",
            "cv.txt",
        )

        self.assertEqual(mode, "attachment_review")
        self.assertIn("automated quality review", answer)
        self.assertNotIn("Gemini", answer)


class AssistantMissingCorpusTests(unittest.TestCase):
    def test_missing_corpus_returns_a_safe_knowledge_gap(self) -> None:
        question = "What is the current internship deadline for my programme?"
        missing_path = Path("missing-test-corpus.json")
        with patch.object(assistant_service, "CORPUS_PATH", missing_path):
            assistant_service.load_corpus.cache_clear()
            try:
                contexts = assistant_service.retrieve_context(question)
                answer, mode = assistant_service.answer_question(question, contexts, [])
            finally:
                assistant_service.load_corpus.cache_clear()

        self.assertEqual(contexts, [])
        self.assertEqual(mode, "knowledge_gap")
        self.assertIn("not configured", answer)


if __name__ == "__main__":
    unittest.main()
