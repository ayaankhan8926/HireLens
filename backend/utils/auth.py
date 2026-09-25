from functools import wraps

import jwt
from flask import request, jsonify

from config import Config


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        token = None

        auth_header = request.headers.get("Authorization")

        if auth_header:
            parts = auth_header.split(" ")

            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]

        if not token:
            return jsonify({
                "success": False,
                "message": "Authentication token is required"
            }), 401

        try:
            decoded_token = jwt.decode(
                token,
                Config.JWT_SECRET_KEY,
                algorithms=["HS256"]
            )

            request.user = decoded_token

        except jwt.ExpiredSignatureError:
            return jsonify({
                "success": False,
                "message": "Authentication token has expired"
            }), 401

        except jwt.InvalidTokenError:
            return jsonify({
                "success": False,
                "message": "Invalid authentication token"
            }), 401

        return f(*args, **kwargs)

    return decorated