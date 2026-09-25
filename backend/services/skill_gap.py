def analyze_skill_gap(user_skills, required_skills):
    """
    Compare the user's current skills with the skills
    required by a job.
    """

    user_skill_map = {
        skill.strip().lower(): skill.strip()
        for skill in user_skills
    }

    required_skill_list = [
        skill.strip()
        for skill in required_skills
    ]

    matched_skills = []
    missing_skills = []

    for skill in required_skill_list:
        normalized_skill = skill.lower()

        if normalized_skill in user_skill_map:
            matched_skills.append(
                user_skill_map[normalized_skill]
            )
        else:
            missing_skills.append(skill)

    total_required = len(required_skill_list)
    total_matched = len(matched_skills)

    if total_required == 0:
        gap_percentage = 0
    else:
        gap_percentage = round(
            (len(missing_skills) / total_required) * 100,
            2
        )

    return {
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "total_required_skills": total_required,
        "total_matched_skills": total_matched,
        "total_missing_skills": len(missing_skills),
        "skill_gap_percentage": gap_percentage
    }