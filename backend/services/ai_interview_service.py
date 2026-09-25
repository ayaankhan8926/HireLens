import os
import re

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from google import genai
from google.genai import types


load_dotenv()


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.8-flash"
)

GEMINI_FALLBACK_MODEL = os.getenv(
    "GEMINI_FALLBACK_MODEL",
    "gemini-3.6-flash"
)


# ============================================================
# PYDANTIC RESPONSE MODELS
# ============================================================

class InterviewQuestion(BaseModel):
    question_number: int
    question_text: str
    question_type: str
    expected_topics: list[str] = Field(default_factory=list)


class InterviewQuestionSet(BaseModel):
    questions: list[InterviewQuestion]


class AnswerEvaluation(BaseModel):
    score: float
    feedback: str
    strengths: list[str] = Field(default_factory=list)
    improvements: list[str] = Field(default_factory=list)
    ideal_points: list[str] = Field(default_factory=list)


# ============================================================
# GEMINI CLIENT
# ============================================================

def get_gemini_client():
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured."
        )

    return genai.Client(
        api_key=GEMINI_API_KEY
    )


# ============================================================
# INTERVIEW QUESTION PROMPT
# ============================================================

def build_interview_prompt(
    job_title,
    company,
    job_description,
    required_skills,
    user_skills,
    interview_type,
    difficulty,
    total_questions,
):
    user_skills_text = (
        ", ".join(user_skills)
        if user_skills
        else "No skills provided"
    )

    required_skills_text = (
        ", ".join(required_skills)
        if required_skills
        else "No specific required skills provided"
    )

    return f"""
You are HireLens Interview AI, an expert technical and HR interviewer.

Generate a realistic interview for a candidate preparing for this job.

TARGET JOB
-----------
Role: {job_title}
Company: {company}

JOB DESCRIPTION
---------------
{job_description}

CANDIDATE SKILLS
----------------
{user_skills_text}

REQUIRED JOB SKILLS
-------------------
{required_skills_text}

INTERVIEW SETTINGS
------------------
Interview Type: {interview_type}
Difficulty: {difficulty}
Number of Questions: {total_questions}

IMPORTANT REQUIREMENTS
----------------------
1. Generate exactly {total_questions} questions.
2. Questions must be directly relevant to the target job.
3. Use the candidate's current skills where appropriate.
4. Make the interview realistic and useful for placement preparation.
5. Difficulty must match {difficulty}.
6. For Technical interviews, focus on programming,
   problem solving, debugging, databases, APIs,
   architecture and role-specific skills.
7. For HR interviews, focus on behavioral,
   situational, teamwork, communication,
   leadership and career questions.
8. For Mixed interviews, combine technical and HR questions.
9. Do not provide answers.
10. expected_topics must contain important concepts
    that a strong candidate should cover.
11. Avoid duplicate questions.
12. Do not invent candidate experience.

Return only structured JSON.
"""


# ============================================================
# GEMINI QUESTION GENERATION
# ============================================================

def _generate_questions_with_model(
    client,
    model_name,
    prompt,
):
    print(
        f"HireLens Interview AI: requesting {model_name}"
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=InterviewQuestionSet,
            temperature=0.3,
        ),
    )

    if not response.parsed:
        raise RuntimeError(
            "Gemini returned an empty interview question response."
        )

    return response.parsed


# ============================================================
# LOCAL QUESTION BANK
# ============================================================

