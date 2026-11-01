from getpass import getpass

from app import app
from extensions import db
from models import Admin, Aspect, Category, Section, Student, Teacher, Trimester

# SAMPLE lang ang aspects ng 5 pang categories, palitan mo ng actual sa design mo
CATEGORIES = [
    ("Teaching Effectiveness", "Evaluate the teacher's knowledge, clarity, and teaching strategies.", [
        ("Clarity of Instruction", "Explains lessons clearly and makes the content easy to understand."),
        ("Subject Knowledge", "Shows strong understanding of the subject matter."),
        ("Teaching Strategies", "Uses effective and varied teaching methods to support learning."),
        ("Classroom Delivery", "Maintains a positive and engaging learning environment."),
    ]),
    ("Communication", "Evaluate the teacher's communication skills and interaction with students.", [
        ("Clarity of Speech", "Speaks clearly and is easy to understand."),
        ("Listening Skills", "Listens attentively to students' questions and concerns."),
        ("Responsiveness", "Responds to questions and concerns promptly."),
        ("Respectful Interaction", "Communicates respectfully with all students."),
    ]),
    ("Classroom Management", "Evaluate the teacher's ability to maintain a positive and organized learning environment.", [
        ("Discipline", "Maintains order and discipline in the classroom."),
        ("Time Management", "Uses class time efficiently."),
        ("Organization", "Keeps lessons and materials well organized."),
        ("Fairness", "Treats all students fairly and consistently."),
    ]),
    ("Professionalism", "Evaluate the teacher's attitude, responsibility, and adherence to school policies.", [
        ("Punctuality", "Starts and ends classes on time."),
        ("Attitude", "Shows a positive and professional attitude."),
        ("Responsibility", "Fulfills teaching duties and responsibilities."),
        ("Policy Compliance", "Follows school rules and policies."),
    ]),
    ("Student Engagement", "Evaluate the teacher's ability to motivate and involve students in the learning process.", [
        ("Motivation", "Inspires students to learn."),
        ("Participation", "Encourages students to participate in class."),
        ("Learning Activities", "Uses activities that keep students involved."),
        ("Interest in Progress", "Shows genuine concern for students' progress."),
    ]),
    ("Assessment & Feedback", "Evaluate the teacher's methods in assessing student performance and providing constructive feedback.", [
        ("Fair Assessments", "Gives fair and relevant assessments."),
        ("Timely Feedback", "Returns results and feedback on time."),
        ("Clear Criteria", "Explains grading criteria clearly."),
        ("Constructive Feedback", "Gives feedback that helps students improve."),
    ]),
]


def seed():
    with app.app_context():
        if Category.query.first():
            print("Already seeded. Wala nang binago.")
            return

        for name, desc, aspects in CATEGORIES:
            cat = Category(category_name=name, description=desc)
            db.session.add(cat)
            db.session.flush()
            for a_name, a_desc in aspects:
                db.session.add(Aspect(category_id=cat.category_id, aspect_name=a_name, description=a_desc))

        # TEST DATA lang ito, palitan/dagdagan ng totoong sections at students
        s1 = Section(section_name="BSIT 3-1")
        s2 = Section(section_name="BSIT 3-2")
        db.session.add_all([s1, s2])
        db.session.flush()
        db.session.add_all([
            Student(student_id="S-2025-123456", section_id=s1.section_id),
            Student(student_id="S-2025-654321", section_id=s2.section_id),
        ])

        db.session.add_all([
            Teacher(first_name="Maria", last_name="Santos"),
            Teacher(first_name="Juan", last_name="Dela Cruz"),
            Teacher(first_name="Ana", last_name="Reyes"),
        ])

        db.session.add(Trimester(school_year="2025-2026", trimester_name="1st Trimester", is_current=True))

        username = input("Admin username (Enter para laktawan ang admin): ").strip()
        if username:
            password = getpass("Admin password: ")
            admin = Admin(username=username, first_name="System", last_name="Admin")
            admin.set_password(password)
            db.session.add(admin)

        db.session.commit()
        print("Seed done.")


if __name__ == "__main__":
    seed()