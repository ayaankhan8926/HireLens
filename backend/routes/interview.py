from flask import Blueprint, jsonify, request

from utils.auth import token_required
from utils.db import get_db_connection
from services.ai_interview_service import (
    try_generate_interview_questions,
    try_evaluate_interview_answer
)


interview_bp = Blueprint(
    "interview",
    __name__,
    url_prefix="/api/interview"
)


# ---------------------------------------------------------
# START INTERVIEW
# ---------------------------------------------------------
@interview_bp.route("/start", methods=["POST"])
@token_required
def start_interview():

    user_id = request.user["user_id"]
    data = request.get_json() or {}

    job_id = data.get("job_id")
    interview_type = data.get("interview_type", "Mixed")
    difficulty = data.get("difficulty", "Medium")
    total_questions = data.get("total_questions", 5)

    allowed_types = [
        "Technical",
        "HR",
        "Mixed"
    ]

    allowed_difficulties = [
        "Easy",
        "Medium",
        "Hard"
    ]

    if interview_type not in allowed_types:
        return jsonify({
            "success": False,
            "message": "Invalid interview type"
        }), 400

    if difficulty not in allowed_difficulties:
        return jsonify({
            "success": False,
            "message": "Invalid difficulty"
        }), 400

    try:
        total_questions = int(total_questions)
    except (TypeError, ValueError):

        return jsonify({
            "success": False,
            "message": "total_questions must be a number"
        }), 400

    if total_questions < 3 or total_questions > 15:

        return jsonify({
            "success": False,
            "message": "total_questions must be between 3 and 15"
        }), 400

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # GET JOB
        # -------------------------------------------------

        job = None

        if job_id is not None:

            cursor.execute(
                """
                SELECT
                    job_id,
                    title,
                    company_name,
                    location,
                    job_type,
                    description,
                    requirements
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

        else:

            return jsonify({
                "success": False,
                "message": "job_id is required for an AI interview"
            }), 400

        # -------------------------------------------------
        # GET USER SKILLS
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
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

        # -------------------------------------------------
        # GET JOB REQUIRED SKILLS
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
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

        # -------------------------------------------------
        # CREATE INTERVIEW SESSION
        # -------------------------------------------------

        cursor.execute(
            """
            INSERT INTO interview_sessions
            (
                user_id,
                job_id,
                interview_type,
                difficulty,
                total_questions,
                completed_questions,
                status
            )
            VALUES (%s, %s, %s, %s, %s, 0, 'In Progress')
            """,
            (
                user_id,
                job_id,
                interview_type,
                difficulty,
                total_questions
            )
        )

        session_id = cursor.lastrowid

        # -------------------------------------------------
        # GENERATE AI QUESTIONS
        # -------------------------------------------------

        ai_result = try_generate_interview_questions(

            job_title=job["title"],

            company=job["company_name"],

            job_description=job["description"],

            required_skills=required_skills,

            user_skills=user_skills,

            interview_type=interview_type,

            difficulty=difficulty,

            total_questions=total_questions
        )

        if not ai_result["success"]:

            connection.rollback()

            error_message = ai_result.get(
                "error",
                "AI question generation failed"
            )

            return jsonify({
                "success": False,
                "message": "Failed to generate interview questions",
                "error": error_message
            }), 503

        generated_questions = (
            ai_result["data"].get(
                "questions",
                []
            )
        )

        if not generated_questions:

            connection.rollback()

            return jsonify({
                "success": False,
                "message": "AI did not generate any interview questions"
            }), 503

        # -------------------------------------------------
        # SAVE GENERATED QUESTIONS
        # -------------------------------------------------

        saved_questions = []

        for index, question in enumerate(
            generated_questions[:total_questions],
            start=1
        ):

            question_text = question.get(
                "question_text",
                ""
            )

            question_type = question.get(
                "question_type",
                "Technical"
            )

            expected_topics = question.get(
                "expected_topics",
                []
            )

            if question_type not in [
                "Technical",
                "HR",
                "Behavioral"
            ]:

                question_type = "Technical"

            expected_topics_text = ", ".join(
                expected_topics
                if isinstance(expected_topics, list)
                else []
            )

            cursor.execute(
                """
                INSERT INTO interview_questions
                (
                    session_id,
                    question_number,
                    question_text,
                    question_type,
                    expected_topics
                )
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    session_id,
                    index,
                    question_text,
                    question_type,
                    expected_topics_text
                )
            )

            question_id = cursor.lastrowid

            saved_questions.append({
                "question_id": question_id,
                "session_id": session_id,
                "question_number": index,
                "question_text": question_text,
                "question_type": question_type,
                "expected_topics": expected_topics
            })

        # -------------------------------------------------
        # COMMIT EVERYTHING
        # -------------------------------------------------

        connection.commit()

        return jsonify({

            "success": True,

            "message": "AI interview started successfully",

            "session": {

                "session_id": session_id,

                "user_id": user_id,

                "job_id": job_id,

                "interview_type": interview_type,

                "difficulty": difficulty,

                "total_questions": len(
                    saved_questions
                ),

                "completed_questions": 0,

                "status": "In Progress"
            },

            "job": {

                "job_id": job["job_id"],

                "title": job["title"],

                "company_name": job["company_name"],

                "location": job["location"],

                "job_type": job["job_type"]
            },

            "questions": saved_questions

        }), 201

    except Exception as error:

        connection.rollback()

        print(
            f"Start AI interview error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to start AI interview"
        }), 500

    finally:

        cursor.close()

        connection.close()