LOCAL_QUESTION_BANK = {

    "Technical": {

        "Software Engineer": [
            (
                "Explain the software development lifecycle and "
                "describe how you would approach developing a new feature.",
                ["SDLC", "requirements", "design", "testing", "deployment"]
            ),
            (
                "How would you debug a production issue where an API "
                "has suddenly become very slow?",
                ["debugging", "API", "logs", "performance", "database"]
            ),
            (
                "Explain the difference between an array and a linked list. "
                "When would you choose one over the other?",
                ["arrays", "linked lists", "data structures", "complexity"]
            ),
            (
                "What is the difference between authentication and "
                "authorization?",
                ["authentication", "authorization", "security", "JWT"]
            ),
            (
                "How would you design a REST API for a simple job portal?",
                ["REST", "HTTP", "API design", "endpoints", "CRUD"]
            ),
            (
                "What steps would you take to improve the performance "
                "of a slow SQL query?",
                ["SQL", "indexes", "query optimization", "database"]
            ),
            (
                "Explain exception handling and why it is important "
                "in production applications.",
                ["exceptions", "error handling", "logging", "reliability"]
            ),
        ],

        "Full Stack Developer": [
            (
                "Explain how a React frontend communicates with a Flask "
                "or Node.js backend.",
                ["React", "REST API", "HTTP", "backend", "JSON"]
            ),
            (
                "What is the difference between state and props in React?",
                ["React", "state", "props", "components"]
            ),
            (
                "How would you secure a login system for a full-stack application?",
                ["authentication", "JWT", "password hashing", "security"]
            ),
            (
                "Explain how CORS works and why it can cause problems "
                "between a frontend and backend.",
                ["CORS", "HTTP", "frontend", "backend"]
            ),
            (
                "How would you design the database for an e-commerce application?",
                ["database design", "relationships", "normalization", "SQL"]
            ),
            (
                "How would you deploy a React and Flask application?",
                ["deployment", "frontend", "backend", "cloud", "environment variables"]
            ),
            (
                "How would you troubleshoot a full-stack application "
                "that works locally but fails after deployment?",
                ["deployment", "logs", "environment variables", "database", "debugging"]
            ),
        ],

        "Python Developer": [
            (
                "What are Python lists, tuples, sets and dictionaries, "
                "and when would you use each?",
                ["Python", "lists", "tuples", "sets", "dictionaries"]
            ),
            (
                "Explain Python exception handling with an example.",
                ["Python", "exceptions", "try", "except", "error handling"]
            ),
            (
                "What is the difference between a list comprehension "
                "and a traditional loop?",
                ["Python", "list comprehension", "loops"]
            ),
            (
                "How would you optimize a Python program that is taking "
                "too long to execute?",
                ["Python", "profiling", "optimization", "complexity"]
            ),
            (
                "What are modules and packages in Python?",
                ["Python", "modules", "packages", "imports"]
            ),
            (
                "How would you build a REST API using Flask?",
                ["Flask", "REST API", "routes", "HTTP", "JSON"]
            ),
            (
                "How do you manage dependencies in a Python project?",
                ["Python", "venv", "pip", "requirements.txt"]
            ),
        ],

        "Java Backend Developer": [
            (
                "Explain the four main principles of object-oriented programming.",
                ["OOP", "encapsulation", "inheritance", "polymorphism", "abstraction"]
            ),
            (
                "What is the difference between an interface and "
                "an abstract class in Java?",
                ["Java", "interface", "abstract class", "OOP"]
            ),
            (
                "Explain the Java Collections Framework.",
                ["Java", "Collections", "List", "Set", "Map"]
            ),
            (
                "How does exception handling work in Java?",
                ["Java", "exceptions", "try", "catch", "finally"]
            ),
            (
                "What is Spring Boot and why is it commonly used "
                "for backend development?",
                ["Java", "Spring Boot", "REST API", "backend"]
            ),
            (
                "How would you design a REST API using Spring Boot?",
                ["Spring Boot", "REST", "controllers", "services", "APIs"]
            ),
            (
                "What is JPA and how does it interact with a relational database?",
                ["JPA", "Hibernate", "database", "ORM"]
            ),
        ],

        "Frontend Developer": [
            (
                "Explain the difference between HTML, CSS and JavaScript.",
                ["HTML", "CSS", "JavaScript", "frontend"]
            ),
            (
                "What is the purpose of React components?",
                ["React", "components", "frontend"]
            ),
            (
                "Explain React state and the useState hook.",
                ["React", "state", "useState", "hooks"]
            ),
            (
                "What is the useEffect hook used for?",
                ["React", "useEffect", "side effects", "hooks"]
            ),
            (
                "How would you improve the performance of a React application?",
                ["React", "performance", "rendering", "memoization"]
            ),
            (
                "How does a frontend application communicate with a REST API?",
                ["frontend", "REST", "HTTP", "Axios", "fetch"]
            ),
            (
                "How would you make a web application responsive?",
                ["CSS", "responsive design", "media queries", "Tailwind"]
            ),
        ],

        "Machine Learning Engineer": [
            (
                "Explain the difference between supervised and "
                "unsupervised learning.",
                ["machine learning", "supervised learning", "unsupervised learning"]
            ),
            (
                "What is overfitting and how can you reduce it?",
                ["overfitting", "regularization", "validation", "machine learning"]
            ),
            (
                "Explain the difference between classification and regression.",
                ["classification", "regression", "machine learning"]
            ),
            (
                "Why do we split data into training and testing sets?",
                ["training", "testing", "validation", "machine learning"]
            ),
            (
                "Explain precision, recall and F1 score.",
                ["precision", "recall", "F1", "evaluation"]
            ),
            (
                "How does feature scaling affect machine learning models?",
                ["feature scaling", "normalization", "standardization"]
            ),
            (
                "Describe how you would deploy a machine learning model "
                "as an API.",
                ["ML deployment", "API", "Flask", "model serving"]
            ),
        ],

        "Cloud Engineer": [
            (
                "What is cloud computing and what are its major advantages?",
                ["cloud computing", "scalability", "availability", "cost"]
            ),
            (
                "Explain the difference between IaaS, PaaS and SaaS.",
                ["IaaS", "PaaS", "SaaS", "cloud"]
            ),
            (
                "What is the purpose of Docker containers?",
                ["Docker", "containers", "images", "deployment"]
            ),
            (
                "How would you deploy a web application to AWS?",
                ["AWS", "deployment", "EC2", "cloud"]
            ),
            (
                "What is IAM and why is it important in cloud security?",
                ["IAM", "security", "AWS", "permissions"]
            ),
            (
                "How would you monitor a production cloud application?",
                ["monitoring", "logs", "metrics", "alerts"]
            ),
            (
                "What is horizontal scaling?",
                ["scaling", "load balancing", "cloud", "availability"]
            ),
        ],

        "AI Engineer": [
            (
                "Explain the difference between artificial intelligence, "
                "machine learning and deep learning.",
                ["AI", "machine learning", "deep learning"]
            ),
            (
                "What is natural language processing?",
                ["NLP", "AI", "text processing"]
            ),
            (
                "How would you evaluate an AI model?",
                ["AI evaluation", "metrics", "testing", "validation"]
            ),
            (
                "What is the purpose of embeddings in modern AI systems?",
                ["embeddings", "vectors", "semantic similarity"]
            ),
            (
                "Explain how an AI application can use an external API.",
                ["AI API", "REST", "API integration"]
            ),
            (
                "What are some common causes of hallucinations in AI systems?",
                ["LLM", "hallucination", "AI reliability"]
            ),
            (
                "How would you design an AI-powered application "
                "for production use?",
                ["AI architecture", "API", "database", "deployment"]
            ),
        ],

        "Data Analyst": [
            (
                "What is the difference between SQL WHERE and HAVING?",
                ["SQL", "WHERE", "HAVING", "aggregation"]
            ),
            (
                "Explain INNER JOIN and LEFT JOIN.",
                ["SQL", "JOIN", "relational database"]
            ),
            (
                "How would you handle missing values in a dataset?",
                ["data cleaning", "missing values", "data analysis"]
            ),
            (
                "What is the difference between correlation and causation?",
                ["statistics", "correlation", "causation"]
            ),
            (
                "How would you identify outliers in a dataset?",
                ["outliers", "statistics", "data analysis"]
            ),
            (
                "What is data visualization and why is it important?",
                ["visualization", "charts", "data analysis"]
            ),
            (
                "How would you communicate an important data insight "
                "to a non-technical manager?",
                ["communication", "data storytelling", "business analysis"]
            ),
        ],
    },

    "HR": {
        "default": [
            (
                "Tell me about yourself and walk me through your background.",
                ["introduction", "education", "experience", "projects"]
            ),
            (
                "Why are you interested in this role?",
                ["motivation", "role", "career goals"]
            ),
            (
                "Why should we hire you?",
                ["strengths", "skills", "value", "role"]
            ),
            (
                "Tell me about a challenging project you worked on.",
                ["project", "challenge", "problem solving", "result"]
            ),
            (
                "Tell me about a time you made a mistake and how you handled it.",
                ["mistake", "ownership", "learning", "improvement"]
            ),
            (
                "How do you handle working under pressure?",
                ["pressure", "prioritization", "communication"]
            ),
            (
                "Where do you see yourself in the next three to five years?",
                ["career goals", "growth", "planning"]
            ),
            (
                "How do you handle disagreement with a teammate?",
                ["teamwork", "conflict resolution", "communication"]
            ),
            (
                "What is one technical skill you are currently improving?",
                ["self improvement", "learning", "technical skills"]
            ),
            (
                "Do you have any questions for the interviewer?",
                ["questions", "company", "role", "growth"]
            ),
        ]
    }
}


