import re
import time

from flask import Blueprint, jsonify, request, session
from flask_login import current_user, login_required, login_user, logout_user
from sqlalchemy import func, or_
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models import Admin, Evaluation, Teacher, Trimester

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

MAX_ATTEMPTS = 5
LOCK_SECONDS = 300
_failed = {}  # key -> (bilang ng maling subok, oras kung kailan unlocked)

# Para pareho ang tagal ng sagot kahit wala ang username (iwas user-guessing)
_DUMMY_HASH = generate_password_hash("not-a-real-password")


def _key(username):
    return f"{request.remote_addr}|{username.lower()}"


def _is_locked(key):
    count, locked_until = _failed.get(key, (0, 0))
    if locked_until and time.time() < locked_until:
        return True
    if locked_until:
        _failed.pop(key, None)
    return False


def _register_failure(key):
    count, _ = _failed.get(key, (0, 0))
    count += 1
    if count >= MAX_ATTEMPTS:
        _failed[key] = (0, time.time() + LOCK_SECONDS)
    else:
        _failed[key] = (count, 0)


def admin_payload(admin):
    return {
        "admin_id": admin.admin_id,
        "username": admin.username,
        "name": f"{admin.first_name} {admin.last_name}".strip(),
    }


@admin_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    if not username or not password:
        return jsonify(error="Username and password are required."), 400

    key = _key(username)
    if _is_locked(key):
        return jsonify(error="Too many failed attempts. Please try again in a few minutes."), 429

    admin = Admin.query.filter(
        or_(Admin.username == username, Admin.email == username)
    ).first()

    if admin is None:
        check_password_hash(_DUMMY_HASH, password)
    if admin is None or not admin.check_password(password):
        _register_failure(key)
        # Isang generic na message lang, para hindi ma-guess kung alin ang mali
        return jsonify(error="Invalid username or password."), 401

    _failed.pop(key, None)
    session.pop("student_id", None)  # hindi dapat magkahalo ang student at admin session
    session.permanent = True
    login_user(admin)
    return jsonify(admin_payload(admin))


@admin_bp.post("/logout")
def logout():
    logout_user()
    session.clear()
    return jsonify(ok=True)


@admin_bp.get("/me")
@login_required
def me():
    return jsonify(admin_payload(current_user))


# ---------------------------------------------------------------- Teachers

def teacher_payload(t, evaluation_count=0):
    return {
        "teacher_id": t.teacher_id,
        "first_name": t.first_name,
        "middle_name": t.middle_name or "",
        "last_name": t.last_name,
        "is_active": bool(t.is_active),
        "evaluation_count": evaluation_count,
    }


def parse_teacher_form(data):
    first = str(data.get("first_name", "")).strip()
    middle = str(data.get("middle_name", "")).strip()
    last = str(data.get("last_name", "")).strip()

    if not first or not last:
        return None, "First name and last name are required."
    if len(first) > 50 or len(middle) > 50 or len(last) > 50:
        return None, "One or more fields are too long."

    return {
        "first_name": first,
        "middle_name": middle or None,
        "last_name": last,
    }, None


def duplicate_exists(fields, exclude_id=None):
    q = Teacher.query.filter(
        func.lower(Teacher.first_name) == fields["first_name"].lower(),
        func.lower(Teacher.last_name) == fields["last_name"].lower(),
        func.lower(func.coalesce(Teacher.middle_name, "")) == (fields["middle_name"] or "").lower(),
    )
    if exclude_id:
        q = q.filter(Teacher.teacher_id != exclude_id)
    return db.session.query(q.exists()).scalar()


@admin_bp.get("/teachers")
@login_required
def list_teachers():
    teachers = Teacher.query.order_by(Teacher.last_name, Teacher.first_name).all()
    counts = dict(
        db.session.query(Evaluation.teacher_id, func.count(Evaluation.evaluation_id))
        .group_by(Evaluation.teacher_id)
        .all()
    )
    return jsonify([teacher_payload(t, counts.get(t.teacher_id, 0)) for t in teachers])


@admin_bp.post("/teachers")
@login_required
def create_teacher():
    fields, error = parse_teacher_form(request.get_json(silent=True) or {})
    if error:
        return jsonify(error=error), 400
    if duplicate_exists(fields):
        return jsonify(error="A teacher with the same name already exists."), 409

    teacher = Teacher(**fields, is_active=True)
    db.session.add(teacher)
    db.session.commit()
    return jsonify(teacher_payload(teacher)), 201


