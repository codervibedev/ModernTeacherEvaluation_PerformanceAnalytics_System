import re

from flask import Blueprint, jsonify, request, session
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import Aspect, Category, Evaluation, Rating, Section, Student, Teacher, Trimester

student_bp = Blueprint("student", __name__, url_prefix="/api")


def current_trimester():
    return Trimester.query.filter_by(is_current=True).first()


def get_verified_student():
    """Student na nag-verify na (naka-save sa server-side session cookie)."""
    student_id = session.get("student_id")
    if not student_id:
        return None
    return db.session.get(Student, student_id)


def normalize_section(value):
    """Binabalewala ang laki ng letra, espasyo, at gitling: 'bsit 3-1' = 'BSIT3-1'."""
    return re.sub(r"[^a-z0-9]", "", str(value).lower())


@student_bp.get("/sections")
def list_sections():
    sections = Section.query.order_by(Section.section_name).all()
    return jsonify([
        {"section_id": s.section_id, "section_name": s.section_name} for s in sections
    ])


@student_bp.post("/student/verify")
def verify_student():
    data = request.get_json(silent=True) or {}
    student_id = str(data.get("student_id", "")).strip()
    section_name = str(data.get("section", "")).strip()

    if not student_id or not section_name:
        return jsonify(error="Student ID and Section are required."), 400

    student = db.session.get(Student, student_id)
    if (
        not student
        or normalize_section(student.section.section_name) != normalize_section(section_name)
    ):
        # Isang generic na message lang, para hindi ma-guess kung alin ang mali
        return jsonify(error="Student ID and Section do not match our records."), 404

    session["student_id"] = student.student_id
    return jsonify(student_id=student.student_id, section=student.section.section_name)


@student_bp.post("/student/logout")
def student_logout():
    session.pop("student_id", None)
    return jsonify(ok=True)


@student_bp.get("/student/teachers")
def list_teachers():
    student = get_verified_student()
    if not student:
        return jsonify(error="Please verify your Student ID first."), 401

    trimester = current_trimester()
    if not trimester:
        return jsonify(error="No active evaluation period."), 409

    done = {
        e.teacher_id
        for e in Evaluation.query.filter_by(
            student_id=student.student_id, trimester_id=trimester.trimester_id
        )
    }
    teachers = Teacher.query.filter_by(is_active=True).order_by(Teacher.last_name).all()
    return jsonify([
        {
            "teacher_id": t.teacher_id,
            "name": f"{t.first_name} {t.last_name}",
            "already_evaluated": t.teacher_id in done,
        }
        for t in teachers
    ])


@student_bp.get("/categories")
def list_categories():
    categories = Category.query.order_by(Category.category_id).all()
    return jsonify([
        {
            "category_id": c.category_id,
            "category_name": c.category_name,
            "description": c.description,
            "aspects": [
                {
                    "aspect_id": a.aspect_id,
                    "aspect_name": a.aspect_name,
                    "description": a.description,
                }
                for a in sorted(c.aspects, key=lambda a: a.aspect_id)
            ],
        }
        for c in categories
    ])


@student_bp.post("/student/evaluations")
def submit_evaluation():
    student = get_verified_student()
    if not student:
        return jsonify(error="Please verify your Student ID first."), 401

    trimester = current_trimester()
    if not trimester:
        return jsonify(error="No active evaluation period."), 409

    data = request.get_json(silent=True) or {}

    try:
        teacher_id = int(data.get("teacher_id"))
    except (TypeError, ValueError):
        return jsonify(error="Invalid teacher."), 400

    teacher = db.session.get(Teacher, teacher_id)
    if not teacher or not teacher.is_active:
        return jsonify(error="Teacher not found."), 404

    ratings = data.get("ratings")
    if not isinstance(ratings, list):
        return jsonify(error="Ratings are required."), 400

    submitted = {}
    for r in ratings:
        try:
            aspect_id = int(r["aspect_id"])
            value = int(r["rating_value"])
        except (KeyError, TypeError, ValueError):
            return jsonify(error="Invalid rating data."), 400
        if value < 1 or value > 5:
            return jsonify(error="Ratings must be from 1 to 5."), 400
        submitted[aspect_id] = value

    all_aspect_ids = {a.aspect_id for a in Aspect.query.all()}
    if set(submitted) != all_aspect_ids:
        return jsonify(error="Please rate all aspects in all categories."), 400

    already = Evaluation.query.filter_by(
        student_id=student.student_id,
        teacher_id=teacher_id,
        trimester_id=trimester.trimester_id,
    ).first()
    if already:
        return jsonify(error="You have already evaluated this teacher."), 409

    try:
        evaluation = Evaluation(
            student_id=student.student_id,
            teacher_id=teacher_id,
            trimester_id=trimester.trimester_id,
        )
        db.session.add(evaluation)
        db.session.flush()
        for aspect_id, value in submitted.items():
            db.session.add(
                Rating(
                    evaluation_id=evaluation.evaluation_id,
                    aspect_id=aspect_id,
                    rating_value=value,
                )
            )
        db.session.commit()
    except IntegrityError:
        # Backup ng database rule kung sakaling magkasabay ang dalawang submit
        db.session.rollback()
        return jsonify(error="You have already evaluated this teacher."), 409

    return jsonify(ok=True, evaluation_id=evaluation.evaluation_id), 201