# ============================================================
# ROLE MATCHING FOR LOCAL QUESTIONS
# ============================================================

def _find_question_category(job_title):
    title = (job_title or "").lower()

    if "full stack" in title:
        return "Full Stack Developer"

    if "python" in title:
        return "Python Developer"

    if "java" in title:
        return "Java Backend Developer"

    if "frontend" in title or "front end" in title:
        return "Frontend Developer"

    if "machine learning" in title:
        return "Machine Learning Engineer"

    if "cloud" in title:
        return "Cloud Engineer"

    if "ai engineer" in title or title.startswith("ai"):
        return "AI Engineer"

    if "data analyst" in title:
        return "Data Analyst"

    return "Software Engineer"


# ============================================================
# LOCAL QUESTION GENERATOR
# ============================================================

def generate_local_questions(
    job_title,
    required_skills,
    interview_type,
    difficulty,
    total_questions,
):
    questions = []

    category = _find_question_category(job_title)

    technical_questions = LOCAL_QUESTION_BANK[
        "Technical"
    ].get(
        category,
        LOCAL_QUESTION_BANK["Technical"]["Software Engineer"]
    )

    hr_questions = LOCAL_QUESTION_BANK["HR"]["default"]

    if interview_type == "Technical":
        pool = technical_questions

    elif interview_type == "HR":
        pool = hr_questions

    else:
        pool = []

        # Alternate technical and HR questions.
        max_length = max(
            len(technical_questions),
            len(hr_questions)
        )

        for index in range(max_length):
            if index < len(technical_questions):
                pool.append(
                    technical_questions[index]
                )

            if index < len(hr_questions):
                pool.append(
                    hr_questions[index]
                )

    # Difficulty-specific ordering.
    # We keep the question bank role-specific while
    # adjusting the wording slightly for difficulty.
    selected = []

    for question in pool:
        selected.append(question)

        if len(selected) >= total_questions:
            break

    # If more questions are requested than the bank contains,
    # cycle through the available questions while adding
    # a role-specific variation marker.
    if len(selected) < total_questions:
        index = 0

        while len(selected) < total_questions:
            selected.append(
                pool[index % len(pool)]
            )
            index += 1

    generated = []

    for index, item in enumerate(
        selected[:total_questions],
        start=1
    ):
        question_text = item[0]
        topics = item[1]

        if difficulty == "Hard":
            question_text = (
                question_text
                + " Explain your reasoning and discuss "
                "how you would handle this in a real-world scenario."
            )

        elif difficulty == "Easy":
            question_text = (
                question_text
            )

        generated.append({
            "question_number": index,
            "question_text": question_text,
            "question_type": (
                "HR"
                if interview_type == "HR"
                else (
                    "Technical"
                    if interview_type == "Technical"
                    else (
                        "HR"
                        if any(
                            keyword in question_text.lower()
                            for keyword in [
                                "tell me",
                                "why",
                                "where do you see",
                                "how do you handle",
                                "mistake",
                                "disagreement",
                                "questions for"
                            ]
                        )
                        else "Technical"
                    )
                )
            ),
            "expected_topics": topics,
        })

    return generated