@admin_bp.put("/teachers/<int:teacher_id>")
@login_required
def update_teacher(teacher_id):
    teacher = db.session.get(Teacher, teacher_id)
    if not teacher:
        return jsonify(error="Teacher not found."), 404

    fields, error = parse_teacher_form(request.get_json(silent=True) or {})
    if error:
        return jsonify(error=error), 400
    if duplicate_exists(fields, exclude_id=teacher_id):
        return jsonify(error="A teacher with the same name already exists."), 409

    for key, value in fields.items():
        setattr(teacher, key, value)
    db.session.commit()
    count = Evaluation.query.filter_by(teacher_id=teacher_id).count()
    return jsonify(teacher_payload(teacher, count))


@admin_bp.patch("/teachers/<int:teacher_id>/status")
@login_required
def set_teacher_status(teacher_id):
    teacher = db.session.get(Teacher, teacher_id)
    if not teacher:
        return jsonify(error="Teacher not found."), 404

    active = (request.get_json(silent=True) or {}).get("is_active")
    if not isinstance(active, bool):
        return jsonify(error="is_active must be true or false."), 400

    teacher.is_active = active
    db.session.commit()
    count = Evaluation.query.filter_by(teacher_id=teacher_id).count()
    return jsonify(teacher_payload(teacher, count))


@admin_bp.delete("/teachers/<int:teacher_id>")
@login_required
def delete_teacher(teacher_id):
    teacher = db.session.get(Teacher, teacher_id)
    if not teacher:
        return jsonify(error="Teacher not found."), 404

    if Evaluation.query.filter_by(teacher_id=teacher_id).count() > 0:
        return jsonify(
            error="This teacher already has evaluations. Deactivate the teacher instead to keep the records."
        ), 409

    db.session.delete(teacher)
    db.session.commit()
    return jsonify(ok=True)

# ---------------------------------------------------------------- Account

