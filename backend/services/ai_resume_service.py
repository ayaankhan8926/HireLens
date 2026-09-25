import os

from google import genai
from google.genai import types
from pydantic import BaseModel, Field


# ==========================================================
# STRUCTURED AI RESPONSE MODELS
# ==========================================================

class ImprovementItem(BaseModel):
    area: str = Field(
        description="Resume area that should be improved."
    )

    suggestion: str = Field(
        description="Specific actionable improvement."
    )

    priority: str = Field(
        description="Priority: High, Medium, or Low."
    )


class KeywordSuggestion(BaseModel):
    keyword: str = Field(
        description="Relevant keyword from the target job."
    )

    reason: str = Field(
        description="Why this keyword matters for the target job."
    )


class BulletImprovement(BaseModel):
    context: str = Field(
        description="Experience or project context."
    )

    improved_bullet: str = Field(
        description=(
            "Improved resume bullet using only "
            "evidence from the original resume."
        )
    )


class ProjectSuggestion(BaseModel):
    title: str = Field(
        description="Suggested future project title."
    )

    why_it_helps: str = Field(
        description=(
            "Why this project would strengthen "
            "the candidate for the target role."
        )
    )

    skills: list[str] = Field(
        description="Skills demonstrated by the project."
    )


class AIResumeAnalysis(BaseModel):

    professional_summary: str = Field(
        description=(
            "Concise job-targeted professional summary "
            "based only on the candidate's real background."
        )
    )

    top_improvements: list[ImprovementItem] = Field(
        description="Most important resume improvements."
    )

    keyword_suggestions: list[KeywordSuggestion] = Field(
        description="Relevant keywords to incorporate naturally."
    )

    experience_bullet_improvements: list[
        BulletImprovement
    ] = Field(
        description=(
            "Improved experience bullets based only "
            "on evidence from the resume."
        )
    )

    project_suggestions: list[ProjectSuggestion] = Field(
        description=(
            "Future projects that could address skill gaps."
        )
    )

    general_advice: list[str] = Field(
        description="Additional practical resume advice."
    )

    warnings: list[str] = Field(
        description="Important resume risks or warnings."
    )


# ==========================================================
# GEMINI CONFIGURATION
# ==========================================================

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.8-flash"
)


# ==========================================================
# BUILD PROMPT
# ==========================================================

def build_resume_prompt(
    resume_text,
    job_title,
    company,
    job_description,
    user_skills,
    required_skills,
    matched_skills,
    missing_skills,
    resume_sections
):

    return f"""
You are HireLens Resume Intelligence AI.

Analyze a candidate's REAL resume against a specific
target job.

Your output will be used by HireLens to provide
professional resume improvement recommendations.


TARGET JOB
==========

Job Title:
{job_title}

Company:
{company}


JOB DESCRIPTION
===============

{job_description or "No job description provided."}


CANDIDATE SKILLS
================

{", ".join(user_skills) if user_skills else "None provided"}


REQUIRED JOB SKILLS
===================

{", ".join(required_skills) if required_skills else "None provided"}


MATCHED SKILLS
==============

{", ".join(matched_skills) if matched_skills else "None"}


MISSING SKILLS
==============

{", ".join(missing_skills) if missing_skills else "None"}


RESUME SECTIONS
===============

EDUCATION:
{resume_sections.get("education", "")}

EXPERIENCE:
{resume_sections.get("experience", "")}

PROJECTS:
{resume_sections.get("projects", "")}

CERTIFICATIONS:
{resume_sections.get("certifications", "")}

SKILLS:
{resume_sections.get("skills", "")}


FULL RESUME
===========

{resume_text}


STRICT ACCURACY RULES
=====================

1. Analyze only information contained in the supplied resume.

2. NEVER invent:

- companies
- employers
- job titles
- internships
- years of experience
- certifications
- technologies
- achievements
- responsibilities
- awards
- metrics
- percentages
- project results

3. Never convert a missing skill into an existing skill.

4. Never claim professional experience with a technology
   unless the resume supports it.

5. Never fabricate numerical results.

6. If a resume bullet has no verified metrics, improve
   the wording without inventing numbers.

7. Experience bullet improvements must preserve the
   original meaning.

8. Do not exaggerate seniority.

9. Do not call the candidate an expert without evidence.

10. Missing skills are skill-gap information, not proof
    that the candidate is unqualified.

11. Project suggestions are FUTURE suggestions.

12. Never imply a suggested project has already been built.

13. Avoid keyword stuffing.

14. Keywords must be relevant to the target job.

15. Do not recommend unsupported technologies as existing
    candidate skills.

16. Keep the professional summary concise.

17. Prioritize the most useful improvements.

18. Do not invent weaknesses in sections that are already
    reasonably strong.

19. If information is uncertain, preserve the original
    meaning instead of guessing.

20. The final result must remain truthful and suitable
    for a real job application.


PROFESSIONAL SUMMARY
====================

Create a concise 2-4 sentence professional summary.

Use only:

- actual education
- actual experience
- actual projects
- actual skills
- relevant verified strengths


EXPERIENCE BULLETS
==================

Improve existing wording using:

- stronger action verbs
- clearer responsibilities
- relevant technologies
- verified outcomes

Do not invent responsibilities or metrics.


PROJECT SUGGESTIONS
===================

Suggested projects must be clearly treated as
FUTURE projects.

They may address missing skills.


OUTPUT
======

Return the structured response using the supplied
response schema.
"""


