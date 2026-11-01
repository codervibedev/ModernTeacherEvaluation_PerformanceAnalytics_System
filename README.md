# Modern Teacher Evaluation & Performance Analytics System

A web-based platform for teacher evaluation, faculty performance monitoring, and data-driven analysis.

## Overview

The Modern Teacher Evaluation & Performance Analytics System is designed to streamline the teacher evaluation process at ICCT Colleges Foundation, Inc.

The system enables students to evaluate their teachers using structured categories and assessment criteria. Administrators can access evaluation results, monitor faculty performance, compare results across trimesters, and analyze performance trends through a centralized dashboard.

By organizing evaluation data in a relational database, the system supports consistent record management and provides a clearer view of faculty performance.

## Key Features

### Student Evaluation
- Student ID and section verification
- Teacher selection and category-based evaluation
- Individual assessment ratings on a scale of 1 to 5
- Evaluation review before submission
- Prevention of duplicate evaluations for the same teacher and trimester

### Administrative Dashboard
- Overview of faculty evaluation results
- Total evaluation count and average faculty rating
- Identification of top-performing teachers
- Filtering by academic year and trimester

### Performance Analytics
- Faculty performance rankings
- Individual teacher performance profiles
- Category-based performance breakdowns
- Trimester-to-trimester comparisons
- Performance insights and trends

### Teacher Management
- Add, edit, and search teacher records
- Activate or deactivate teachers
- Delete teacher records only when no evaluations are associated with them

### System Settings
- Administrator account management
- Password updates
- Academic trimester management

## Technologies Used

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript |
| Backend | Python, Flask |
| Authentication | Flask-Login |
| ORM | Flask-SQLAlchemy |
| API Communication | Flask-CORS |
| Database | MySQL / MariaDB |
| Database Driver | PyMySQL |
| Password Hashing | Werkzeug |

## Database Management

The system uses a relational database to manage and organize the following information:

- Administrator accounts
- Student records and class sections
- Teacher records
- Evaluation categories and assessment criteria
- Academic years and trimesters
- Evaluation submissions and individual ratings

The database structure supports relationships between records and helps maintain data integrity through foreign key constraints.

## Performance Evaluation Process

1. The student enters their Student ID and section.
2. The system verifies the student's information.
3. The student selects a teacher and an evaluation category.
4. The student rates the teacher based on the specified assessment criteria.
5. The student reviews and submits the evaluation.
6. The administrator accesses the collected results through the dashboard and analytics pages.

## Security

- Administrator authentication and protected administrative pages
- Password hashing to protect stored administrator credentials
- Student verification before evaluation
- Restrictions against duplicate evaluations for the same teacher and trimester

## Organization

**ICCT Colleges Foundation, Inc.**
