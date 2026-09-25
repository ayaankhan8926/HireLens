from flask import Blueprint, jsonify, request

from utils.auth import token_required
from utils.db import get_db_connection
from services.job_matching import calculate_match_score


jobs_bp = Blueprint(
    "jobs",
    __name__,
    url_prefix="/api/jobs"
)
@jobs_bp.route("/matches", methods=["GET"])
@token_required
def get_job_matches():
    user_id = request.user["user_id"]

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                s.skill_name
            FROM user_skills us
            INNER JOIN skills s
                ON us.skill_id = s.skill_id
            WHERE us.user_id = %s
            """,
            (user_id,)
        )

        user_skill_rows = cursor.fetchall()

        user_skills = [
            row["skill_name"]
            for row in user_skill_rows
        ]

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
            ORDER BY job_id
            """
        )

        jobs = cursor.fetchall()

        matches = []

        for job in jobs:

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
                (job["job_id"],)
            )

            required_skill_rows = cursor.fetchall()

            required_skills = [
                row["skill_name"]
                for row in required_skill_rows
            ]

            match_result = calculate_match_score(
                user_skills,
                required_skills
            )

            matches.append({
                "job_id": job["job_id"],
                "title": job["title"],
                "company_name": job["company_name"],
                "location": job["location"],
                "job_type": job["job_type"],
                "description": job["description"],
                "required_skills": required_skills,
                "match_score": match_result["match_score"],
                "matched_skills": match_result["matched_skills"],
                "missing_skills": match_result["missing_skills"]
            })

        matches.sort(
            key=lambda job: job["match_score"],
            reverse=True
        )

        return jsonify({
            "success": True,
            "user_skills": user_skills,
            "total_jobs": len(matches),
            "matches": matches
        }), 200

    except Exception as error:
        print(f"Job matching error: {error}")

        return jsonify({
            "success": False,
            "message": "Failed to generate job matches"
        }), 500

    finally:
        cursor.close()
        connection.close()