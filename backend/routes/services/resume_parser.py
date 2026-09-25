import re


SECTION_NAMES = {
    "education": [
        "education",
        "academic background",
        "academic qualifications"
    ],
    "experience": [
        "experience",
        "work experience",
        "professional experience",
        "employment"
    ],
    "projects": [
        "projects",
        "academic projects",
        "personal projects"
    ],
    "certifications": [
        "certifications",
        "certificates",
        "certifications & courses"
    ],
    "skills": [
        "skills",
        "technical skills",
        "core skills",
        "key skills"
    ]
}


def normalize_text(text):
    if not text:
        return ""

    text = text.replace("\r\n", "\n")
    text = text.replace("\r", "\n")

    return text.strip()


def clean_section_heading(line):
    line = line.strip().lower()

    line = re.sub(
        r"[^a-zA-Z0-9 &+#.-]",
        "",
        line
    )

    return line


def is_section_heading(line):
    cleaned_line = clean_section_heading(line)

    for section_keywords in SECTION_NAMES.values():
        for keyword in section_keywords:
            if cleaned_line == keyword:
                return True

    return False


def find_section(text, section_keywords):
    lines = text.split("\n")

    start_index = None

    for index, line in enumerate(lines):
        cleaned_line = clean_section_heading(line)

        for keyword in section_keywords:
            if cleaned_line == keyword:
                start_index = index
                break

        if start_index is not None:
            break

    if start_index is None:
        return ""

    section_lines = []

    for index in range(start_index + 1, len(lines)):
        current_line = lines[index].strip()

        if not current_line:
            continue

        if is_section_heading(current_line):
            break

        section_lines.append(current_line)

    return "\n".join(section_lines).strip()


def extract_resume_sections(text):
    text = normalize_text(text)

    if not text:
        return {
            "education": "",
            "experience": "",
            "projects": "",
            "certifications": "",
            "skills": ""
        }

    return {
        "education": find_section(
            text,
            SECTION_NAMES["education"]
        ),
        "experience": find_section(
            text,
            SECTION_NAMES["experience"]
        ),
        "projects": find_section(
            text,
            SECTION_NAMES["projects"]
        ),
        "certifications": find_section(
            text,
            SECTION_NAMES["certifications"]
        ),
        "skills": find_section(
            text,
            SECTION_NAMES["skills"]
        )
    }