# ---------------------------------------------------------
# GET INTERVIEW SESSION
# ---------------------------------------------------------
@interview_bp.route(
    "/session/<int:session_id>",
    methods=["GET"]
)
@token_required
def get_interview_session(session_id):

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
                i.session_id,
                i.user_id,
                i.job_id,
                i.interview_type,
                i.difficulty,
                i.total_questions,
                i.completed_questions,
                i.overall_score,
                i.status,
                i.started_at,
                i.completed_at,
                j.title AS job_title,
                j.company_name
            FROM interview_sessions i
            LEFT JOIN jobs j
                ON i.job_id = j.job_id
            WHERE i.session_id = %s
              AND i.user_id = %s
            """,
            (
                session_id,
                user_id
            )
        )

        session = cursor.fetchone()

        if not session:

            return jsonify({
                "success": False,
                "message": "Interview session not found"
            }), 404

        cursor.execute(
            """
            SELECT
                question_id,
                session_id,
                question_number,
                question_text,
                question_type,
                expected_topics,
                user_answer,
                score,
                feedback,
                created_at,
                answered_at
            FROM interview_questions
            WHERE session_id = %s
            ORDER BY question_number ASC
            """,
            (session_id,)
        )

        questions = cursor.fetchall()

        return jsonify({
            "success": True,
            "session": session,
            "questions": questions
        }), 200

    except Exception as error:

        print(
            f"Get interview session error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to fetch interview session"
        }), 500

    finally:

        cursor.close()

        connection.close()


# ---------------------------------------------------------
# GET USER INTERVIEW HISTORY
# ---------------------------------------------------------
@interview_bp.route(
    "/history",
    methods=["GET"]
)
@token_required
def get_interview_history():

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
                i.session_id,
                i.job_id,
                i.interview_type,
                i.difficulty,
                i.total_questions,
                i.completed_questions,
                i.overall_score,
                i.status,
                i.started_at,
                i.completed_at,
                j.title AS job_title,
                j.company_name
            FROM interview_sessions i
            LEFT JOIN jobs j
                ON i.job_id = j.job_id
            WHERE i.user_id = %s
            ORDER BY i.started_at DESC
            """,
            (user_id,)
        )

        sessions = cursor.fetchall()

        return jsonify({
            "success": True,
            "sessions": sessions
        }), 200

    except Exception as error:

        print(
            f"Get interview history error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to fetch interview history"
        }), 500

    finally:

        cursor.close()

        connection.close()


