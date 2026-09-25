def normalize_skill(skill):
    """
    Normalize skill names so comparisons are consistent.
    """

    if not skill:
        return ""

    skill = str(skill).strip().lower()

    aliases = {
        "rest apis": "rest api",
        "rest api": "rest api",
        "restful api": "rest api",
        "restful apis": "rest api",
        "machine-learning": "machine learning",
        "machinelearning": "machine learning",
        "data structures and algorithms": "data structures",
        "dsa": "data structures",
        "js": "javascript",
        "nodejs": "node.js",
        "mysql database": "mysql",
        "scikit learn": "scikit-learn",
        "sklearn": "scikit-learn",
    }

    return aliases.get(skill, skill)


def extract_keywords_from_text(text):
    """
    Extract useful technical keywords from resume text.
    """

    if not text:
        return []

    text_lower = str(text).lower()

    known_keywords = [
        "python",
        "java",
        "javascript",
        "c++",
        "sql",
        "mysql",
        "react",
        "node.js",
        "flask",
        "django",
        "rest api",
        "git",
        "github",
        "data structures",
        "algorithms",
        "machine learning",
        "artificial intelligence",
        "nlp",
        "docker",
        "aws",
        "azure",
        "html",
        "css",
        "spring boot",
        "statistics",
        "data visualization",
        "mongodb",
        "pandas",
        "numpy",
        "scikit-learn",
        "tensorflow",
        "pytorch",
    ]

    detected = []

    for keyword in known_keywords:
        if keyword in text_lower:
            detected.append(keyword)

    return detected


def find_missing_keywords(
    user_skills,
    required_skills,
    resume_text=""
):
    """
    Find job-required skills that are missing from
    the user's current skill profile and resume.
    """

    normalized_user_skills = {
        normalize_skill(skill)
        for skill in user_skills
        if skill
    }

    normalized_required_skills = []

    for skill in required_skills:
        normalized = normalize_skill(skill)

        if normalized and normalized not in normalized_required_skills:
            normalized_required_skills.append(normalized)

    missing_skills = [
        skill
        for skill in normalized_required_skills
        if skill not in normalized_user_skills
    ]

    resume_keywords = set(
        extract_keywords_from_text(resume_text)
    )

    missing_from_resume = [
        skill
        for skill in missing_skills
        if skill not in resume_keywords
    ]

    return missing_skills, missing_from_resume


def generate_skill_highlights(
    user_skills,
    required_skills
):
    """
    Identify skills that should be emphasized because
    they match the target job.
    """

    normalized_user = {
        normalize_skill(skill)
        for skill in user_skills
        if skill
    }

    highlights = []

    for skill in required_skills:
        normalized = normalize_skill(skill)

        if normalized in normalized_user:
            highlights.append(skill)

    return highlights


def generate_keyword_suggestions(
    missing_skills,
    missing_from_resume
):
    """
    Generate keyword recommendations for the resume.
    """

    suggestions = []

    for skill in missing_from_resume:
        suggestions.append({
            "keyword": skill,
            "reason": (
                f"{skill} is required for the target role "
                "but is not currently visible in your resume."
            )
        })

    return suggestions


def generate_experience_suggestions(
    missing_skills
):
    """
    Generate suggestions for strengthening the experience
    section based on missing skills.
    """

    suggestions = []

    suggestion_templates = {
        "machine learning": (
            "Add a project or experience bullet demonstrating "
            "model training, evaluation, or prediction."
        ),
        "nlp": (
            "Highlight experience involving text processing, "
            "classification, embeddings, or language models."
        ),
        "docker": (
            "Mention containerizing and deploying an application "
            "using Docker."
        ),
        "aws": (
            "Highlight cloud deployment or AWS services used "
            "in your projects."
        ),
        "spring boot": (
            "Add backend project experience using Spring Boot "
            "and REST APIs."
        ),
        "javascript": (
            "Highlight JavaScript functionality implemented "
            "in frontend or full-stack projects."
        ),
        "react": (
            "Mention React components, state management, "
            "routing, or API integration used in projects."
        ),
        "node.js": (
            "Highlight backend APIs or server-side applications "
            "built with Node.js."
        ),
        "statistics": (
            "Mention statistical analysis, hypothesis testing, "
            "or data analysis experience."
        ),
        "data visualization": (
            "Highlight dashboards, charts, or visual analytics "
            "created using relevant tools."
        ),
        "python": (
            "Highlight Python development, automation, data "
            "processing, APIs, or backend work."
        ),
        "java": (
            "Highlight Java applications, backend development, "
            "object-oriented programming, or problem solving."
        ),
        "sql": (
            "Mention database queries, joins, optimization, "
            "schema design, or data analysis performed using SQL."
        ),
        "mysql": (
            "Highlight MySQL database design, queries, "
            "transactions, or application integration."
        ),
        "git": (
            "Mention Git-based version control, branching, "
            "collaboration, or repository management."
        ),
    }

    for skill in missing_skills:
        normalized = normalize_skill(skill)

        if normalized in suggestion_templates:
            suggestions.append({
                "skill": skill,
                "suggestion": suggestion_templates[normalized]
            })

    return suggestions


