def calculate_match_score(user_skills, required_skills):
    user_skills = {
        skill.lower().strip()
        for skill in user_skills
    }

    required_skills = [
        skill.strip()
        for skill in required_skills
    ]

    if not required_skills:
        return {
            "match_score": 0,
            "matched_skills": [],
            "missing_skills": []
        }

    matched_skills = []
    missing_skills = []

    for skill in required_skills:
        if skill.lower() in user_skills:
            matched_skills.append(skill)
        else:
            missing_skills.append(skill)

    match_score = (
        len(matched_skills) /
        len(required_skills)
    ) * 100

    return {
        "match_score": round(match_score, 2),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills
    }