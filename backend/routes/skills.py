from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.auth import token_required


skills_bp = Blueprint(
    "skills",
    __name__,
    url_prefix="/api/skills"
)


@skills_bp.route("", methods=["GET"])
@token_required
def get_user_skills():
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
                s.skill_id,
                s.skill_name,
                s.category,
                us.proficiency_level
            FROM user_skills us
            INNER JOIN skills s
                ON us.skill_id = s.skill_id
            WHERE us.user_id = %s
            ORDER BY s.skill_name
            """,
            (user_id,)
        )

        skills = cursor.fetchall()

        return jsonify({
            "success": True,
            "skills": skills
        }), 200

    except Exception:
        return jsonify({
            "success": False,
            "message": "Failed to fetch skills"
        }), 500

    finally:
        cursor.close()
        connection.close()
@skills_bp.route("", methods=["POST"])
@token_required
def add_skill():
    user_id = request.user["user_id"]
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    skill_name = data.get("skill_name", "").strip()
    category = data.get("category", "").strip()
    proficiency_level = data.get("proficiency_level", "Beginner").strip()

    if not skill_name:
        return jsonify({
            "success": False,
            "message": "Skill name is required"
        }), 400

    allowed_levels = [
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert"
    ]

    if proficiency_level not in allowed_levels:
        return jsonify({
            "success": False,
            "message": "Invalid proficiency level"
        }), 400

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
            SELECT skill_id
            FROM skills
            WHERE skill_name = %s
            """,
            (skill_name,)
        )

        skill = cursor.fetchone()

        if skill:
            skill_id = skill["skill_id"]

        else:
            cursor.execute(
                """
                INSERT INTO skills (skill_name, category)
                VALUES (%s, %s)
                """,
                (skill_name, category or None)
            )

            skill_id = cursor.lastrowid

        cursor.execute(
            """
            SELECT user_skill_id
            FROM user_skills
            WHERE user_id = %s AND skill_id = %s
            """,
            (user_id, skill_id)
        )

        existing_user_skill = cursor.fetchone()

        if existing_user_skill:
            return jsonify({
                "success": False,
                "message": "Skill already added to your profile"
            }), 409

        cursor.execute(
            """
            INSERT INTO user_skills (
                user_id,
                skill_id,
                proficiency_level
            )
            VALUES (%s, %s, %s)
            """,
            (user_id, skill_id, proficiency_level)
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Skill added successfully",
            "skill_id": skill_id
        }), 201

    except Exception:
        connection.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to add skill"
        }), 500

    finally:
        cursor.close()
        connection.close()
@skills_bp.route("/<int:skill_id>", methods=["PUT"])
@token_required
def update_skill(skill_id):
    user_id = request.user["user_id"]
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    proficiency_level = data.get("proficiency_level", "").strip()

    allowed_levels = [
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert"
    ]

    if proficiency_level not in allowed_levels:
        return jsonify({
            "success": False,
            "message": "Invalid proficiency level"
        }), 400

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            UPDATE user_skills
            SET proficiency_level = %s
            WHERE user_id = %s AND skill_id = %s
            """,
            (proficiency_level, user_id, skill_id)
        )

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Skill not found in your profile"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Skill updated successfully"
        }), 200

    except Exception:
        connection.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to update skill"
        }), 500

    finally:
        cursor.close()
        connection.close()
@skills_bp.route("/<int:skill_id>", methods=["DELETE"])
@token_required
def delete_skill(skill_id):
    user_id = request.user["user_id"]

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            DELETE FROM user_skills
            WHERE user_id = %s AND skill_id = %s
            """,
            (user_id, skill_id)
        )

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Skill not found in your profile"
            }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Skill removed successfully"
        }), 200

    except Exception:
        connection.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to remove skill"
        }), 500

    finally:
        cursor.close()
        connection.close()