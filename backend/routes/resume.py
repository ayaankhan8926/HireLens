import os
import uuid

from flask import Blueprint, request, jsonify

from utils.auth import token_required
from utils.db import get_db_connection
from services.resume_service import extract_resume_text
from services.resume_analyzer import extract_skills
from services.resume_parser import extract_resume_sections
from services.career_profile import build_career_profile


resume_bp = Blueprint(
    "resume",
    __name__,
    url_prefix="/api/resume"
)


UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),
    "uploads"
)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx"
}


@resume_bp.route("/upload", methods=["POST"])
@token_required
def upload_resume():
    user_id = request.user["user_id"]

    if "resume" not in request.files:
        return jsonify({
            "success": False,
            "message": "Resume file is required"
        }), 400

    file = request.files["resume"]

    if not file or not file.filename:
        return jsonify({
            "success": False,
            "message": "Please select a resume file"
        }), 400

    extension = os.path.splitext(file.filename)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({
            "success": False,
            "message": "Only PDF and DOCX files are supported"
        }), 400

    unique_filename = (
        f"{user_id}_{uuid.uuid4().hex}{extension}"
    )

    file_path = os.path.join(
        UPLOAD_FOLDER,
        unique_filename
    )

    try:
        file.save(file_path)

        extracted_text = extract_resume_text(file_path)

        if not extracted_text:
            os.remove(file_path)

            return jsonify({
                "success": False,
                "message": "Could not extract text from the resume"
            }), 400

        connection = get_db_connection()

        if connection is None:
            os.remove(file_path)

            return jsonify({
                "success": False,
                "message": "Database connection failed"
            }), 500

        cursor = connection.cursor()

        cursor.execute(
            """
            INSERT INTO resumes (
                user_id,
                file_name,
                file_path,
                extracted_text
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                user_id,
                file.filename,
                file_path,
                extracted_text
            )
        )

        resume_id = cursor.lastrowid

        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({
            "success": True,
            "message": "Resume uploaded and processed successfully",
            "resume_id": resume_id,
            "file_name": file.filename,
            "extracted_text_length": len(extracted_text)
        }), 201

    except Exception as error:
        print(f"Resume upload error: {error}")

        if os.path.exists(file_path):
            os.remove(file_path)

        return jsonify({
            "success": False,
            "message": "Failed to process resume"
        }), 500


@resume_bp.route("/<int:resume_id>/analyze", methods=["GET"])
@token_required
def analyze_resume(resume_id):
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
                resume_id,
                file_name,
                extracted_text
            FROM resumes
            WHERE resume_id = %s
              AND user_id = %s
            """,
            (resume_id, user_id)
        )

        resume = cursor.fetchone()

        if not resume:
            return jsonify({
                "success": False,
                "message": "Resume not found"
            }), 404

        extracted_text = resume["extracted_text"]

        detected_skills = extract_skills(
            extracted_text
        )

        sections = extract_resume_sections(
            extracted_text
        )

        # -------------------------------------------------
        # Synchronize detected resume skills with user_skills
        # -------------------------------------------------

        for skill_name in detected_skills:

            cursor.execute(
                """
                SELECT skill_id
                FROM skills
                WHERE LOWER(skill_name) = LOWER(%s)
                """,
                (skill_name,)
            )

            skill = cursor.fetchone()

            if not skill:
                continue

            skill_id = skill["skill_id"]

            cursor.execute(
                """
                SELECT user_skill_id
                FROM user_skills
                WHERE user_id = %s
                  AND skill_id = %s
                """,
                (user_id, skill_id)
            )

            existing_skill = cursor.fetchone()

            if not existing_skill:
                cursor.execute(
                    """
                    INSERT INTO user_skills (
                        user_id,
                        skill_id,
                        proficiency_level
                    )
                    VALUES (%s, %s, %s)
                    """,
                    (
                        user_id,
                        skill_id,
                        "Intermediate"
                    )
                )

        connection.commit()

        # -------------------------------------------------
        # Build career profile
        # -------------------------------------------------

        analysis = {
            "skills": detected_skills,
            "skill_count": len(detected_skills),
            "education": sections["education"],
            "experience": sections["experience"],
            "projects": sections["projects"],
            "certifications": sections["certifications"],
            "skills_section": sections["skills"]
        }

        career_profile = build_career_profile(
            analysis
        )

        return jsonify({
            "success": True,

            "resume": {
                "resume_id": resume["resume_id"],
                "file_name": resume["file_name"]
            },

            "analysis": analysis,

            "career_profile": career_profile
        }), 200

    except Exception as error:
        connection.rollback()

        print(f"Resume analysis error: {error}")

        return jsonify({
            "success": False,
            "message": "Failed to analyze resume"
        }), 500

    finally:
        cursor.close()
        connection.close()