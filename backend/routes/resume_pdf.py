from flask import Blueprint, request, send_file, jsonify

from utils.auth import token_required
from utils.db import get_db_connection

from services.resume_parser import extract_resume_sections
from services.ai_resume_service import (
    try_generate_ai_resume_improvement
)
from services.pdf_resume_service import (
    generate_resume_pdf
)


# --------------------------------------------------
# Blueprint
# --------------------------------------------------

resume_pdf_bp = Blueprint(
    "resume_pdf",
    __name__,
    url_prefix="/api/resume-pdf"
)


# --------------------------------------------------
# Download improved resume PDF
# --------------------------------------------------

@resume_pdf_bp.route(
    "/job/<int:job_id>",
    methods=["GET"]
)
@token_required
def download_improved_resume(job_id):

    user_id = request.user["user_id"]

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # 1. Get target job
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                job_id,
                title,
                company_name,
                description
            FROM jobs
            WHERE job_id = %s
            """,
            (job_id,)
        )

        job = cursor.fetchone()

        if not job:
            return jsonify({
                "success": False,
                "message": "Job not found"
            }), 404


        # --------------------------------------------------
        # 2. Get candidate profile
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                u.full_name,
                u.email,
                p.phone,
                p.location,
                p.education,
                p.target_role,
                p.experience_years,
                p.bio,
                p.github_url,
                p.linkedin_url,
                p.portfolio_url
            FROM users u
            LEFT JOIN profiles p
                ON u.user_id = p.user_id
            WHERE u.user_id = %s
            """,
            (user_id,)
        )

        candidate = cursor.fetchone()

        if not candidate:
            return jsonify({
                "success": False,
                "message": "Candidate profile not found"
            }), 404


        # --------------------------------------------------
        # 3. Get candidate skills
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                s.skill_name
            FROM user_skills us
            INNER JOIN skills s
                ON us.skill_id = s.skill_id
            WHERE us.user_id = %s
            ORDER BY s.skill_id
            """,
            (user_id,)
        )

        skill_rows = cursor.fetchall()

        user_skills = [
            row["skill_name"]
            for row in skill_rows
        ]


        # --------------------------------------------------
        # 4. Get required job skills
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                s.skill_name
            FROM job_skills js
            INNER JOIN skills s
                ON js.skill_id = s.skill_id
            WHERE js.job_id = %s
            ORDER BY s.skill_id
            """,
            (job_id,)
        )

        required_rows = cursor.fetchall()

        required_skills = [
            row["skill_name"]
            for row in required_rows
        ]


        # --------------------------------------------------
        # 5. Get latest resume
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                resume_id,
                file_name,
                extracted_text
            FROM resumes
            WHERE user_id = %s
            ORDER BY resume_id DESC
            LIMIT 1
            """,
            (user_id,)
        )

        resume = cursor.fetchone()

        if not resume:
            return jsonify({
                "success": False,
                "message": "Please upload a resume first"
            }), 400

        resume_text = (
            resume["extracted_text"] or ""
        )


        # --------------------------------------------------
        # 6. Extract resume sections
        # --------------------------------------------------

        resume_sections = extract_resume_sections(
            resume_text
        )

        education = resume_sections.get(
            "education",
            ""
        )

        experience = resume_sections.get(
            "experience",
            ""
        )

        projects = resume_sections.get(
            "projects",
            ""
        )

        certifications = resume_sections.get(
            "certifications",
            ""
        )

        skills_section = resume_sections.get(
            "skills",
            ""
        )


        # --------------------------------------------------
        # 7. Determine matched and missing skills
        # --------------------------------------------------

        user_skill_set = {
            skill.strip().lower()
            for skill in user_skills
        }

        matched_skills = [
            skill
            for skill in required_skills
            if skill.strip().lower()
            in user_skill_set
        ]

        missing_skills = [
            skill
            for skill in required_skills
            if skill.strip().lower()
            not in user_skill_set
        ]


        # --------------------------------------------------
        # 8. Ask Gemini for AI resume analysis
        # --------------------------------------------------

        ai_result = try_generate_ai_resume_improvement(

            resume_text=resume_text,

            job_title=job["title"],

            company=job["company_name"],

            job_description=(
                job["description"] or ""
            ),

            user_skills=user_skills,

            required_skills=required_skills,

            matched_skills=matched_skills,

            missing_skills=missing_skills,

            resume_sections={
                "education": education,
                "experience": experience,
                "projects": projects,
                "certifications": certifications,
                "skills": skills_section
            }
        )


        # --------------------------------------------------
        # 9. Prepare AI data
        # --------------------------------------------------

        ai_data = {}

        if ai_result["success"]:
            ai_data = ai_result["data"] or {}


        # --------------------------------------------------
        # 10. AI professional summary
        # --------------------------------------------------

        professional_summary = (
            ai_data.get(
                "professional_summary",
                ""
            )
            if ai_data
            else ""
        )


        # --------------------------------------------------
        # 11. Safe fallback summary
        # --------------------------------------------------

        if not professional_summary:

            professional_summary = (
                candidate.get("bio")
                or candidate.get("target_role")
                or (
                    f"Candidate applying for "
                    f"{job['title']}."
                )
            )


        # --------------------------------------------------
        # 12. AI-improved experience bullets
        # --------------------------------------------------

        improved_experience = []

        ai_bullet_improvements = ai_data.get(
            "experience_bullet_improvements",
            []
        )


        if isinstance(
            ai_bullet_improvements,
            list
        ):

            for item in ai_bullet_improvements:

                if not isinstance(
                    item,
                    dict
                ):
                    continue

                improved_bullet = str(
                    item.get(
                        "improved_bullet",
                        ""
                    )
                ).strip()

                context = str(
                    item.get(
                        "context",
                        ""
                    )
                ).strip()

                if not improved_bullet:
                    continue

                improved_experience.append({
                    "context": context,
                    "bullet": improved_bullet
                })


        # --------------------------------------------------
        # 13. Decide what experience to put in PDF
        # --------------------------------------------------

        if improved_experience:

            experience_for_pdf = [
                {
                    "title": item["context"],
                    "company": "",
                    "duration": "",
                    "bullets": [
                        item["bullet"]
                    ]
                }
                for item in improved_experience
            ]

        else:

            # Gemini unavailable:
            # safely keep original resume experience.
            experience_for_pdf = experience


        # --------------------------------------------------
        # 14. Candidate information
        # --------------------------------------------------

        candidate_data = {

            "full_name": candidate.get(
                "full_name"
            ),

            "email": candidate.get(
                "email"
            ),

            "phone": candidate.get(
                "phone"
            ),

            "location": candidate.get(
                "location"
            ),

            "linkedin_url": candidate.get(
                "linkedin_url"
            ),

            "github_url": candidate.get(
                "github_url"
            ),

            "portfolio_url": candidate.get(
                "portfolio_url"
            )
        }


        # --------------------------------------------------
        # 15. Generate PDF
        # --------------------------------------------------

        pdf_buffer = generate_resume_pdf(

            candidate=candidate_data,

            professional_summary=(
                professional_summary
            ),

            skills=user_skills,

            experience=experience_for_pdf,

            projects=projects,

            education=education,

            certifications=certifications
        )


        # --------------------------------------------------
        # 16. Generate filename
        # --------------------------------------------------

        safe_name = (
            candidate.get("full_name")
            or "Candidate"
        )

        filename = (
            f"{safe_name.replace(' ', '_')}"
            f"_HireLens_Resume.pdf"
        )


        # --------------------------------------------------
        # 17. Send PDF
        # --------------------------------------------------

        return send_file(

            pdf_buffer,

            mimetype="application/pdf",

            as_attachment=True,

            download_name=filename
        )


    except Exception as error:

        print(
            f"Resume PDF error: {error}"
        )

        return jsonify({
            "success": False,
            "message": (
                "Failed to generate improved "
                "resume PDF"
            )
        }), 500


    finally:

        cursor.close()
        connection.close()