from flask import Blueprint, jsonify, request

from utils.auth import token_required
from utils.db import get_db_connection
from services.skill_gap import analyze_skill_gap
from services.roadmap_service import generate_learning_roadmap


roadmap_bp = Blueprint(
    "roadmap",
    __name__,
    url_prefix="/api/roadmap"
)


# ============================================================
# GET / GENERATE LEARNING ROADMAP BY JOB ID
# ============================================================

@roadmap_bp.route("/job/<int:job_id>", methods=["GET"])
@token_required
def get_learning_roadmap(job_id):

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
        # 1. Get job information
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                job_id,
                title,
                company_name
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
        # 2. Check for existing roadmap
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                roadmap_id,
                user_id,
                target_role,
                title,
                description,
                status,
                created_at,
                updated_at
            FROM learning_roadmaps
            WHERE user_id = %s
              AND target_role = %s
            ORDER BY roadmap_id DESC
            LIMIT 1
            """,
            (
                user_id,
                job["title"]
            )
        )

        existing_roadmap = cursor.fetchone()

        # --------------------------------------------------
        # 3. Return existing roadmap
        # --------------------------------------------------

        if existing_roadmap:

            cursor.execute(
                """
                SELECT
                    rs.step_id,
                    rs.skill_id,
                    s.skill_name,
                    rs.step_number,
                    rs.title,
                    rs.description,
                    rs.resource_url,
                    rs.estimated_hours,
                    rs.status
                FROM roadmap_steps rs
                LEFT JOIN skills s
                    ON rs.skill_id = s.skill_id
                WHERE rs.roadmap_id = %s
                ORDER BY rs.step_number
                """,
                (
                    existing_roadmap["roadmap_id"],
                )
            )

            existing_steps = cursor.fetchall()

            roadmap_by_skill = {}

            for step in existing_steps:

                skill_name = (
                    step["skill_name"]
                    if step["skill_name"]
                    else "General"
                )

                if skill_name not in roadmap_by_skill:

                    roadmap_by_skill[skill_name] = {
                        "skill": skill_name,
                        "skill_id": step["skill_id"],
                        "steps": []
                    }

                roadmap_by_skill[skill_name]["steps"].append({
                    "step_id": step["step_id"],
                    "step_number": step["step_number"],
                    "title": step["title"],
                    "description": step["description"],
                    "resource_url": step["resource_url"],
                    "estimated_hours": (
                        float(step["estimated_hours"])
                        if step["estimated_hours"] is not None
                        else None
                    ),
                    "status": step["status"]
                })

            return jsonify({
                "success": True,
                "existing": True,

                "roadmap": {
                    "roadmap_id": existing_roadmap["roadmap_id"],
                    "target_role": existing_roadmap["target_role"],
                    "title": existing_roadmap["title"],
                    "description": existing_roadmap["description"],
                    "status": existing_roadmap["status"],
                    "created_at": existing_roadmap["created_at"],
                    "updated_at": existing_roadmap["updated_at"]
                },

                "job": {
                    "job_id": job["job_id"],
                    "title": job["title"],
                    "company_name": job["company_name"]
                },

                "learning_roadmap": list(
                    roadmap_by_skill.values()
                )
            }), 200

        # --------------------------------------------------
        # 4. Get user's current skills
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                s.skill_id,
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
        # 5. Get required job skills
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                s.skill_id,
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
        # 6. Analyze skill gap
        # --------------------------------------------------

        gap_analysis = analyze_skill_gap(
            user_skills,
            required_skills
        )

        # --------------------------------------------------
        # 7. Generate learning roadmap
        # --------------------------------------------------

        generated_roadmap = generate_learning_roadmap(
            gap_analysis["missing_skills"]
        )

        roadmap_title = (
            f"{job['title']} Learning Roadmap"
        )

        roadmap_description = (
            f"Personalized learning roadmap for the "
            f"{job['title']} role at {job['company_name']}. "
            f"This roadmap focuses on the skills missing "
            f"from the user's current profile."
        )

        # --------------------------------------------------
        # 8. Create roadmap
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT INTO learning_roadmaps (
                user_id,
                target_role,
                title,
                description,
                status
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user_id,
                job["title"],
                roadmap_title,
                roadmap_description,
                "Not Started"
            )
        )

        roadmap_id = cursor.lastrowid

        saved_roadmap = []

        # --------------------------------------------------
        # 9. Save roadmap steps
        # --------------------------------------------------

        for roadmap_item in generated_roadmap:

            skill_name = roadmap_item["skill"]

            cursor.execute(
                """
                SELECT
                    skill_id
                FROM skills
                WHERE LOWER(skill_name) = LOWER(%s)
                LIMIT 1
                """,
                (skill_name,)
            )

            skill_row = cursor.fetchone()

            skill_id = (
                skill_row["skill_id"]
                if skill_row
                else None
            )

            saved_steps = []

            for step in roadmap_item["steps"]:

                cursor.execute(
                    """
                    INSERT INTO roadmap_steps (
                        roadmap_id,
                        skill_id,
                        step_number,
                        title,
                        description,
                        resource_url,
                        estimated_hours,
                        status
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        roadmap_id,
                        skill_id,
                        step["step_number"],
                        step["title"],
                        f"Learn and practice {step['title']}.",
                        None,
                        4.0,
                        "Not Started"
                    )
                )

                saved_steps.append({
                    "step_id": cursor.lastrowid,
                    "step_number": step["step_number"],
                    "title": step["title"],
                    "description": (
                        f"Learn and practice "
                        f"{step['title']}."
                    ),
                    "resource_url": None,
                    "estimated_hours": 4.0,
                    "status": "Not Started"
                })

            saved_roadmap.append({
                "skill": skill_name,
                "skill_id": skill_id,
                "steps": saved_steps
            })

        # --------------------------------------------------
        # 10. Commit transaction
        # --------------------------------------------------

        connection.commit()

        return jsonify({
            "success": True,
            "existing": False,

            "roadmap": {
                "roadmap_id": roadmap_id,
                "target_role": job["title"],
                "title": roadmap_title,
                "description": roadmap_description,
                "status": "Not Started"
            },

            "job": {
                "job_id": job["job_id"],
                "title": job["title"],
                "company_name": job["company_name"]
            },

            "skill_gap": gap_analysis,

            "learning_roadmap": saved_roadmap

        }), 201

    except Exception as error:

        connection.rollback()

        print(
            f"Learning roadmap error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to generate learning roadmap"
        }), 500

    finally:

        cursor.close()
        connection.close()


