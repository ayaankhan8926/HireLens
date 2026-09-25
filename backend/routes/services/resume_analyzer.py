import re


SKILL_KEYWORDS = {
    "Python": ["python"],
    "Java": ["java"],
    "JavaScript": ["javascript", "js"],
    "C++": ["c++"],
    "C": ["c programming", "c language"],
    "SQL": ["sql", "mysql", "postgresql"],
    "React": ["react", "react.js"],
    "Node.js": ["node.js", "nodejs"],
    "Flask": ["flask"],
    "Django": ["django"],
    "HTML": ["html"],
    "CSS": ["css"],
    "Git": ["git", "github"],
    "REST API": ["rest api", "restful api", "rest apis"],
    "Data Structures": [
        "data structures",
        "data structure",
        "dsa"
    ],
    "Algorithms": ["algorithms", "algorithm"],
    "Machine Learning": [
        "machine learning",
        "machine-learning",
        "ml"
    ],
    "Artificial Intelligence": [
        "artificial intelligence",
        "artificial intelligence",
        "ai"
    ],
    "NLP": [
        "natural language processing",
        "nlp"
    ],
    "Docker": ["docker"],
    "AWS": ["aws", "amazon web services"],
    "Azure": ["azure", "microsoft azure"],
    "MongoDB": ["mongodb", "mongo db"],
    "MySQL": ["mysql"],
    "GitHub": ["github"],
}


def extract_skills(text):
    if not text:
        return []

    normalized_text = text.lower()

    detected_skills = []

    for skill_name, keywords in SKILL_KEYWORDS.items():

        for keyword in keywords:
            pattern = r"(?<!\w)" + re.escape(keyword.lower()) + r"(?!\w)"

            if re.search(pattern, normalized_text):
                detected_skills.append(skill_name)
                break

    return sorted(set(detected_skills))