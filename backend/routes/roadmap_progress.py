from flask import Blueprint, jsonify, request

from utils.auth import token_required
from utils.db import get_db_connection


roadmap_progress_bp = Blueprint(
    "roadmap_progress",
    __name__,
    url_prefix="/api/roadmap"
)


VALID_STATUSES = {
    "Not Started",
    "In Progress",
    "Completed"
}


@roadmap_progress_bp.route(
    "/step/<int:step_id>",
    methods=["PUT"]
)
@token_required
def update_roadmap_step(step_id):
    user_id = request.user["user_id"]

    data = request.get_json(silent=True) or {}

    new_status = data.get("status")

    if new_status not in VALID_STATUSES:
        return jsonify({
            "success": False,
            "message": (
                "Invalid status. Use "
                "'Not Started', 'In Progress', "
                "or 'Completed'."
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
        # Verify that this step belongs to the
        # authenticated user's roadmap
        cursor.execute(
            """
            SELECT
                rs.step_id,
                rs.roadmap_id,
                rs.step_number,
                rs.title,
                rs.status
            FROM roadmap_steps rs
            INNER JOIN learning_roadmaps lr
                ON rs.roadmap_id = lr.roadmap_id
            WHERE rs.step_id = %s
              AND lr.user_id = %s
            """,
            (step_id, user_id)
        )

        step = cursor.fetchone()

        if not step:
            return jsonify({
                "success": False,
                "message": "Roadmap step not found"
            }), 404

        # Update step status
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

        # Get all steps for this roadmap
        cursor.execute(
            """
            SELECT
                step_id,
                status
            FROM roadmap_steps
            WHERE roadmap_id = %s
            """,
            (step["roadmap_id"],)
        )

        all_steps = cursor.fetchall()

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

        # Calculate progress percentage
        if total_steps == 0:
            progress_percentage = 0
        else:
            progress_percentage = round(
                (completed_steps / total_steps) * 100,
                2
            )

        # Update overall roadmap status
        if completed_steps == total_steps and total_steps > 0:
            roadmap_status = "Completed"
        elif completed_steps > 0 or in_progress_steps > 0:
            roadmap_status = "In Progress"
        else:
            roadmap_status = "Not Started"

        cursor.execute(
            """
            UPDATE learning_roadmaps
            SET status = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE roadmap_id = %s
              AND user_id = %s
            """,
            (
                roadmap_status,
                step["roadmap_id"],
                user_id
            )
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Roadmap step updated successfully",
            "step": {
                "step_id": step["step_id"],
                "roadmap_id": step["roadmap_id"],
                "step_number": step["step_number"],
                "title": step["title"],
                "status": new_status
            },
            "progress": {
                "total_steps": total_steps,
                "completed_steps": completed_steps,
                "in_progress_steps": in_progress_steps,
                "progress_percentage": progress_percentage,
                "roadmap_status": roadmap_status
            }
        }), 200

    except Exception as error:
        connection.rollback()

        print(
            f"Roadmap progress error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to update roadmap progress"
        }), 500

    finally:
        cursor.close()
        connection.close()