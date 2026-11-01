from datetime import datetime

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


class Section(db.Model):
    __tablename__ = "sections"

    section_id = db.Column(db.Integer, primary_key=True)
    section_name = db.Column(db.String(50), unique=True, nullable=False)

    students = db.relationship("Student", backref="section", lazy=True)


class Student(db.Model):
    """Master list ng students. Dito vine-verify ang Student ID + Section."""
    __tablename__ = "students"

    student_id = db.Column(db.String(20), primary_key=True)
    section_id = db.Column(db.Integer, db.ForeignKey("sections.section_id"), nullable=False)

    evaluations = db.relationship("Evaluation", backref="student", lazy=True)


class Teacher(db.Model):
    __tablename__ = "teachers"

    teacher_id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    middle_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    evaluations = db.relationship("Evaluation", backref="teacher", lazy=True)


class Category(db.Model):
    __tablename__ = "categories"

    category_id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.String(255))

    aspects = db.relationship("Aspect", backref="category", lazy=True)


class Aspect(db.Model):
    __tablename__ = "aspects"

    aspect_id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.category_id"), nullable=False)
    aspect_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))

    ratings = db.relationship("Rating", backref="aspect", lazy=True)


class Trimester(db.Model):
    __tablename__ = "trimesters"

    trimester_id = db.Column(db.Integer, primary_key=True)
    school_year = db.Column(db.String(20), nullable=False)      # e.g. 2025-2026
    trimester_name = db.Column(db.String(30), nullable=False)   # e.g. 1st Trimester
    is_current = db.Column(db.Boolean, nullable=False, default=False)

    evaluations = db.relationship("Evaluation", backref="trimester", lazy=True)

    __table_args__ = (
        db.UniqueConstraint("school_year", "trimester_name", name="uq_trimester"),
    )


class Evaluation(db.Model):
    __tablename__ = "evaluations"

    evaluation_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(20), db.ForeignKey("students.student_id"), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.teacher_id"), nullable=False)
    trimester_id = db.Column(db.Integer, db.ForeignKey("trimesters.trimester_id"), nullable=False)
    date_submitted = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    ratings = db.relationship(
        "Rating", backref="evaluation", cascade="all, delete-orphan", lazy=True
    )

    # Isang evaluation lang kada student kada teacher kada trimester
    __table_args__ = (
        db.UniqueConstraint(
            "student_id", "teacher_id", "trimester_id",
            name="uq_one_evaluation_per_student_teacher_trimester",
        ),
    )


class Rating(db.Model):
    __tablename__ = "ratings"

    rating_id = db.Column(db.Integer, primary_key=True)
    evaluation_id = db.Column(
        db.Integer, db.ForeignKey("evaluations.evaluation_id"), nullable=False
    )
    aspect_id = db.Column(db.Integer, db.ForeignKey("aspects.aspect_id"), nullable=False)
    rating_value = db.Column(db.SmallInteger, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("evaluation_id", "aspect_id", name="uq_one_rating_per_aspect"),
        db.CheckConstraint("rating_value BETWEEN 1 AND 5", name="ck_rating_1_to_5"),
    )


class Admin(UserMixin, db.Model):
    __tablename__ = "admins"

    admin_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True)
    first_name = db.Column(db.String(50), nullable=False)
    middle_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def get_id(self):
        return str(self.admin_id)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)