"""Central programme catalogue and optional opportunity-search suggestions."""

from __future__ import annotations

import re
from typing import Any


PROGRAMMES: tuple[dict[str, Any], ...] = (
    {
        "id": "computer-science",
        "name": "BSc (Hons) in Computer Science",
        "level": "Bachelor's degree",
        "faculty": "Computing",
        "skills": ["Python", "Artificial Intelligence", "Machine Learning", "Algorithms", "Data Structures", "Databases", "Computer Vision", "Data Analysis"],
        "searchKeywords": ["Computer Science", "Software Developer", "Data Science"],
        "active": True,
        "catalogueSource": "Existing APU NEXT alumni records",
        "officiallyVerified": False,
    },
    {
        "id": "computer-science-cyber-security",
        "name": "BSc (Hons) in Computer Science (Cyber Security)",
        "level": "Bachelor's degree",
        "faculty": "Computing",
        "skills": ["Cybersecurity", "Network Security", "Penetration Testing", "Linux", "Python", "Information Security"],
        "searchKeywords": ["Cyber Security", "Information Security", "Security Analyst"],
        "active": True,
        "catalogueSource": "Existing APU NEXT alumni records",
        "officiallyVerified": False,
    },
    {
        "id": "computer-science-intelligent-systems",
        "name": "BSc (Hons) in Computer Science (Intelligent Systems)",
        "level": "Bachelor's degree",
        "faculty": "Computing",
        "skills": ["Artificial Intelligence", "Machine Learning", "Python", "Algorithms", "Data Analysis", "Computer Vision"],
        "searchKeywords": ["Intelligent Systems", "Artificial Intelligence", "Machine Learning"],
        "active": True,
        "catalogueSource": "Existing APU NEXT alumni records",
        "officiallyVerified": False,
    },
    {
        "id": "software-engineering",
        "name": "BSc (Hons) in Software Engineering",
        "level": "Bachelor's degree",
        "faculty": "Computing",
        "skills": ["C#", "Java", "Python", "PHP", "JavaScript", "React", "SQL", "Software Development", "Web Development", "Software Testing"],
        "searchKeywords": ["Software Engineering", "Software Developer", "Software Development"],
        "active": True,
        "catalogueSource": "Existing APU NEXT alumni and student profile records",
        "officiallyVerified": False,
    },
    {
        "id": "information-technology-cloud-computing",
        "name": "BSc (Hons) in Information Technology (Cloud Computing)",
        "level": "Bachelor's degree",
        "faculty": "Computing",
        "skills": ["Cloud Computing", "AWS", "Microsoft Azure", "Linux", "Networking", "SQL"],
        "searchKeywords": ["Cloud Computing", "Cloud Engineer", "Information Technology"],
        "active": True,
        "catalogueSource": "Existing APU NEXT alumni records",
        "officiallyVerified": False,
    },
    {
        "id": "accounting-finance-fintech",
        "name": "BA (Hons) in Accounting and Finance (FinTech)",
        "level": "Bachelor's degree",
        "faculty": "Business",
        "skills": ["Accounting", "Financial Analysis", "Microsoft Excel", "Auditing", "Financial Reporting", "Budgeting", "FinTech"],
        "searchKeywords": ["Accounting", "Finance", "FinTech"],
        "active": True,
        "catalogueSource": "Existing APU NEXT alumni records",
        "officiallyVerified": False,
    },
    {
        "id": "data-analytics",
        "name": "BSc (Hons) in Data Analytics",
        "level": "Bachelor's degree",
        "faculty": "Computing",
        "skills": ["Python", "SQL", "Data Analysis", "Microsoft Excel", "Power BI", "Statistics", "Data Visualization"],
        "searchKeywords": ["Data Analytics", "Data Analyst", "Business Intelligence"],
        "active": True,
        "catalogueSource": "Existing APU NEXT alumni records",
        "officiallyVerified": False,
    },
    {
        "id": "human-resource-management",
        "name": "Bachelor of Arts (Honours) in Human Resource Management",
        "level": "Bachelor's degree",
        "faculty": "Business",
        "skills": ["Recruitment", "Talent Acquisition", "Human Resources", "Employee Engagement", "HR Administration", "Learning and Development", "Payroll Administration"],
        "searchKeywords": ["Human Resources", "HR", "Talent Acquisition", "Recruitment"],
        "active": True,
        "catalogueSource": "Existing APU NEXT student profile records",
        "officiallyVerified": False,
    },
)

_BY_ID = {programme["id"]: programme for programme in PROGRAMMES}


def get_programme(programme_id: str | None) -> dict[str, Any] | None:
    return _BY_ID.get((programme_id or "").strip())


def infer_programme_id(*values: str) -> str | None:
    normalized = re.sub(r"[^a-z0-9]+", " ", " ".join(values).lower()).strip()
    if not normalized:
        return None
    for programme in PROGRAMMES:
        name = re.sub(r"[^a-z0-9]+", " ", programme["name"].lower()).strip()
        if name in normalized or normalized in name:
            return programme["id"]
    if "software engineering" in normalized:
        return "software-engineering"
    if "human resource" in normalized or re.search(r"\bhrm\b", normalized):
        return "human-resource-management"
    if "cyber security" in normalized:
        return "computer-science-cyber-security"
    if "intelligent systems" in normalized:
        return "computer-science-intelligent-systems"
    if "cloud computing" in normalized:
        return "information-technology-cloud-computing"
    if "fintech" in normalized or ("accounting" in normalized and "finance" in normalized):
        return "accounting-finance-fintech"
    if "data analytics" in normalized:
        return "data-analytics"
    if "computer science" in normalized:
        return "computer-science"
    return None