# ---------------------------------------------------------
# ADD INTERVIEW QUESTION
# ---------------------------------------------------------
@interview_bp.route(
    "/session/<int:session_id>/question",
    methods=["POST"]
)
@token_required
def add_question(session_id):

    user_id = request.user["user_id"]

    data = request.get_json() or {}

    question_text = data.get(
        "question_text"
    )

    question_type = data.get(
        "question_type",
        "Technical"
    )

    expected_topics = data.get(
        "expected_topics"
    )

    if not question_text:

        return jsonify({
            "success": False,
            "message": "question_text is required"
        }), 400

    allowed_question_types = [
        "Technical",
        "HR",
        "Behavioral"
    ]

    if question_type not in allowed_question_types:

        return jsonify({
            "success": False,
            "message": "Invalid question type"
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
            SELECT
                session_id,
                total_questions,
                status
            FROM interview_sessions
            WHERE session_id = %s
              AND user_id = %s
            """,
            (
                session_id,
                user_id
            )
        )

        session = cursor.fetchone()

        if not session:

            return jsonify({
                "success": False,
                "message": "Interview session not found"
            }), 404

        if session["status"] != "In Progress":

            return jsonify({
                "success": False,
                "message": "Interview session is no longer active"
            }), 400

        cursor.execute(
            """
            SELECT
                COALESCE(
                    MAX(question_number),
                    0
                ) + 1 AS next_number
            FROM interview_questions
            WHERE session_id = %s
            """,
            (session_id,)
        )

        next_number = cursor.fetchone()[
            "next_number"
        ]

        if next_number > session["total_questions"]:

            return jsonify({
                "success": False,
                "message": "Maximum number of questions reached"
            }), 400

        cursor.execute(
            """
            INSERT INTO interview_questions
            (
                session_id,
                question_number,
                question_text,
                question_type,
                expected_topics
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                session_id,
                next_number,
                question_text,
                question_type,
                expected_topics
            )
        )

        question_id = cursor.lastrowid

        connection.commit()

        return jsonify({

            "success": True,

            "message": "Interview question added",

            "question": {

                "question_id": question_id,

                "session_id": session_id,

                "question_number": next_number,

                "question_text": question_text,

                "question_type": question_type,

                "expected_topics": expected_topics
            }

        }), 201

    except Exception as error:

        connection.rollback()

        print(
            f"Add interview question error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to add interview question"
        }), 500

    finally:

        cursor.close()

        connection.close()


# ---------------------------------------------------------
# SUBMIT ANSWER + AI EVALUATION
# ---------------------------------------------------------
@interview_bp.route(
    "/question/<int:question_id>/answer",
    methods=["PUT"]
)
@token_required
def submit_answer(question_id):

    user_id = request.user["user_id"]

    data = request.get_json() or {}

    user_answer = data.get(
        "user_answer"
    )

    if not user_answer or not user_answer.strip():

        return jsonify({
            "success": False,
            "message": "user_answer is required"
        }), 400

    connection = get_db_connection()

    if connection is None:

        return jsonify({
            "success": False,
            "message": "Database connection failed"
        }), 500

    cursor = connection.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # GET QUESTION + SESSION
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                iq.question_id,
                iq.session_id,
                iq.question_number,
                iq.question_text,
                iq.question_type,
                iq.expected_topics,
                i.total_questions,
                i.status,
                j.title AS job_title,
                j.company_name,
                i.difficulty
            FROM interview_questions iq
            INNER JOIN interview_sessions i
                ON iq.session_id = i.session_id
            LEFT JOIN jobs j
                ON i.job_id = j.job_id
            WHERE iq.question_id = %s
              AND i.user_id = %s
            """,
            (
                question_id,
                user_id
            )
        )

        question = cursor.fetchone()

        if not question:

            return jsonify({
                "success": False,
                "message": "Interview question not found"
            }), 404

        if question["status"] != "In Progress":

            return jsonify({
                "success": False,
                "message": "Interview session is no longer active"
            }), 400

        # -------------------------------------------------
        # PARSE EXPECTED TOPICS
        # -------------------------------------------------

        expected_topics = []

        if question["expected_topics"]:

            expected_topics = [
                topic.strip()
                for topic in question[
                    "expected_topics"
                ].split(",")
                if topic.strip()
            ]

        # -------------------------------------------------
        # AI EVALUATION
        # -------------------------------------------------

        ai_result = try_evaluate_interview_answer(

            question=question["question_text"],

            question_type=question["question_type"],

            expected_topics=expected_topics,

            user_answer=user_answer.strip(),

            job_title=question["job_title"] or "Target Role",

            difficulty=question["difficulty"]
        )

        if not ai_result["success"]:

            return jsonify({
                "success": False,
                "message": "Failed to evaluate interview answer",
                "error": ai_result.get("error")
            }), 503

        evaluation = ai_result["data"]

        score = float(
            evaluation.get(
                "score",
                0
            )
        )

        score = max(
            0,
            min(
                100,
                score
            )
        )

        feedback = evaluation.get(
            "feedback",
            ""
        )

        # -------------------------------------------------
        # SAVE ANSWER + AI EVALUATION
        # -------------------------------------------------

        cursor.execute(
            """
            UPDATE interview_questions
            SET
                user_answer = %s,
                score = %s,
                feedback = %s,
                answered_at = CURRENT_TIMESTAMP
            WHERE question_id = %s
            """,
            (
                user_answer.strip(),
                score,
                feedback,
                question_id
            )
        )

        # -------------------------------------------------
        # UPDATE COMPLETED QUESTION COUNT
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                COUNT(*) AS completed_count
            FROM interview_questions
            WHERE session_id = %s
              AND user_answer IS NOT NULL
              AND TRIM(user_answer) <> ''
            """,
            (
                question["session_id"],
            )
        )

        completed_count = cursor.fetchone()[
            "completed_count"
        ]

        cursor.execute(
            """
            UPDATE interview_sessions
            SET
                completed_questions = %s
            WHERE session_id = %s
            """,
            (
                completed_count,
                question["session_id"]
            )
        )

        connection.commit()

        return jsonify({

            "success": True,

            "message": "Answer evaluated successfully",

            "question": {

                "question_id": question_id,

                "score": score,

                "feedback": feedback,

                "strengths": evaluation.get(
                    "strengths",
                    []
                ),

                "improvements": evaluation.get(
                    "improvements",
                    []
                ),

                "ideal_answer_points": evaluation.get(
                    "ideal_answer_points",
                    []
                )
            },

            "interview": {

                "completed_questions": completed_count,

                "total_questions": question[
                    "total_questions"
                ]
            }

        }), 200

    except Exception as error:

        connection.rollback()

        print(
            f"Submit interview answer error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to submit interview answer"
        }), 500

    finally:

        cursor.close()

        connection.close()