USERNAME_RE = re.compile(r"^[A-Za-z0-9._-]{3,50}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def account_payload(admin):
    return {
        "first_name": admin.first_name,
        "middle_name": admin.middle_name or "",
        "last_name": admin.last_name,
        "username": admin.username,
        "email": admin.email or "",
    }


def password_problem(password):
    if len(password) < 8:
        return "Password must be at least 8 characters."
    if len(password) > 128:
        return "Password is too long."
    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        return "Password must contain both letters and numbers."
    return None


@admin_bp.get("/account")
@login_required
def get_account():
    return jsonify(account_payload(current_user))


@admin_bp.put("/account")
@login_required
def update_account():
    data = request.get_json(silent=True) or {}
    first = str(data.get("first_name", "")).strip()
    middle = str(data.get("middle_name", "")).strip()
    last = str(data.get("last_name", "")).strip()
    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip()
    current_password = str(data.get("current_password", ""))

    if not first or not last:
        return jsonify(error="First name and last name are required."), 400
    if len(first) > 50 or len(middle) > 50 or len(last) > 50:
        return jsonify(error="One or more names are too long."), 400
    if not USERNAME_RE.match(username):
        return jsonify(
            error="Username must be 3-50 characters: letters, numbers, dot, underscore, or hyphen."
        ), 400
    if email and (len(email) > 120 or not EMAIL_RE.match(email)):
        return jsonify(error="Please enter a valid email address."), 400

    admin = current_user._get_current_object()

    # Ang pagpalit ng username o email ay kailangan ng kasalukuyang password
    if username != admin.username or (email or None) != (admin.email or None):
        key = f"pw|{admin.admin_id}"
        if _is_locked(key):
            return jsonify(error="Too many failed attempts. Please try again in a few minutes."), 429
        if not admin.check_password(current_password):
            _register_failure(key)
            return jsonify(error="Current password is incorrect."), 400
        _failed.pop(key, None)

    if Admin.query.filter(
        func.lower(Admin.username) == username.lower(), Admin.admin_id != admin.admin_id
    ).first():
        return jsonify(error="That username is already taken."), 409
    if email and Admin.query.filter(
        func.lower(Admin.email) == email.lower(), Admin.admin_id != admin.admin_id
    ).first():
        return jsonify(error="That email is already in use."), 409

    admin.first_name = first
    admin.middle_name = middle or None
    admin.last_name = last
    admin.username = username
    admin.email = email or None
    db.session.commit()
    return jsonify({**admin_payload(admin), **account_payload(admin)})


@admin_bp.post("/account/password")
@login_required
def change_password():
    data = request.get_json(silent=True) or {}
    current = str(data.get("current_password", ""))
    new = str(data.get("new_password", ""))
    confirm = str(data.get("confirm_password", ""))

    if not current or not new or not confirm:
        return jsonify(error="Please fill in all password fields."), 400
    if new != confirm:
        return jsonify(error="New password and confirmation do not match."), 400
    problem = password_problem(new)
    if problem:
        return jsonify(error=problem), 400

    admin = current_user._get_current_object()
    key = f"pw|{admin.admin_id}"
    if _is_locked(key):
        return jsonify(error="Too many failed attempts. Please try again in a few minutes."), 429
    if not admin.check_password(current):
        _register_failure(key)
        return jsonify(error="Current password is incorrect."), 400
    _failed.pop(key, None)

    if admin.check_password(new):
        return jsonify(error="New password must be different from the current password."), 400

    admin.set_password(new)
    db.session.commit()
    return jsonify(ok=True)


# ------------------------------------------------------- Evaluation periods

SCHOOL_YEAR_RE = re.compile(r"^(\d{4})-(\d{4})$")
TRIMESTER_NAMES = ("1st Trimester", "2nd Trimester", "3rd Trimester")


def period_payload(t, evaluation_count=0):
    return {
        "trimester_id": t.trimester_id,
        "school_year": t.school_year,
        "trimester_name": t.trimester_name,
        "is_current": bool(t.is_current),
        "evaluation_count": evaluation_count,
    }


@admin_bp.get("/periods")
@login_required
def list_periods():
    counts = dict(
        db.session.query(Evaluation.trimester_id, func.count(Evaluation.evaluation_id))
        .group_by(Evaluation.trimester_id)
        .all()
    )
    periods = Trimester.query.order_by(
        Trimester.school_year.desc(), Trimester.trimester_name.desc()
    ).all()
    return jsonify([period_payload(t, counts.get(t.trimester_id, 0)) for t in periods])


@admin_bp.post("/periods")
@login_required
def create_period():
    data = request.get_json(silent=True) or {}
    year = str(data.get("school_year", "")).strip()
    name = str(data.get("trimester_name", "")).strip()

    match = SCHOOL_YEAR_RE.match(year)
    if not match or int(match.group(2)) != int(match.group(1)) + 1:
        return jsonify(error="School year must look like 2025-2026."), 400
    if name not in TRIMESTER_NAMES:
        return jsonify(error="Please choose a valid trimester."), 400
    if Trimester.query.filter_by(school_year=year, trimester_name=name).first():
        return jsonify(error="That trimester already exists."), 409

    period = Trimester(school_year=year, trimester_name=name, is_current=False)
    db.session.add(period)
    db.session.commit()
    return jsonify(period_payload(period)), 201


@admin_bp.post("/periods/<int:trimester_id>/current")
@login_required
def set_current_period(trimester_id):
    period = db.session.get(Trimester, trimester_id)
    if not period:
        return jsonify(error="Trimester not found."), 404

    Trimester.query.update({Trimester.is_current: False})
    period.is_current = True
    db.session.commit()
    count = Evaluation.query.filter_by(trimester_id=trimester_id).count()
    return jsonify(period_payload(period, count))


@admin_bp.delete("/periods/<int:trimester_id>")
@login_required
def delete_period(trimester_id):
    period = db.session.get(Trimester, trimester_id)
    if not period:
        return jsonify(error="Trimester not found."), 404
    if period.is_current:
        return jsonify(error="The current trimester cannot be deleted. Set another one as current first."), 409

    # Binubura rin ang mga evaluation ng trimester na ito (kasama ang kanilang ratings).
    # ORM delete ang gamit (hindi bulk) para tumakbo ang cascade ng Evaluation.ratings.
    try:
        for evaluation in Evaluation.query.filter_by(trimester_id=trimester_id).all():
            db.session.delete(evaluation)
        db.session.flush()  # mauna ang evaluations at ratings bago ang trimester
        db.session.delete(period)
        db.session.commit()
    except Exception:
        db.session.rollback()
        return jsonify(error="Unable to delete the trimester. Nothing was deleted."), 500

    return jsonify(ok=True)