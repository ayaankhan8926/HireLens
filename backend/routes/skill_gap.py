from flask import Blueprint, jsonify, request

from utils.auth import token_required
from utils.db import get_db_connection
from services.skill_gap import analyze_skill_gap


skill_gap_bp = Blueprint(
    "skill_gap",
    __name__,
    url_prefix="/api/skill-gap"
)


@skill_gap_bp.route("/job/<int:job_id>", methods=["GET"])
@token_required
def get_skill_gap(job_id):
    user_id = request.user["user_id"]

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor(dictionary=True)

    try:
        # Get user's current skills
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

        # Get job information
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

        # Get required skills for this job
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

        # Analyze skill gap
        gap_analysis = analyze_skill_gap(
            user_skills,
            required_skills
        )

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
            "user_skills": user_skills,
            "required_skills": required_skills,
            "skill_gap": gap_analysis
        }), 200

    except Exception as error:
        print(f"Skill gap analysis error: {error}")

        return jsonify({
            "success": False,
            "message": "Failed to analyze skill gap"
        }), 500

    finally:
        cursor.close()
        connection.close()