# ---------------------------------------------------------
# COMPLETE INTERVIEW
# ---------------------------------------------------------
@interview_bp.route(
    "/session/<int:session_id>/complete",
    methods=["PUT"]
)
@token_required
def complete_interview(session_id):

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
                session_id,
                total_questions,
                completed_questions,
                status
            FROM interview_sessions
            WHERE session_id = %s
              AND user_id = %s
            """,
            (
                session_id,
                user_id
            )
        )

        session = cursor.fetchone()

        if not session:

            return jsonify({
                "success": False,
                "message": "Interview session not found"
            }), 404

        if session["status"] == "Completed":

            return jsonify({
                "success": False,
                "message": "Interview is already completed"
            }), 400

        cursor.execute(
            """
            SELECT
                COUNT(*) AS answered_count,
                AVG(score) AS average_score
            FROM interview_questions
            WHERE session_id = %s
              AND user_answer IS NOT NULL
              AND TRIM(user_answer) <> ''
            """,
            (
                session_id,
            )
        )

        result = cursor.fetchone()

        answered_count = result[
            "answered_count"
        ]

        average_score = result[
            "average_score"
        ]

        if average_score is not None:

            average_score = round(
                float(average_score),
                2
            )

        cursor.execute(
            """
            UPDATE interview_sessions
            SET
                completed_questions = %s,
                overall_score = %s,
                status = 'Completed',
                completed_at = CURRENT_TIMESTAMP
            WHERE session_id = %s
            """,
            (
                answered_count,
                average_score,
                session_id
            )
        )

        connection.commit()

        return jsonify({

            "success": True,

            "message": "Interview completed",

            "session_id": session_id,

            "completed_questions": answered_count,

            "total_questions": session[
                "total_questions"
            ],

            "overall_score": average_score,

            "status": "Completed"

        }), 200

    except Exception as error:

        connection.rollback()

        print(
            f"Complete interview error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to complete interview"
        }), 500

    finally:

        cursor.close()

        connection.close()


# ---------------------------------------------------------
# ABANDON INTERVIEW
# ---------------------------------------------------------
@interview_bp.route(
    "/session/<int:session_id>/abandon",
    methods=["PUT"]
)
@token_required
def abandon_interview(session_id):

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
            UPDATE interview_sessions
            SET
                status = 'Abandoned',
                completed_at = CURRENT_TIMESTAMP
            WHERE session_id = %s
              AND user_id = %s
              AND status = 'In Progress'
            """,
            (
                session_id,
                user_id
            )
        )

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Active interview session not found"
            }), 404

        connection.commit()

        return jsonify({

            "success": True,

            "message": "Interview abandoned",

            "session_id": session_id,

            "status": "Abandoned"

        }), 200

    except Exception as error:

        connection.rollback()

        print(
            f"Abandon interview error: {error}"
        )

        return jsonify({
            "success": False,
            "message": "Failed to abandon interview"
        }), 500

    finally:

        cursor.close()

        connection.close()