# ============================================================
# GET EXISTING ROADMAP BY ROADMAP ID
# ============================================================

@roadmap_bp.route(
    "/id/<int:roadmap_id>",
    methods=["GET"]
)
@token_required
def get_roadmap_by_id(roadmap_id):

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
        # 1. Get roadmap
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                roadmap_id,
                user_id,
                target_role,
                title,
                description,
                status,
                created_at,
                updated_at
            FROM learning_roadmaps
            WHERE roadmap_id = %s
              AND user_id = %s
            LIMIT 1
            """,
            (
                roadmap_id,
                user_id
            )
        )

        roadmap = cursor.fetchone()

        if not roadmap:

            return jsonify({
                "success": False,
                "message": "Roadmap not found"
            }), 404

        # --------------------------------------------------
        # 2. Get roadmap steps
        #
        # IMPORTANT:
        # skills table uses "skill_name", not "name".
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                rs.step_id,
                rs.roadmap_id,
                rs.skill_id,
                s.skill_name,
                rs.step_number,
                rs.title,
                rs.description,
                rs.resource_url,
                rs.estimated_hours,
                rs.status
            FROM roadmap_steps rs
            LEFT JOIN skills s
                ON rs.skill_id = s.skill_id
            WHERE rs.roadmap_id = %s
            ORDER BY rs.step_number ASC
            """,
            (
                roadmap_id,
            )
        )

        steps = cursor.fetchall()

        # --------------------------------------------------
        # 3. Convert decimal values to JSON-safe values
        # --------------------------------------------------

        for step in steps:

            if step["estimated_hours"] is not None:
                step["estimated_hours"] = float(
                    step["estimated_hours"]
                )

        # --------------------------------------------------
        # 4. Calculate progress
        # --------------------------------------------------

        total_steps = len(steps)

        completed_steps = sum(
            1
            for step in steps
            if step["status"] == "Completed"
        )

        if total_steps > 0:

            progress = round(
                (completed_steps / total_steps) * 100,
                2
            )

        else:

            progress = 0

        # --------------------------------------------------
        # 5. Return roadmap
        # --------------------------------------------------

        return jsonify({

            "success": True,

            "roadmap": {
                "roadmap_id": roadmap["roadmap_id"],
                "target_role": roadmap["target_role"],
                "title": roadmap["title"],
                "description": roadmap["description"],
                "status": roadmap["status"],
                "progress": progress,
                "total_steps": total_steps,
                "completed_steps": completed_steps
            },

            "steps": steps

        }), 200

    except Exception as error:

        print(
            f"Get roadmap by ID error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to load roadmap"
        }), 500

    finally:

        cursor.close()
        connection.close()


