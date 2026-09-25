CREATE DATABASE IF NOT EXISTS hirelens_db;

USE hirelens_db;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('candidate', 'admin') DEFAULT 'candidate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    phone VARCHAR(20),
    location VARCHAR(100),
    education TEXT,
    bio TEXT,
    experience_years DECIMAL(4,1) DEFAULT 0,
    target_role VARCHAR(150),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);
CREATE TABLE skills (
    skill_id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE user_skills (
    user_skill_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    skill_id INT NOT NULL,
    proficiency_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Beginner',

    UNIQUE KEY unique_user_skill (user_id, skill_id),

    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
        ON DELETE CASCADE
);
CREATE TABLE jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    location VARCHAR(150),
    job_type ENUM('Full-time', 'Part-time', 'Internship', 'Contract') DEFAULT 'Full-time',
    experience_required VARCHAR(100),
    description TEXT NOT NULL,
    requirements TEXT,
    salary_range VARCHAR(100),
    application_url VARCHAR(500),
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE job_skills (
    job_skill_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    skill_id INT NOT NULL,
    required_level ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert') DEFAULT 'Intermediate',

    UNIQUE KEY unique_job_skill (job_id, skill_id),

    FOREIGN KEY (job_id) REFERENCES jobs(job_id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
        ON DELETE CASCADE
);
CREATE TABLE resumes (
    resume_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    extracted_text LONGTEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);
CREATE TABLE job_matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_id INT NOT NULL,
    match_score DECIMAL(5,2) NOT NULL,
    matched_skills TEXT,
    missing_skills TEXT,
    explanation TEXT,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_job_match (user_id, job_id),

    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    FOREIGN KEY (job_id) REFERENCES jobs(job_id)
        ON DELETE CASCADE
);
CREATE TABLE learning_roadmaps (
    roadmap_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    target_role VARCHAR(150) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Not Started',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);
CREATE TABLE roadmap_steps (
    step_id INT AUTO_INCREMENT PRIMARY KEY,
    roadmap_id INT NOT NULL,
    skill_id INT,
    step_number INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    resource_url VARCHAR(500),
    estimated_hours DECIMAL(5,1),
    status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Not Started',

    FOREIGN KEY (roadmap_id) REFERENCES learning_roadmaps(roadmap_id)
        ON DELETE CASCADE,

    FOREIGN KEY (skill_id) REFERENCES skills(skill_id)
        ON DELETE SET NULL
);