# ==========================================================
# PARSE STRUCTURED GEMINI RESPONSE
# ==========================================================

def parse_ai_response(response):

    parsed = getattr(
        response,
        "parsed",
        None
    )

    if parsed:

        if isinstance(
            parsed,
            AIResumeAnalysis
        ):
            return parsed.model_dump()

        if isinstance(
            parsed,
            dict
        ):

            validated = (
                AIResumeAnalysis.model_validate(
                    parsed
                )
            )

            return validated.model_dump()


    text = getattr(
        response,
        "text",
        None
    )

    if text:

        validated = (
            AIResumeAnalysis.model_validate_json(
                text
            )
        )

        return validated.model_dump()


    raise RuntimeError(
        "Gemini returned an empty response."
    )


# ==========================================================
# MAIN AI FUNCTION
# ==========================================================

def generate_ai_resume_improvement(
    resume_text,
    job_title,
    company,
    job_description,
    user_skills,
    required_skills,
    matched_skills,
    missing_skills,
    resume_sections
):

    if not GEMINI_API_KEY:

        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )


    client = genai.Client(
        api_key=GEMINI_API_KEY
    )


    prompt = build_resume_prompt(
        resume_text=resume_text,
        job_title=job_title,
        company=company,
        job_description=job_description,
        user_skills=user_skills,
        required_skills=required_skills,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        resume_sections=resume_sections
    )


    print(
        f"HireLens AI: requesting "
        f"{GEMINI_MODEL}"
    )


    try:

        response = (
            client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type=(
                        "application/json"
                    ),
                    response_schema=(
                        AIResumeAnalysis
                    ),
                    temperature=0.2
                )
            )
        )


        result = parse_ai_response(
            response
        )


        print(
            "HireLens AI: analysis generated successfully."
        )


        return result


    except Exception as error:

        error_message = str(error).lower()


        if (
            "429" in error_message
            or "resource_exhausted" in error_message
            or "quota exceeded" in error_message
            or "free_tier" in error_message
        ):

            print(
                "HireLens AI: Gemini quota exhausted."
            )


        elif (
            "503" in error_message
            or "unavailable" in error_message
        ):

            print(
                "HireLens AI: Gemini temporarily unavailable."
            )


        else:

            print(
                f"HireLens AI error: {error}"
            )


        raise


# ==========================================================
# SAFE WRAPPER
# ==========================================================

def try_generate_ai_resume_improvement(
    resume_text,
    job_title,
    company,
    job_description,
    user_skills,
    required_skills,
    matched_skills,
    missing_skills,
    resume_sections
):

    try:

        data = (
            generate_ai_resume_improvement(
                resume_text=resume_text,
                job_title=job_title,
                company=company,
                job_description=job_description,
                user_skills=user_skills,
                required_skills=required_skills,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
                resume_sections=resume_sections
            )
        )


        return {
            "success": True,
            "data": data,
            "error": None
        }


    except Exception as error:

        print(
            "Gemini AI resume analysis error: "
            f"{error}"
        )


        return {
            "success": False,
            "data": None,
            "error": str(error)
        }