def build_career_profile(analysis):
    skills = analysis.get("skills", [])

    education = analysis.get("education", "")
    experience = analysis.get("experience", "")
    projects = analysis.get("projects", "")
    certifications = analysis.get("certifications", "")

    profile = {
        "skills": skills,
        "skill_count": len(skills),

        "education": {
            "summary": education,
            "has_education": bool(education)
        },

        "experience": {
            "summary": experience,
            "has_experience": bool(experience)
        },

        "projects": {
            "summary": projects,
            "has_projects": bool(projects)
        },

        "certifications": {
            "summary": certifications,
            "has_certifications": bool(certifications)
        },

        "profile_completeness": calculate_profile_completeness(
            education=education,
            experience=experience,
            projects=projects,
            certifications=certifications,
            skills=skills
        )
    }

    return profile


def calculate_profile_completeness(
    education,
    experience,
    projects,
    certifications,
    skills
):
    total_sections = 5
    completed_sections = 0

    if education:
        completed_sections += 1

    if experience:
        completed_sections += 1

    if projects:
        completed_sections += 1

    if certifications:
        completed_sections += 1

    if skills:
        completed_sections += 1

    return round(
        (completed_sections / total_sections) * 100
    )