# ============================================================
# GENERATE QUESTIONS
# ============================================================

def generate_interview_questions(
    job_title,
    company,
    job_description,
    required_skills,
    user_skills,
    interview_type,
    difficulty,
    total_questions,
):
    prompt = build_interview_prompt(
        job_title=job_title,
        company=company,
        job_description=job_description,
        required_skills=required_skills,
        user_skills=user_skills,
        interview_type=interview_type,
        difficulty=difficulty,
        total_questions=total_questions,
    )

    # --------------------------------------------------------
    # Try Gemini
    # --------------------------------------------------------

    if GEMINI_API_KEY:
        try:
            client = get_gemini_client()

            return _generate_questions_with_model(
                client=client,
                model_name=GEMINI_MODEL,
                prompt=prompt,
            )

        except Exception as primary_error:
            print(
                "HireLens Interview AI: "
                f"primary model failed: {primary_error}"
            )

            if GEMINI_FALLBACK_MODEL != GEMINI_MODEL:
                try:
                    print(
                        "HireLens Interview AI: "
                        f"trying fallback model "
                        f"{GEMINI_FALLBACK_MODEL}"
                    )

                    return _generate_questions_with_model(
                        client=client,
                        model_name=GEMINI_FALLBACK_MODEL,
                        prompt=prompt,
                    )

                except Exception as fallback_error:
                    print(
                        "HireLens Interview AI: "
                        f"fallback model failed: "
                        f"{fallback_error}"
                    )

    # --------------------------------------------------------
    # Local fallback
    # --------------------------------------------------------

    print(
        "HireLens Interview AI: "
        "using local interview question fallback."
    )

    local_questions = generate_local_questions(
        job_title=job_title,
        required_skills=required_skills,
        interview_type=interview_type,
        difficulty=difficulty,
        total_questions=total_questions,
    )

    return InterviewQuestionSet(
        questions=[
            InterviewQuestion(**question)
            for question in local_questions
        ]
    )


