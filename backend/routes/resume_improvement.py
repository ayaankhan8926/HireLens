from flask import Blueprint, jsonify, request

from utils.auth import token_required
from utils.db import get_db_connection

from services.resume_improvement import generate_resume_improvement
from services.resume_parser import extract_resume_sections
from services.skill_gap import analyze_skill_gap
from services.ai_resume_service import (
    try_generate_ai_resume_improvement
)


resume_improvement_bp = Blueprint(
    "resume_improvement",
    __name__,
    url_prefix="/api/resume-improvement"
)


@resume_improvement_bp.route(
    "/job/<int:job_id>",
    methods=["GET"]
)
@token_required
def get_resume_improvement(job_id):

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
                location,
                job_type,
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
        # 2. Get user's skills
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

        user_skill_rows = cursor.fetchall()

        user_skills = [
            row["skill_name"]
            for row in user_skill_rows
        ]


        # --------------------------------------------------
        # 3. Get skills required by the job
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

        required_skill_rows = cursor.fetchall()

        required_skills = [
            row["skill_name"]
            for row in required_skill_rows
        ]


        # --------------------------------------------------
        # 4. Calculate exact skill gap
        # --------------------------------------------------

        gap_analysis = analyze_skill_gap(
            user_skills,
            required_skills
        )

        matched_skills = gap_analysis.get(
            "matched_skills",
            []
        )

        missing_skills = gap_analysis.get(
            "missing_skills",
            []
        )


        # --------------------------------------------------
        # 5. Get latest resume
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                resume_id,
                file_name,
                extracted_text,
                uploaded_at
            FROM resumes
            WHERE user_id = %s
            ORDER BY resume_id DESC
            LIMIT 1
            """,
            (user_id,)
        )

        resume = cursor.fetchone()

        resume_text = ""
        resume_id = None
        resume_filename = None

        if resume:
            resume_id = resume["resume_id"]
            resume_filename = resume["file_name"]
            resume_text = resume["extracted_text"] or ""


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


        # --------------------------------------------------
        # 7. Existing deterministic analysis
        # --------------------------------------------------

        improvement = generate_resume_improvement(
            user_skills=user_skills,
            required_skills=required_skills,
            resume_text=resume_text,
            education=education,
            experience=experience,
            projects=projects,
            certifications=certifications
        )


        # --------------------------------------------------
        # 8. Gemini AI analysis
        # --------------------------------------------------

        ai_result = try_generate_ai_resume_improvement(

            resume_text=resume_text,

            job_title=job["title"],

            company=job["company_name"],

            job_description=job["description"] or "",

            user_skills=user_skills,

            required_skills=required_skills,

            matched_skills=matched_skills,

            missing_skills=missing_skills,

            resume_sections={
                "education": education,
                "experience": experience,
                "projects": projects,
                "certifications": certifications,
                "skills": resume_sections.get(
                    "skills",
                    ""
                )
            }
        )


        # --------------------------------------------------
        # 9. Return complete analysis
        # --------------------------------------------------

        return jsonify({

            "success": True,

            "job": {
                "job_id": job["job_id"],
                "title": job["title"],
                "company_name": job["company_name"],
                "location": job["location"],
                "job_type": job["job_type"],
                "description": job["description"]
            },

            "resume": {
                "resume_id": resume_id,
                "filename": resume_filename,
                "available": bool(resume)
            },

            "resume_sections": {
                "education": education,
                "experience": experience,
                "projects": projects,
                "certifications": certifications,
                "skills": resume_sections.get(
                    "skills",
                    ""
                )
            },

            # Existing rule-based analysis
            "analysis": improvement,

            # Exact database-based skill matching
            "skill_match": {
                "matched_skills": matched_skills,
                "missing_skills": missing_skills,
                "required_skills": required_skills
            },

            # Gemini AI
            "ai_analysis": (
                ai_result["data"]
                if ai_result["success"]
                else None
            ),

            "ai_available": ai_result["success"],

            "ai_error": (
                ai_result["error"]
                if not ai_result["success"]
                else None
            )

        }), 200


    except Exception as error:

        print(
            f"Resume improvement error: {error}"
        )

        return jsonify({
            "success": False,
            "message": (
                "Failed to generate resume "
                "improvement analysis"
            )
        }), 500


    finally:

        cursor.close()
        connection.close()