def generate_project_suggestions(
    missing_skills
):
    """
    Suggest project ideas that can demonstrate missing skills.
    """

    suggestions = []

    project_templates = {
        "machine learning": (
            "Build a machine learning project that includes "
            "data preprocessing, model training, evaluation, "
            "and prediction."
        ),
        "nlp": (
            "Build an NLP project such as sentiment analysis, "
            "resume classification, or text categorization."
        ),
        "docker": (
            "Containerize one of your existing applications "
            "and document the Docker deployment process."
        ),
        "aws": (
            "Deploy a full-stack project on AWS and document "
            "the architecture and deployment process."
        ),
        "spring boot": (
            "Build a REST API using Spring Boot with MySQL "
            "and authentication."
        ),
        "javascript": (
            "Build an interactive frontend project using "
            "modern JavaScript."
        ),
        "react": (
            "Build a React application consuming a REST API "
            "with routing and reusable components."
        ),
        "node.js": (
            "Build a Node.js REST API connected to a database."
        ),
        "statistics": (
            "Create a data-analysis project using statistical "
            "methods to identify meaningful patterns."
        ),
        "data visualization": (
            "Create an analytics dashboard with interactive "
            "charts and meaningful business insights."
        ),
        "python": (
            "Build a Python application that solves a practical "
            "problem and demonstrates clean architecture and APIs."
        ),
        "java": (
            "Build a Java application demonstrating object-oriented "
            "programming, collections, exception handling, and APIs."
        ),
        "sql": (
            "Build a database-driven application demonstrating "
            "complex SQL queries, joins, aggregation, and database design."
        ),
        "mysql": (
            "Create a MySQL-backed application with relational "
            "schema design, CRUD operations, and optimized queries."
        ),
    }

    for skill in missing_skills:
        normalized = normalize_skill(skill)

        if normalized in project_templates:
            suggestions.append({
                "skill": skill,
                "suggestion": project_templates[normalized]
            })

    return suggestions


def has_content(value):
    """
    Safely determine whether a resume section contains
    meaningful content.
    """

    if value is None:
        return False

    if isinstance(value, str):
        return bool(value.strip())

    if isinstance(value, (list, tuple, set, dict)):
        return len(value) > 0

    return bool(value)


def generate_general_suggestions(
    resume_text="",
    education=None,
    experience=None,
    projects=None,
    certifications=None,
    missing_skills=None
):
    """
    Generate general resume improvement suggestions based
    on the actual resume structure.
    """

    suggestions = []

    if not has_content(resume_text):
        suggestions.append(
            "Upload a readable resume so HireLens can analyze "
            "your education, experience, projects, and skills."
        )

    if not has_content(education):
        suggestions.append(
            "Add a clear education section with your degree, "
            "institution, specialization, and expected graduation."
        )

    if not has_content(experience):
        suggestions.append(
            "Add practical experience, internships, freelance work, "
            "or substantial project experience where applicable."
        )

    if not has_content(projects):
        suggestions.append(
            "Add at least one strong technical project demonstrating "
            "skills relevant to your target role."
        )

    if not has_content(certifications):
        suggestions.append(
            "Add relevant certifications or structured courses "
            "that support your target role."
        )

    suggestions.extend([
        "Keep the resume focused on the target role.",
        "Place the most relevant technical skills near the top.",
        "Use measurable results in experience and project bullets.",
        "Use action-oriented language such as built, developed, "
        "implemented, optimized, automated, and deployed.",
        "Avoid listing technologies that you cannot explain during "
        "an interview.",
    ])

    if missing_skills:
        suggestions.append(
            "Where you genuinely have experience with missing job "
            "skills, add those technologies to the relevant project "
            "or experience bullets using specific evidence."
        )

    return suggestions