# ============================================================
# UPDATE ROADMAP STEP STATUS
# ============================================================

@roadmap_bp.route(
    "/step/<int:step_id>",
    methods=["PUT"]
)
@token_required
def update_roadmap_step(step_id):

    user_id = request.user["user_id"]

    data = request.get_json(silent=True) or {}

    new_status = data.get("status")

    allowed_statuses = [
        "Not Started",
        "In Progress",
        "Completed"
    ]

    if new_status not in allowed_statuses:

        return jsonify({
            "success": False,
            "message": (
                "Invalid status. "
                "Use Not Started, In Progress, or Completed."
            )
        }), 400

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # 1. Find roadmap step
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                rs.step_id,
                rs.roadmap_id,
                rs.status AS current_status,
                lr.user_id,
                lr.status AS roadmap_status
            FROM roadmap_steps rs
            INNER JOIN learning_roadmaps lr
                ON rs.roadmap_id = lr.roadmap_id
            WHERE rs.step_id = %s
              AND lr.user_id = %s
            LIMIT 1
            """,
            (
                step_id,
                user_id
            )
        )

        step = cursor.fetchone()

        if not step:

            return jsonify({
                "success": False,
                "message": "Roadmap step not found"
            }), 404

        # --------------------------------------------------
        # 2. Update step status
        # --------------------------------------------------

        cursor.execute(
            """
            UPDATE roadmap_steps
            SET status = %s
            WHERE step_id = %s
            """,
            (
                new_status,
                step_id
            )
        )

        # --------------------------------------------------
        # 3. Get all steps for roadmap
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                step_id,
                status
            FROM roadmap_steps
            WHERE roadmap_id = %s
            ORDER BY step_number
            """,
            (
                step["roadmap_id"],
            )
        )

        all_steps = cursor.fetchall()

        # --------------------------------------------------
        # 4. Calculate roadmap status
        # --------------------------------------------------

        total_steps = len(all_steps)

        completed_steps = sum(
            1
            for roadmap_step in all_steps
            if roadmap_step["status"] == "Completed"
        )

        in_progress_steps = sum(
            1
            for roadmap_step in all_steps
            if roadmap_step["status"] == "In Progress"
        )

        if (
            total_steps > 0
            and completed_steps == total_steps
        ):

            roadmap_status = "Completed"

        elif (
            completed_steps > 0
            or in_progress_steps > 0
        ):

            roadmap_status = "In Progress"

        else:

            roadmap_status = "Not Started"

        # --------------------------------------------------
        # 5. Update roadmap status
        # --------------------------------------------------

        cursor.execute(
            """
            UPDATE learning_roadmaps
            SET status = %s
            WHERE roadmap_id = %s
              AND user_id = %s
            """,
            (
                roadmap_status,
                step["roadmap_id"],
                user_id
            )
        )

        # --------------------------------------------------
        # 6. Commit
        # --------------------------------------------------

        connection.commit()

        # --------------------------------------------------
        # 7. Calculate progress
        # --------------------------------------------------

        progress = (
            round(
                (completed_steps / total_steps) * 100,
                2
            )
            if total_steps > 0
            else 0
        )

        return jsonify({

            "success": True,

            "message":
                "Roadmap step updated successfully",

            "step": {
                "step_id": step_id,
                "status": new_status
            },

            "roadmap": {
                "roadmap_id": step["roadmap_id"],
                "status": roadmap_status,
                "completed_steps": completed_steps,
                "total_steps": total_steps,
                "progress": progress
            }

        }), 200

    except Exception as error:

        connection.rollback()

        print(
            f"Roadmap step update error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to update roadmap step"
        }), 500

    finally:

        cursor.close()
        connection.close()


