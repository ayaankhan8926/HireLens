from flask import Blueprint, jsonify, request

from utils.auth import token_required
from utils.db import get_db_connection


applications_bp = Blueprint(
    "applications",
    __name__,
    url_prefix="/api/applications"
)


# ---------------------------------------------------------
# APPLY TO A JOB
# ---------------------------------------------------------

@applications_bp.route("", methods=["POST"])
@token_required
def apply_to_job():

    user_id = request.user["user_id"]

    data = request.get_json() or {}

    job_id = data.get("job_id")
    notes = data.get("notes")

    if not job_id:
        return jsonify({
            "success": False,
            "message": "job_id is required"
        }), 400

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor(dictionary=True)

    try:

        # Check whether the job exists
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

        # Check whether the user already applied
        cursor.execute(
            """
            SELECT
                application_id,
                status
            FROM applications
            WHERE user_id = %s
              AND job_id = %s
            """,
            (user_id, job_id)
        )

        existing_application = cursor.fetchone()

        if existing_application:

            return jsonify({
                "success": False,
                "message": "You have already applied to this job",
                "application": existing_application
            }), 409

        # Create application
        cursor.execute(
            """
            INSERT INTO applications (
                user_id,
                job_id,
                status,
                notes
            )
            VALUES (%s, %s, 'Applied', %s)
            """,
            (
                user_id,
                job_id,
                notes
            )
        )

        connection.commit()

        application_id = cursor.lastrowid

        # Fetch created application
        cursor.execute(
            """
            SELECT
                a.application_id,
                a.user_id,
                a.job_id,
                a.status,
                a.applied_at,
                a.last_updated,
                a.notes,
                j.title,
                j.company_name,
                j.location,
                j.job_type
            FROM applications a
            INNER JOIN jobs j
                ON a.job_id = j.job_id
            WHERE a.application_id = %s
            """,
            (application_id,)
        )

        application = cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Application submitted successfully",
            "application": application
        }), 201

    except Exception as error:

        connection.rollback()

        print(
            f"Application creation error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to submit application"
        }), 500

    finally:

        cursor.close()
        connection.close()


# ---------------------------------------------------------
# GET MY APPLICATIONS
# ---------------------------------------------------------

@applications_bp.route("", methods=["GET"])
@token_required
def get_my_applications():

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
                a.application_id,
                a.job_id,
                a.status,
                a.applied_at,
                a.last_updated,
                a.notes,

                j.title,
                j.company_name,
                j.location,
                j.job_type,
                j.experience_required,
                j.salary_range,
                j.application_url

            FROM applications a

            INNER JOIN jobs j
                ON a.job_id = j.job_id

            WHERE a.user_id = %s

            ORDER BY a.last_updated DESC
            """,
            (user_id,)
        )

        applications = cursor.fetchall()

        return jsonify({
            "success": True,
            "total_applications": len(applications),
            "applications": applications
        }), 200

    except Exception as error:

        print(
            f"Application fetch error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to fetch applications"
        }), 500

    finally:

        cursor.close()
        connection.close()


# ---------------------------------------------------------
# GET SINGLE APPLICATION
# ---------------------------------------------------------

@applications_bp.route("/<int:application_id>", methods=["GET"])
@token_required
def get_application(application_id):

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
                a.application_id,
                a.user_id,
                a.job_id,
                a.status,
                a.applied_at,
                a.last_updated,
                a.notes,

                j.title,
                j.company_name,
                j.location,
                j.job_type,
                j.experience_required,
                j.description,
                j.requirements,
                j.salary_range,
                j.application_url

            FROM applications a

            INNER JOIN jobs j
                ON a.job_id = j.job_id

            WHERE a.application_id = %s
              AND a.user_id = %s
            """,
            (
                application_id,
                user_id
            )
        )

        application = cursor.fetchone()

        if not application:

            return jsonify({
                "success": False,
                "message": "Application not found"
            }), 404

        return jsonify({
            "success": True,
            "application": application
        }), 200

    except Exception as error:

        print(
            f"Single application fetch error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to fetch application"
        }), 500

    finally:

        cursor.close()
        connection.close()


# ---------------------------------------------------------
# UPDATE APPLICATION STATUS
# ---------------------------------------------------------

@applications_bp.route(
    "/<int:application_id>/status",
    methods=["PUT"]
)
@token_required
def update_application_status(application_id):

    user_id = request.user["user_id"]

    data = request.get_json() or {}

    status = data.get("status")

    allowed_statuses = [
        "Applied",
        "Screening",
        "Interview",
        "Offer",
        "Rejected",
        "Withdrawn"
    ]

    if status not in allowed_statuses:

        return jsonify({
            "success": False,
            "message": "Invalid application status"
        }), 400

    connection = get_db_connection()

    if connection is None:
        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor(dictionary=True)

    try:

        # Make sure application belongs to current user
        cursor.execute(
            """
            SELECT
                application_id
            FROM applications
            WHERE application_id = %s
              AND user_id = %s
            """,
            (
                application_id,
                user_id
            )
        )

        application = cursor.fetchone()

        if not application:

            return jsonify({
                "success": False,
                "message": "Application not found"
            }), 404

        cursor.execute(
            """
            UPDATE applications
            SET status = %s
            WHERE application_id = %s
              AND user_id = %s
            """,
            (
                status,
                application_id,
                user_id
            )
        )

        connection.commit()

        cursor.execute(
            """
            SELECT
                application_id,
                job_id,
                status,
                applied_at,
                last_updated,
                notes
            FROM applications
            WHERE application_id = %s
              AND user_id = %s
            """,
            (
                application_id,
                user_id
            )
        )

        updated_application = cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Application status updated successfully",
            "application": updated_application
        }), 200

    except Exception as error:

        connection.rollback()

        print(
            f"Application status update error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to update application status"
        }), 500

    finally:

        cursor.close()
        connection.close()


# ---------------------------------------------------------
# UPDATE APPLICATION NOTES
# ---------------------------------------------------------

@applications_bp.route(
    "/<int:application_id>/notes",
    methods=["PUT"]
)
@token_required
def update_application_notes(application_id):

    user_id = request.user["user_id"]

    data = request.get_json() or {}

    notes = data.get("notes")

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
                application_id
            FROM applications
            WHERE application_id = %s
              AND user_id = %s
            """,
            (
                application_id,
                user_id
            )
        )

        application = cursor.fetchone()

        if not application:

            return jsonify({
                "success": False,
                "message": "Application not found"
            }), 404

        cursor.execute(
            """
            UPDATE applications
            SET notes = %s
            WHERE application_id = %s
              AND user_id = %s
            """,
            (
                notes,
                application_id,
                user_id
            )
        )

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Application notes updated successfully"
        }), 200

    except Exception as error:

        connection.rollback()

        print(
            f"Application notes update error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to update application notes"
        }), 500

    finally:

        cursor.close()
        connection.close()