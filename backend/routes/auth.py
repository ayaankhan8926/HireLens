from flask import Blueprint, request, jsonify
import bcrypt
import jwt
from datetime import datetime, timedelta

from config import Config
from utils.db import get_db_connection
from utils.auth import token_required


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    full_name = data.get("full_name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not full_name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Full name, email and password are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must be at least 8 characters"
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
            "SELECT user_id FROM users WHERE email = %s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            return jsonify({
                "success": False,
                "message": "An account with this email already exists"
            }), 409

        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        cursor.execute(
            """
            INSERT INTO users (full_name, email, password_hash)
            VALUES (%s, %s, %s)
            """,
            (full_name, email, password_hash)
        )

        user_id = cursor.lastrowid

        cursor.execute(
            """
            INSERT INTO profiles (user_id)
            VALUES (%s)
            """,
            (user_id,)
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Account created successfully",
            "user_id": user_id
        }), 201

    except Exception:
        connection.rollback()

        return jsonify({
            "success": False,
            "message": "Registration failed"
        }), 500

    finally:
        cursor.close()
        connection.close()


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "Request body is required"
        }), 400

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
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
            SELECT user_id, full_name, email, password_hash, role
            FROM users
            WHERE email = %s
            """,
            (email,)
        )

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        password_valid = bcrypt.checkpw(
            password.encode("utf-8"),
            user["password_hash"].encode("utf-8")
        )

        if not password_valid:
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        token = jwt.encode(
            {
                "user_id": user["user_id"],
                "email": user["email"],
                "role": user["role"],
                "exp": datetime.utcnow() + timedelta(hours=24)
            },
            Config.JWT_SECRET_KEY,
            algorithm="HS256"
        )

        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "user_id": user["user_id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "role": user["role"]
            }
        }), 200

    except Exception:
        return jsonify({
            "success": False,
            "message": "Login failed"
        }), 500

    finally:
        cursor.close()
        connection.close()
@auth_bp.route("/me", methods=["GET"])
@token_required
def get_current_user():
    return jsonify({
        "success": True,
        "user": {
            "user_id": request.user["user_id"],
            "email": request.user["email"],
            "role": request.user["role"]
        }
    }), 200