# ============================================================
# GET CURRENT / LATEST ROADMAP
# ============================================================

@roadmap_bp.route(
    "/current",
    methods=["GET"]
)
@token_required
def get_current_roadmap():

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
        # 1. Get latest roadmap
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                roadmap_id,
                user_id,
                target_role,
                title,
                description,
                status,
                created_at,
                updated_at
            FROM learning_roadmaps
            WHERE user_id = %s
            ORDER BY updated_at DESC, roadmap_id DESC
            LIMIT 1
            """,
            (
                user_id,
            )
        )

        roadmap = cursor.fetchone()

        if not roadmap:

            return jsonify({
                "success": True,
                "exists": False,
                "roadmap": None,
                "learning_roadmap": []
            }), 200

        # --------------------------------------------------
        # 2. Get roadmap steps
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                rs.step_id,
                rs.skill_id,
                s.skill_name,
                rs.step_number,
                rs.title,
                rs.description,
                rs.resource_url,
                rs.estimated_hours,
                rs.status
            FROM roadmap_steps rs
            LEFT JOIN skills s
                ON rs.skill_id = s.skill_id
            WHERE rs.roadmap_id = %s
            ORDER BY rs.step_number ASC
            """,
            (
                roadmap["roadmap_id"],
            )
        )

        steps = cursor.fetchall()

        for step in steps:

            if step["estimated_hours"] is not None:
                step["estimated_hours"] = float(
                    step["estimated_hours"]
                )

        # --------------------------------------------------
        # 3. Group steps by skill
        # --------------------------------------------------

        roadmap_by_skill = {}

        for step in steps:

            skill_name = (
                step["skill_name"]
                if step["skill_name"]
                else "General"
            )

            if skill_name not in roadmap_by_skill:

                roadmap_by_skill[skill_name] = {
                    "skill": skill_name,
                    "skill_id": step["skill_id"],
                    "steps": []
                }

            roadmap_by_skill[
                skill_name
            ]["steps"].append({

                "step_id": step["step_id"],

                "step_number":
                    step["step_number"],

                "title":
                    step["title"],

                "description":
                    step["description"],

                "resource_url":
                    step["resource_url"],

                "estimated_hours":
                    step["estimated_hours"],

                "status":
                    step["status"]
            })

        return jsonify({

            "success": True,

            "exists": True,

            "roadmap": {
                "roadmap_id":
                    roadmap["roadmap_id"],

                "target_role":
                    roadmap["target_role"],

                "title":
                    roadmap["title"],

                "description":
                    roadmap["description"],

                "status":
                    roadmap["status"]
            },

            "learning_roadmap":
                list(
                    roadmap_by_skill.values()
                )

        }), 200

    except Exception as error:

        print(
            f"Current roadmap error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to load current roadmap"
        }), 500

    finally:

        cursor.close()
        connection.close()