def calculate_resume_quality(
    resume_text="",
    education=None,
    experience=None,
    projects=None,
    certifications=None
):
    """
    Calculate the structural quality of the resume.
    """

    quality = {
        "has_resume_text": has_content(resume_text),
        "has_education": has_content(education),
        "has_experience": has_content(experience),
        "has_projects": has_content(projects),
        "has_certifications": has_content(certifications),
    }

    completed_sections = sum(
        1
        for value in quality.values()
        if value
    )

    quality["sections_completed"] = completed_sections
    quality["total_sections"] = len(quality)

    quality["completion_percentage"] = round(
        (
            completed_sections /
            len(quality)
        ) * 100
    )

    return quality


def generate_resume_improvement(
    user_skills,
    required_skills,
    resume_text="",
    education=None,
    experience=None,
    projects=None,
    certifications=None
):
    """
    Main resume improvement engine.

    Compares the candidate's:
    - current skills
    - resume text
    - education
    - experience
    - projects
    - certifications

    against the requirements of a target job.
    """

    user_skills = user_skills or []
    required_skills = required_skills or []

    # ---------------------------------------------------------
    # 1. Find missing skills and resume keywords
    # ---------------------------------------------------------

    missing_skills, missing_from_resume = find_missing_keywords(
        user_skills,
        required_skills,
        resume_text
    )

    # ---------------------------------------------------------
    # 2. Find matched skills
    # ---------------------------------------------------------

    matched_skills = []

    normalized_user = {
        normalize_skill(skill)
        for skill in user_skills
        if skill
    }

    for skill in required_skills:
        if normalize_skill(skill) in normalized_user:
            matched_skills.append(skill)

    # ---------------------------------------------------------
    # 3. Skills that should be highlighted
    # ---------------------------------------------------------

    skill_highlights = generate_skill_highlights(
        user_skills,
        required_skills
    )

    # ---------------------------------------------------------
    # 4. Keyword suggestions
    # ---------------------------------------------------------

    keyword_suggestions = generate_keyword_suggestions(
        missing_skills,
        missing_from_resume
    )

    # ---------------------------------------------------------
    # 5. Experience suggestions
    # ---------------------------------------------------------

    experience_suggestions = generate_experience_suggestions(
        missing_skills
    )

    # ---------------------------------------------------------
    # 6. Project suggestions
    # ---------------------------------------------------------

    project_suggestions = generate_project_suggestions(
        missing_skills
    )

    # ---------------------------------------------------------
    # 7. Skill match percentage
    # ---------------------------------------------------------

    required_count = len(required_skills)
    matched_count = len(matched_skills)

    match_percentage = (
        round((matched_count / required_count) * 100)
        if required_count > 0
        else 0
    )

    # ---------------------------------------------------------
    # 8. Improvement priority
    # ---------------------------------------------------------

    improvement_priority = []

    high_priority_skills = {
        "machine learning",
        "artificial intelligence",
        "nlp",
        "python",
        "java",
        "javascript",
        "react",
        "sql",
        "data structures",
        "algorithms",
    }

    medium_priority_skills = {
        "docker",
        "aws",
        "azure",
        "spring boot",
        "mysql",
        "statistics",
        "data visualization",
    }

    for skill in missing_skills:
        normalized = normalize_skill(skill)

        if normalized in high_priority_skills:
            priority = "High"
        elif normalized in medium_priority_skills:
            priority = "Medium"
        else:
            priority = "Low"

        improvement_priority.append({
            "skill": skill,
            "priority": priority
        })

    # ---------------------------------------------------------
    # 9. General resume suggestions
    # ---------------------------------------------------------

    general_suggestions = generate_general_suggestions(
        resume_text=resume_text,
        education=education,
        experience=experience,
        projects=projects,
        certifications=certifications,
        missing_skills=missing_skills
    )

    # ---------------------------------------------------------
    # 10. Resume quality
    # ---------------------------------------------------------

    resume_quality = calculate_resume_quality(
        resume_text=resume_text,
        education=education,
        experience=experience,
        projects=projects,
        certifications=certifications
    )

    # ---------------------------------------------------------
    # 11. Final result
    # ---------------------------------------------------------

    return {
        "summary": {
            "required_skills": required_count,
            "matched_skills": matched_count,
            "missing_skills": len(missing_skills),
            "missing_keywords": len(missing_from_resume),
            "skill_match_percentage": match_percentage,
        },

        "matched_skills": matched_skills,

        "missing_skills": missing_skills,

        "skills_to_highlight": skill_highlights,

        "missing_keywords": keyword_suggestions,

        "experience_suggestions": experience_suggestions,

        "project_suggestions": project_suggestions,

        "improvement_priority": improvement_priority,

        "general_suggestions": general_suggestions,

        "resume_quality": resume_quality,
    }