# ============================================================
# ANSWER EVALUATION PROMPT
# ============================================================

def build_answer_evaluation_prompt(
    question,
    question_type,
    expected_topics,
    user_answer,
    job_title,
    difficulty,
):
    expected_topics_text = (
        ", ".join(expected_topics)
        if expected_topics
        else "No specific expected topics provided"
    )

    return f"""
You are HireLens Interview AI evaluating a candidate's answer.

TARGET ROLE
-----------
{job_title}

DIFFICULTY
----------
{difficulty}

QUESTION TYPE
-------------
{question_type}

QUESTION
--------
{question}

EXPECTED TOPICS
---------------
{expected_topics_text}

CANDIDATE ANSWER
----------------
{user_answer}

Evaluate the answer from 0 to 100.

Consider:
- Correctness
- Relevance
- Technical understanding
- Depth
- Practical understanding
- Clarity
- Communication

Provide:
1. score
2. concise feedback
3. strengths
4. improvements
5. ideal answer points

Do not invent experience.

Return only structured JSON.
"""


# ============================================================
# GEMINI ANSWER EVALUATION
# ============================================================

def _evaluate_answer_with_model(
    client,
    model_name,
    prompt,
):
    print(
        "HireLens Interview AI: "
        f"evaluating answer with {model_name}"
    )

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AnswerEvaluation,
            temperature=0.2,
        ),
    )

    if not response.parsed:
        raise RuntimeError(
            "Gemini returned an empty answer evaluation."
        )

    return response.parsed


# ============================================================
# LOCAL ANSWER EVALUATION
# ============================================================

def evaluate_answer_locally(
    question,
    expected_topics,
    user_answer,
):
    answer = (user_answer or "").strip()

    if not answer:
        return AnswerEvaluation(
            score=0,
            feedback="No answer was provided.",
            strengths=[],
            improvements=[
                "Provide a complete answer to the question."
            ],
            ideal_points=expected_topics,
        )

    answer_lower = answer.lower()

    matched_topics = []

    for topic in expected_topics:
        topic_lower = topic.lower()

        if topic_lower in answer_lower:
            matched_topics.append(topic)

    topic_count = len(expected_topics)

    if topic_count > 0:
        topic_score = (
            len(matched_topics)
            / topic_count
        ) * 70
    else:
        topic_score = 40

    length_score = min(
        20,
        max(
            5,
            len(answer.split()) / 10
        )
    )

    clarity_score = 10

    score = min(
        100,
        round(
            topic_score
            + length_score
            + clarity_score
        )
    )

    strengths = []

    if len(answer.split()) >= 30:
        strengths.append(
            "You provided a reasonably detailed answer."
        )

    if matched_topics:
        strengths.append(
            "You addressed relevant concepts: "
            + ", ".join(matched_topics[:4])
        )

    if not strengths:
        strengths.append(
            "You attempted to address the interview question."
        )

    improvements = []

    missing_topics = [
        topic
        for topic in expected_topics
        if topic not in matched_topics
    ]

    if missing_topics:
        improvements.append(
            "Consider covering: "
            + ", ".join(missing_topics[:4])
        )

    if len(answer.split()) < 30:
        improvements.append(
            "Add more explanation and a practical example."
        )

    if not improvements:
        improvements.append(
            "Add concrete examples or real-world context "
            "to make the answer stronger."
        )

    feedback = (
        f"Your answer received a preliminary score of "
        f"{score}/100 based on relevance, topic coverage "
        f"and explanation depth. "
    )

    if matched_topics:
        feedback += (
            "You covered some important concepts, but "
            "there is room to make the explanation more complete."
        )
    else:
        feedback += (
            "Try connecting your answer more directly "
            "to the concepts expected for this question."
        )

    return AnswerEvaluation(
        score=score,
        feedback=feedback,
        strengths=strengths,
        improvements=improvements,
        ideal_points=expected_topics,
    )


