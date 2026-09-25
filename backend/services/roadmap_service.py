ROADMAP_TEMPLATES = {
    "Machine Learning": [
        "Python for Machine Learning",
        "NumPy and Pandas",
        "Statistics Fundamentals",
        "Machine Learning Fundamentals",
        "Regression and Classification",
        "Model Evaluation",
        "Build a Machine Learning Project"
    ],

    "NLP": [
        "Python Text Processing",
        "Natural Language Processing Fundamentals",
        "Text Preprocessing",
        "Feature Extraction",
        "Text Classification",
        "Sentiment Analysis",
        "Build an NLP Project"
    ],

    "React": [
        "JavaScript Fundamentals",
        "React Fundamentals",
        "Components and Props",
        "State and Hooks",
        "React Router",
        "API Integration",
        "Build a React Project"
    ],

    "Docker": [
        "Docker Fundamentals",
        "Images and Containers",
        "Dockerfiles",
        "Docker Compose",
        "Container Networking",
        "Deploy Applications with Docker",
        "Containerize a Full-Stack Project"
    ],

    "AWS": [
        "Cloud Computing Fundamentals",
        "AWS Core Services",
        "IAM and Security",
        "EC2",
        "S3",
        "RDS",
        "Deploy an Application on AWS"
    ],

    "Spring Boot": [
        "Java Backend Fundamentals",
        "Spring Framework Basics",
        "Spring Boot Fundamentals",
        "REST APIs with Spring Boot",
        "Spring Data JPA",
        "Spring Security",
        "Build a Spring Boot Project"
    ]
}


def generate_learning_roadmap(missing_skills):
    roadmap = []

    for skill in missing_skills:

        steps = ROADMAP_TEMPLATES.get(
            skill,
            [
                f"{skill} Fundamentals",
                f"Learn Core {skill} Concepts",
                f"Practice {skill} with Small Problems",
                f"Build a {skill} Mini Project",
                f"Build a Real-World {skill} Project"
            ]
        )

        roadmap.append({
            "skill": skill,
            "steps": [
                {
                    "step_number": index + 1,
                    "title": step
                }
                for index, step in enumerate(steps)
            ]
        })

    return roadmap