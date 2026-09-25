from flask import Flask, jsonify
from flask_cors import CORS

from routes.auth import auth_bp
from routes.profile import profile_bp
from routes.skills import skills_bp
from routes.resume import resume_bp
from routes.jobs import jobs_bp
from routes.skill_gap import skill_gap_bp
from routes.roadmap import roadmap_bp
from routes.resume_improvement import resume_improvement_bp
from routes.resume_pdf import resume_pdf_bp
from routes.career_progress import career_progress_bp
from routes.interview import interview_bp
from routes.applications import applications_bp
from routes.dashboard import dashboard_bp


# --------------------------------------------------
# Create Flask application
# --------------------------------------------------

app = Flask(__name__)


# --------------------------------------------------
# CORS
# --------------------------------------------------

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    }
)


# --------------------------------------------------
# Register API blueprints
# --------------------------------------------------

app.register_blueprint(
    auth_bp
)

app.register_blueprint(
    profile_bp
)

app.register_blueprint(
    skills_bp
)

app.register_blueprint(
    resume_bp
)

app.register_blueprint(
    jobs_bp
)

app.register_blueprint(
    skill_gap_bp
)

app.register_blueprint(
    roadmap_bp
)

app.register_blueprint(
    resume_improvement_bp
)

app.register_blueprint(
    resume_pdf_bp
)

app.register_blueprint(
    career_progress_bp
)

app.register_blueprint(
    interview_bp
)

app.register_blueprint(
    applications_bp
)

app.register_blueprint(
    dashboard_bp
)


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.route("/")
def home():

    return jsonify({
        "success": True,
        "message": "HireLens API is running",
        "version": "1.0"
    })


# --------------------------------------------------
# API health check
# --------------------------------------------------

@app.route("/api/health")
def health():

    return jsonify({
        "success": True,
        "message": "HireLens backend is healthy"
    })


# --------------------------------------------------
# Run application
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )