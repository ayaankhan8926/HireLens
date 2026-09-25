from flask import Blueprint, request, jsonify

from utils.db import get_db_connection
from utils.auth import token_required


profile_bp = Blueprint(
    "profile",
    __name__,
    url_prefix="/api/profile"
)


@profile_bp.route("", methods=["GET"])
@token_required
def get_profile():
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
                u.user_id,
                u.full_name,
                u.email,
                p.phone,
                p.location,
                p.education,
                p.bio,
                p.experience_years,
                p.target_role,
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

        profile = cursor.fetchone()

        if not profile:
            return jsonify({
                "success": False,
                "message": "Profile not found"
            }), 404

        return jsonify({
            "success": True,
            "profile": profile
        }), 200

    except Exception:
        return jsonify({
            "success": False,
            "message": "Failed to fetch profile"
        }), 500

    finally:
        cursor.close()
        connection.close()
@profile_bp.route("", methods=["PUT"])
@token_required
def update_profile():
    user_id = request.user["user_id"]
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
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
            UPDATE profiles
            SET
                phone = %s,
                location = %s,
                education = %s,
                bio = %s,
                experience_years = %s,
                target_role = %s,
                github_url = %s,
                linkedin_url = %s,
                portfolio_url = %s
            WHERE user_id = %s
            """,
            (
                data.get("phone"),
                data.get("location"),
                data.get("education"),
                data.get("bio"),
                data.get("experience_years", 0),
                data.get("target_role"),
                data.get("github_url"),
                data.get("linkedin_url"),
                data.get("portfolio_url"),
                user_id
            )
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Profile updated successfully"
        }), 200

    except Exception:
        connection.rollback()

        return jsonify({
            "success": False,
            "message": "Failed to update profile"
        }), 500

    finally:
        cursor.close()
        connection.close()