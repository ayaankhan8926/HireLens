from flask import Blueprint, jsonify, request
from utils.auth import token_required
from config import Config
import mysql.connector


# --------------------------------------------------
# Blueprint
# --------------------------------------------------

dashboard_bp = Blueprint(
    "dashboard",
    __name__,
    url_prefix="/api/dashboard"
)


# --------------------------------------------------
# Database connection
# --------------------------------------------------

def get_db_connection():

    return mysql.connector.connect(
        host=Config.MYSQL_HOST,
        port=Config.MYSQL_PORT,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DATABASE
    )


# --------------------------------------------------
# Dashboard Analytics
# --------------------------------------------------

@dashboard_bp.route("/analytics", methods=["GET"])
@token_required
def dashboard_analytics():

    connection = None
    cursor = None

    try:

        # --------------------------------------------------
        # Get authenticated user from request
        # --------------------------------------------------

        user = request.user

        user_id = user.get("user_id")

        if not user_id:

            return jsonify({
                "success": False,
                "message": "User information is missing from authentication token"
            }), 401


        # --------------------------------------------------
        # Database connection
        # --------------------------------------------------

        connection = get_db_connection()

        cursor = connection.cursor(dictionary=True)


        # --------------------------------------------------
        # Application statistics
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                COUNT(*) AS total_applications,

                SUM(
                    CASE
                        WHEN status = 'Applied'
                        THEN 1
                        ELSE 0
                    END
                ) AS applied,

                SUM(
                    CASE
                        WHEN status = 'Screening'
                        THEN 1
                        ELSE 0
                    END
                ) AS screening,

                SUM(
                    CASE
                        WHEN status = 'Interview'
                        THEN 1
                        ELSE 0
                    END
                ) AS interviews,

                SUM(
                    CASE
                        WHEN status = 'Offer'
                        THEN 1
                        ELSE 0
                    END
                ) AS offers,

                SUM(
                    CASE
                        WHEN status = 'Rejected'
                        THEN 1
                        ELSE 0
                    END
                ) AS rejected,

                SUM(
                    CASE
                        WHEN status = 'Withdrawn'
                        THEN 1
                        ELSE 0
                    END
                ) AS withdrawn

            FROM applications

            WHERE user_id = %s
            """,
            (user_id,)
        )

        application_stats = cursor.fetchone()


        # --------------------------------------------------
        # Recent applications
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                a.application_id,
                a.job_id,
                a.status,
                a.applied_at,
                a.last_updated,
                j.title,
                j.company_name,
                j.location

            FROM applications a

            INNER JOIN jobs j
                ON a.job_id = j.job_id

            WHERE a.user_id = %s

            ORDER BY a.last_updated DESC

            LIMIT 5
            """,
            (user_id,)
        )

        recent_applications = cursor.fetchall()


        # --------------------------------------------------
        # Convert NULL values to 0
        # --------------------------------------------------

        if application_stats:

            for key in application_stats:

                if application_stats[key] is None:

                    application_stats[key] = 0

        else:

            application_stats = {
                "total_applications": 0,
                "applied": 0,
                "screening": 0,
                "interviews": 0,
                "offers": 0,
                "rejected": 0,
                "withdrawn": 0
            }


        # --------------------------------------------------
        # Response
        # --------------------------------------------------

        return jsonify({

            "success": True,

            "applications": {

                "total":
                    int(application_stats["total_applications"]),

                "applied":
                    int(application_stats["applied"]),

                "screening":
                    int(application_stats["screening"]),

                "interviews":
                    int(application_stats["interviews"]),

                "offers":
                    int(application_stats["offers"]),

                "rejected":
                    int(application_stats["rejected"]),

                "withdrawn":
                    int(application_stats["withdrawn"])
            },

            "recent_applications":
                recent_applications

        }), 200


    # --------------------------------------------------
    # Database error
    # --------------------------------------------------

    except mysql.connector.Error as e:

        print("Dashboard database error:", e)

        return jsonify({
            "success": False,
            "message": "Database error while loading dashboard analytics"
        }), 500


    # --------------------------------------------------
    # General error
    # --------------------------------------------------

    except Exception as e:

        print("Dashboard analytics error:", e)

        return jsonify({
            "success": False,
            "message": "Failed to load dashboard analytics"
        }), 500


    # --------------------------------------------------
    # Cleanup
    # --------------------------------------------------

    finally:

        if cursor:

            cursor.close()

        if connection:

            connection.close()