# ============================================================
# MAIN ANSWER EVALUATION
# ============================================================

def evaluate_interview_answer(
    question,
    question_type,
    expected_topics,
    user_answer,
    job_title,
    difficulty,
):
    prompt = build_answer_evaluation_prompt(
        question=question,
        question_type=question_type,
        expected_topics=expected_topics,
        user_answer=user_answer,
        job_title=job_title,
        difficulty=difficulty,
    )

    # --------------------------------------------------------
    # Try Gemini
    # --------------------------------------------------------

    if GEMINI_API_KEY:
        try:
            client = get_gemini_client()

            return _evaluate_answer_with_model(
                client=client,
                model_name=GEMINI_MODEL,
                prompt=prompt,
            )

        except Exception as primary_error:
            print(
                "HireLens Interview AI: "
                f"primary evaluation failed: "
                f"{primary_error}"
            )

            if GEMINI_FALLBACK_MODEL != GEMINI_MODEL:
                try:
                    print(
                        "HireLens Interview AI: "
                        f"trying fallback evaluation model "
                        f"{GEMINI_FALLBACK_MODEL}"
                    )

                    return _evaluate_answer_with_model(
                        client=client,
                        model_name=GEMINI_FALLBACK_MODEL,
                        prompt=prompt,
                    )

                except Exception as fallback_error:
                    print(
                        "HireLens Interview AI: "
                        f"fallback evaluation failed: "
                        f"{fallback_error}"
                    )

    # --------------------------------------------------------
    # Local evaluation fallback
    # --------------------------------------------------------

    print(
        "HireLens Interview AI: "
        "using local answer evaluation fallback."
    )

    return evaluate_answer_locally(
        question=question,
        expected_topics=expected_topics,
        user_answer=user_answer,
    )


# ============================================================
# ROUTE-COMPATIBLE QUESTION WRAPPER
# ============================================================

def try_generate_interview_questions(
    job_title,
    company,
    job_description,
    required_skills,
    user_skills,
    interview_type,
    difficulty,
    total_questions,
):
    try:
        result = generate_interview_questions(
            job_title=job_title,
            company=company,
            job_description=job_description,
            required_skills=required_skills,
            user_skills=user_skills,
            interview_type=interview_type,
            difficulty=difficulty,
            total_questions=total_questions,
        )

        questions = [
            question.model_dump()
            for question in result.questions
        ]

        return {
            "success": True,
            "data": {
                "questions": questions
            },
            "message": (
                "AI interview questions generated successfully."
            ),
        }

    except Exception as error:
        print(
            "Interview question generation error:",
            error
        )

        return {
            "success": False,
            "data": {},
            "error": (
                "Unable to generate interview questions."
            ),
            "message": (
                "Unable to generate interview questions."
            ),
        }


# ============================================================
# ROUTE-COMPATIBLE ANSWER WRAPPER
# ============================================================

def try_evaluate_interview_answer(
    question,
    question_type,
    expected_topics,
    user_answer,
    job_title,
    difficulty,
):
    try:
        result = evaluate_interview_answer(
            question=question,
            question_type=question_type,
            expected_topics=expected_topics,
            user_answer=user_answer,
            job_title=job_title,
            difficulty=difficulty,
        )

        evaluation = result.model_dump()

        evaluation["ideal_answer_points"] = (
            evaluation.get(
                "ideal_points",
                []
            )
        )

        return {
            "success": True,
            "data": evaluation,
            "message": (
                "Answer evaluated successfully."
            ),
        }

    except Exception as error:
        print(
            "Interview answer evaluation error:",
            error
        )

        return {
            "success": False,
            "data": {},
            "error": (
                "Unable to evaluate interview answer."
            ),
            "message": (
                "Unable to evaluate interview answer."
            ),
        }