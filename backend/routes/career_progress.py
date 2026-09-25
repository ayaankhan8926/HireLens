import mysql.connector

from flask import Blueprint, jsonify, request

from config import Config
from utils.auth import token_required


# =========================================================
# BLUEPRINT
# =========================================================

career_progress_bp = Blueprint(
    "career_progress",
    __name__,
    url_prefix="/api/career-progress"
)

# Compatibility alias
career_progress = career_progress_bp


# =========================================================
# DATABASE CONNECTION
# =========================================================

def get_db_connection():

    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )


# =========================================================
# CAREER PROGRESS
# =========================================================

@career_progress_bp.route("", methods=["GET"])
@token_required
def get_career_progress():

    user_id = request.user.get("user_id")

    conn = None
    cursor = None

    try:

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # =====================================================
        # 1. PROFILE PROGRESS
        # =====================================================

        cursor.execute(
            """
            SELECT
                phone,
                location,
                education,
                bio,
                target_role
            FROM profiles
            WHERE user_id = %s
            """,
            (user_id,)
        )

        profile = cursor.fetchone()

        profile_fields = [
            "phone",
            "location",
            "education",
            "bio",
            "target_role"
        ]

        if profile:

            completed_profile_fields = sum(
                1
                for field in profile_fields
                if profile.get(field)
                and str(profile.get(field)).strip()
            )

            profile_progress = round(
                (completed_profile_fields / len(profile_fields)) * 100
            )

        else:

            profile_progress = 0


        # =====================================================
        # 2. RESUME PROGRESS
        # =====================================================

        cursor.execute(
            """
            SELECT
                resume_id,
                file_name
            FROM resumes
            WHERE user_id = %s
            ORDER BY uploaded_at DESC
            LIMIT 1
            """,
            (user_id,)
        )

        resume = cursor.fetchone()

        resume_progress = 100 if resume else 0


        # =====================================================
        # 3. USER SKILLS
        # =====================================================

        cursor.execute(
            """
            SELECT
                s.skill_id,
                s.skill_name
            FROM user_skills us
            JOIN skills s
                ON us.skill_id = s.skill_id
            WHERE us.user_id = %s
            """,
            (user_id,)
        )

        user_skill_rows = cursor.fetchall()

        user_skills = {
            row["skill_name"].strip().lower()
            for row in user_skill_rows
            if row.get("skill_name")
        }


        # =====================================================
        # 4. LOAD ALL JOBS
        # =====================================================

        cursor.execute(
            """
            SELECT
                j.job_id,
                j.title,
                j.company_name
            FROM jobs j
            ORDER BY j.job_id
            """
        )

        jobs = cursor.fetchall()

        live_matches = []

        for job in jobs:

            cursor.execute(
                """
                SELECT
                    s.skill_name
                FROM job_skills js
                JOIN skills s
                    ON js.skill_id = s.skill_id
                WHERE js.job_id = %s
                ORDER BY s.skill_name
                """,
                (job["job_id"],)
            )

            required_rows = cursor.fetchall()

            required_skills = [
                row["skill_name"]
                for row in required_rows
                if row.get("skill_name")
            ]

            normalized_required = [
                skill.strip().lower()
                for skill in required_skills
                if skill
            ]

            matched_skills = [
                skill
                for skill in required_skills
                if skill.strip().lower() in user_skills
            ]

            missing_skills = [
                skill
                for skill in required_skills
                if skill.strip().lower() not in user_skills
            ]

            required_count = len(normalized_required)
            matched_count = len(matched_skills)

            if required_count > 0:

                match_score = round(
                    (matched_count / required_count) * 100
                )

            else:

                match_score = 0

            live_matches.append(
                {
                    "job_id": job["job_id"],
                    "title": job["title"],
                    "company_name": job["company_name"],
                    "match_score": match_score,
                    "matched_skills": matched_skills,
                    "missing_skills": missing_skills
                }
            )


        # =====================================================
        # 5. JOB MATCH STATISTICS
        # =====================================================

        jobs_analyzed = len(live_matches)

        average_match = (
            round(
                sum(
                    match["match_score"]
                    for match in live_matches
                ) / jobs_analyzed
            )
            if jobs_analyzed > 0
            else 0
        )

        strong_job_matches = sum(
            1
            for match in live_matches
            if match["match_score"] >= 80
        )


        # =====================================================
        # 6. LOAD ALL ROADMAPS
        # =====================================================

        cursor.execute(
            """
            SELECT
                lr.roadmap_id,
                lr.user_id,
                lr.target_role,
                lr.title,
                lr.description,
                lr.status,
                lr.created_at,
                lr.updated_at
            FROM learning_roadmaps lr
            WHERE lr.user_id = %s
            ORDER BY lr.updated_at DESC, lr.roadmap_id DESC
            """,
            (user_id,)
        )

        roadmap_rows = cursor.fetchall()

        all_roadmaps = []

        for roadmap in roadmap_rows:

            # -------------------------------------------------
            # Get roadmap steps
            # -------------------------------------------------

            cursor.execute(
                """
                SELECT
                    COUNT(*) AS total_steps,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN status = 'Completed'
                                THEN 1
                                ELSE 0
                            END
                        ),
                        0
                    ) AS completed_steps
                FROM roadmap_steps
                WHERE roadmap_id = %s
                """,
                (roadmap["roadmap_id"],)
            )

            roadmap_stats = cursor.fetchone()

            total_steps = int(
                roadmap_stats["total_steps"] or 0
            )

            completed_steps = int(
                roadmap_stats["completed_steps"] or 0
            )

            if total_steps > 0:

                roadmap_progress = round(
                    (completed_steps / total_steps) * 100
                )

            else:

                roadmap_progress = 0

            all_roadmaps.append(
                {
                    "roadmap_id": roadmap["roadmap_id"],
                    "job_id": None,
                    "target_role": roadmap["target_role"],
                    "title": roadmap["title"],
                    "description": roadmap["description"],
                    "status": roadmap["status"],
                    "company_name": None,
                    "created_at": roadmap["created_at"],
                    "updated_at": roadmap["updated_at"],
                    "total_steps": total_steps,
                    "completed_steps": completed_steps,
                    "progress": roadmap_progress
                }
            )


        # =====================================================
        # 7. SELECT LATEST ROADMAP WITH ACTUAL STEPS
        # =====================================================

        usable_roadmaps = [
            roadmap
            for roadmap in all_roadmaps
            if roadmap["total_steps"] > 0
        ]

        latest_roadmap = (
            usable_roadmaps[0]
            if usable_roadmaps
            else None
        )


        # =====================================================
        # 8. ROADMAP PROGRESS
        # =====================================================

        if latest_roadmap:

            roadmap_progress = latest_roadmap["progress"]

            total_steps = latest_roadmap["total_steps"]

            completed_steps = latest_roadmap["completed_steps"]

        else:

            roadmap_progress = 0
            total_steps = 0
            completed_steps = 0


        # =====================================================
        # 9. APPLICATION ANALYTICS
        # =====================================================

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_applications,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Applied'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS applied,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Screening'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS screening,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Interview'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS interviews,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Offer'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS offers,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Rejected'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS rejected,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Withdrawn'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS withdrawn

            FROM applications
            WHERE user_id = %s
            """,
            (user_id,)
        )

        application_stats = cursor.fetchone()

        application_analytics = {
            "total": int(
                application_stats["total_applications"] or 0
            ),
            "applied": int(
                application_stats["applied"] or 0
            ),
            "screening": int(
                application_stats["screening"] or 0
            ),
            "interviews": int(
                application_stats["interviews"] or 0
            ),
            "offers": int(
                application_stats["offers"] or 0
            ),
            "rejected": int(
                application_stats["rejected"] or 0
            ),
            "withdrawn": int(
                application_stats["withdrawn"] or 0
            )
        }


        # =====================================================
        # 10. INTERVIEW ANALYTICS
        # =====================================================

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_sessions,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'Completed'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS completed_sessions,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'In Progress'
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                ) AS in_progress_sessions,

                COALESCE(
                    AVG(
                        CASE
                            WHEN status = 'Completed'
                            THEN overall_score
                            ELSE NULL
                        END
                    ),
                    0
                ) AS average_score,

                COALESCE(
                    MAX(
                        CASE
                            WHEN status = 'Completed'
                            THEN overall_score
                            ELSE NULL
                        END
                    ),
                    0
                ) AS best_score

            FROM interview_sessions
            WHERE user_id = %s
            """,
            (user_id,)
        )

        interview_stats = cursor.fetchone()

        interview_analytics = {
            "total_sessions": int(
                interview_stats["total_sessions"] or 0
            ),
            "completed_sessions": int(
                interview_stats["completed_sessions"] or 0
            ),
            "in_progress_sessions": int(
                interview_stats["in_progress_sessions"] or 0
            ),
            "average_score": round(
                float(
                    interview_stats["average_score"] or 0
                )
            ),
            "best_score": round(
                float(
                    interview_stats["best_score"] or 0
                )
            )
        }


        # =====================================================
        # 11. CAREER READINESS
        # =====================================================

        career_readiness = round(
            (
                profile_progress * 0.20
                + resume_progress * 0.20
                + average_match * 0.40
                + roadmap_progress * 0.20
            )
        )


        # =====================================================
        # 12. CAREER INTELLIGENCE
        # =====================================================

        career_intelligence = {

            "career_readiness": career_readiness,

            "profile": {
                "progress": profile_progress
            },

            "resume": {
                "progress": resume_progress,
                "exists": bool(resume)
            },

            "job_matching": {
                "jobs_analyzed": jobs_analyzed,
                "average_match": average_match,
                "strong_matches": strong_job_matches
            },

            "learning": {
                "roadmaps": len(all_roadmaps),
                "latest_progress": roadmap_progress,
                "total_steps": total_steps,
                "completed_steps": completed_steps
            },

            "applications": application_analytics,

            "interviews": interview_analytics
        }


        # =====================================================
        # 13. RESPONSE
        # =====================================================

        return jsonify(
            {
                "success": True,

                "career_readiness": career_readiness,

                "strong_job_matches": strong_job_matches,

                "jobs_analyzed": jobs_analyzed,

                "average_match": average_match,

                "profile_progress": profile_progress,

                "resume_progress": resume_progress,

                "roadmap_progress": roadmap_progress,

                "application_analytics": application_analytics,

                "interview_analytics": interview_analytics,

                "career_intelligence": career_intelligence,

                "roadmaps": all_roadmaps,

                "roadmap": (
                    {
                        "exists": True,
                        "roadmap_id": latest_roadmap["roadmap_id"],
                        "job_id": latest_roadmap["job_id"],
                        "target_role": latest_roadmap["target_role"],
                        "title": latest_roadmap["title"],
                        "description": latest_roadmap["description"],
                        "status": latest_roadmap["status"],
                        "company_name": latest_roadmap["company_name"],
                        "total_steps": latest_roadmap["total_steps"],
                        "completed_steps": latest_roadmap["completed_steps"],
                        "progress": latest_roadmap["progress"]
                    }
                    if latest_roadmap
                    else {
                        "exists": False,
                        "roadmap_id": None,
                        "job_id": None,
                        "target_role": None,
                        "title": None,
                        "description": None,
                        "status": None,
                        "company_name": None,
                        "total_steps": 0,
                        "completed_steps": 0,
                        "progress": 0
                    }
                ),

                "resume": (
                    {
                        "exists": True,
                        "resume_id": resume["resume_id"],
                        "file_name": resume["file_name"]
                    }
                    if resume
                    else {
                        "exists": False,
                        "resume_id": None,
                        "file_name": None
                    }
                ),

                "profile": profile or {}
            }
        )


    # =====================================================
    # DATABASE ERROR
    # =====================================================

    except mysql.connector.Error as error:

        print(
            "Career progress database error:",
            error
        )

        return jsonify(
            {
                "success": False,
                "message": "Unable to calculate career progress."
            }
        ), 500


    # =====================================================
    # GENERAL ERROR
    # =====================================================

    except Exception as error:

        print(
            "Career progress error:",
            error
        )

        return jsonify(
            {
                "success": False,
                "message": "Unable to calculate career progress."
            }
        ), 500


    # =====================================================
    # CLEANUP
    # =====================================================

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()