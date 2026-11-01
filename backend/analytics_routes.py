from flask import Blueprint, jsonify, request
from flask_login import login_required
from sqlalchemy import desc, func

from extensions import db
from models import Aspect, Category, Evaluation, Rating, Teacher, Trimester

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/admin")

# 5-point scale ayon sa approved proposal
LEVELS = [
    (5, "Excellent"),
    (4, "Very Good"),
    (3, "Good"),
    (2, "Needs Improvement"),
    (1, "Poor"),
]


def ordered_trimesters():
    return Trimester.query.order_by(Trimester.school_year, Trimester.trimester_name).all()


def trimester_label(t):
    return f"{t.trimester_name} ({t.school_year})"


def short_label(t):
    return f"{t.trimester_name.split()[0]} Trim {t.school_year}"


def r2(value):
    return None if value is None else round(float(value), 2)


def level_for(avg):
    """Parehong scale ng dashboard: 4.5+ Excellent ... mas mababa sa 1.5 ay Poor."""
    if avg is None:
        return None
    for value, label in LEVELS:
        if avg >= value - 0.5:
            return label
    return "Poor"


def pick_trimester():
    trimesters = ordered_trimesters()
    raw = request.args.get("trimester_id")
    if raw is not None:
        try:
            wanted = int(raw)
        except ValueError:
            return None, trimesters
        return next((t for t in trimesters if t.trimester_id == wanted), None), trimesters

    current = next((t for t in trimesters if t.is_current), None)
    if current is None and trimesters:
        current = trimesters[-1]
    return current, trimesters


def average_by_trimester():
    rows = (
        db.session.query(Evaluation.trimester_id, func.avg(Rating.rating_value))
        .select_from(Rating)
        .join(Evaluation, Rating.evaluation_id == Evaluation.evaluation_id)
        .group_by(Evaluation.trimester_id)
        .all()
    )
    return {tid: r2(avg) for tid, avg in rows}


def ranked_teachers(tid):
    """Mga teacher na may evaluations sa trimester, may rank (tabla = pareho ang rank)."""
    avg_expr = func.avg(Rating.rating_value)
    count_expr = func.count(func.distinct(Evaluation.evaluation_id))
    rows = (
        db.session.query(
            Teacher.teacher_id,
            Teacher.first_name,
            Teacher.last_name,
            Teacher.is_active,
            avg_expr,
            count_expr,
        )
        .select_from(Evaluation)
        .join(Rating, Rating.evaluation_id == Evaluation.evaluation_id)
        .join(Teacher, Teacher.teacher_id == Evaluation.teacher_id)
        .filter(Evaluation.trimester_id == tid)
        .group_by(
            Teacher.teacher_id,
            Teacher.first_name,
            Teacher.last_name,
            Teacher.is_active,
        )
        .all()
    )

    rows = sorted(rows, key=lambda r: (-r2(r[4]), -r[5], r[2].lower(), r[1].lower()))

    teachers = []
    prev_avg, prev_rank = None, 0
    for position, r in enumerate(rows, start=1):
        avg = r2(r[4])
        rank = prev_rank if avg == prev_avg else position
        prev_avg, prev_rank = avg, rank
        teachers.append(
            {
                "rank": rank,
                "teacher_id": r[0],
                "name": f"{r[1]} {r[2]}",
                "is_active": bool(r[3]),
                "average": avg,
                "level": level_for(avg),
                "total_evaluations": int(r[5]),
            }
        )
    return teachers


@analytics_bp.get("/trimesters")
@login_required
def list_trimesters():
    return jsonify([
        {
            "trimester_id": t.trimester_id,
            "label": trimester_label(t),
            "school_year": t.school_year,
            "trimester_name": t.trimester_name,
            "is_current": bool(t.is_current),
        }
        for t in ordered_trimesters()
    ])


@analytics_bp.get("/analytics/dashboard")
@login_required
def dashboard():
    trimester, trimesters = pick_trimester()
    if trimester is None:
        return jsonify(error="Trimester not found."), 404
    tid = trimester.trimester_id

    averages = average_by_trimester()
    overall = averages.get(tid)

    # Pagbabago kumpara sa naunang trimester
    index = trimesters.index(trimester)
    previous = averages.get(trimesters[index - 1].trimester_id) if index > 0 else None
    change = (
        round(overall - previous, 2)
        if overall is not None and previous is not None
        else None
    )

    # Average ng bawat evaluation (isang row kada evaluation)
    eval_rows = (
        db.session.query(
            Evaluation.evaluation_id,
            Evaluation.teacher_id,
            Evaluation.date_submitted,
            func.avg(Rating.rating_value),
        )
        .join(Rating, Rating.evaluation_id == Evaluation.evaluation_id)
        .filter(Evaluation.trimester_id == tid)
        .group_by(
            Evaluation.evaluation_id,
            Evaluation.teacher_id,
            Evaluation.date_submitted,
        )
        .all()
    )
    total_evaluations = len(eval_rows)

    # Distribution: ilagay ang bawat evaluation sa pinakamalapit na level (1-5)
    counts = {level: 0 for level, _ in LEVELS}
    for _, _, _, avg in eval_rows:
        level = min(5, max(1, int(float(avg) + 0.5)))
        counts[level] += 1
    distribution = [
        {
            "label": label,
            "value": counts[level],
            "percent": round(counts[level] * 100 / total_evaluations) if total_evaluations else 0,
        }
        for level, label in LEVELS
    ]

    # Top performing teacher ng trimester na ito
    avg_expr = func.avg(Rating.rating_value)
    count_expr = func.count(func.distinct(Evaluation.evaluation_id))
    top = (
        db.session.query(Teacher.first_name, Teacher.last_name, avg_expr, count_expr)
        .select_from(Evaluation)
        .join(Rating, Rating.evaluation_id == Evaluation.evaluation_id)
        .join(Teacher, Teacher.teacher_id == Evaluation.teacher_id)
        .filter(Evaluation.trimester_id == tid)
        .group_by(Teacher.teacher_id, Teacher.first_name, Teacher.last_name)
        .order_by(desc(avg_expr), desc(count_expr))
        .first()
    )

    # Trend: average kada trimester (None kung wala pang evaluations)
    trend = [
        {"label": short_label(t), "average": averages.get(t.trimester_id)}
        for t in trimesters
    ]

    # 5 pinakabagong evaluations (walang student info)
    recent_rows = sorted(eval_rows, key=lambda r: r[2], reverse=True)[:5]
    names = {}
    if recent_rows:
        teacher_ids = {r[1] for r in recent_rows}
        names = {
            t.teacher_id: f"{t.first_name} {t.last_name}"
            for t in Teacher.query.filter(Teacher.teacher_id.in_(teacher_ids)).all()
        }
    recent = [
        {
            "date": r[2].isoformat(),
            "teacher": names.get(r[1], "Unknown"),
            "rating": r2(r[3]),
        }
        for r in recent_rows
    ]

    return jsonify(
        trimester={"trimester_id": tid, "label": trimester_label(trimester)},
        stats={
            "total_teachers": Teacher.query.filter_by(is_active=True).count(),
            "teachers_evaluated": len({r[1] for r in eval_rows}),
            "total_evaluations": total_evaluations,
            "average_rating": overall,
            "change": change,
            "top_teacher": (
                {"name": f"{top[0]} {top[1]}", "rating": r2(top[2])} if top else None
            ),
        },
        trend=trend,
        distribution=distribution,
        recent=recent,
    )


@analytics_bp.get("/analytics/ranking")
@login_required
def ranking():
    trimester, _ = pick_trimester()
    if trimester is None:
        return jsonify(error="Trimester not found."), 404
    tid = trimester.trimester_id

    teachers = ranked_teachers(tid)

    active_ids = {t.teacher_id for t in Teacher.query.filter_by(is_active=True).all()}
    evaluated_active = {t["teacher_id"] for t in teachers if t["is_active"]}

    return jsonify(
        trimester={"trimester_id": tid, "label": trimester_label(trimester)},
        summary={
            "total_faculty": len(active_ids),
            "ranked_count": len(teachers),
            "highest": (
                {"name": teachers[0]["name"], "rating": teachers[0]["average"]}
                if teachers
                else None
            ),
            "lowest": (
                {"name": teachers[-1]["name"], "rating": teachers[-1]["average"]}
                if teachers
                else None
            ),
            "average": average_by_trimester().get(tid),
        },
        teachers=teachers,
        unrated=len(active_ids - evaluated_active),
    )


@analytics_bp.get("/analytics/teacher-profile")
@login_required
def teacher_profile():
    try:
        teacher_id = int(request.args.get("teacher_id", ""))
    except ValueError:
        return jsonify(error="Invalid teacher."), 400

    teacher = db.session.get(Teacher, teacher_id)
    if not teacher:
        return jsonify(error="Teacher not found."), 404

    trimester, trimesters = pick_trimester()
    if trimester is None:
        return jsonify(error="Trimester not found."), 404
    tid = trimester.trimester_id

    # Overall ng teacher kada trimester (para sa trend at sa pagbabago)
    trend_rows = (
        db.session.query(
            Evaluation.trimester_id,
            func.avg(Rating.rating_value),
            func.count(func.distinct(Evaluation.evaluation_id)),
        )
        .select_from(Evaluation)
        .join(Rating, Rating.evaluation_id == Evaluation.evaluation_id)
        .filter(Evaluation.teacher_id == teacher_id)
        .group_by(Evaluation.trimester_id)
        .all()
    )
    by_trimester = {row[0]: (r2(row[1]), int(row[2])) for row in trend_rows}
    overall, total_evaluations = by_trimester.get(tid, (None, 0))

    # Pagbabago kumpara sa pinakahuling naunang trimester na may data
    change = None
    if overall is not None:
        index = trimesters.index(trimester)
        for earlier in reversed(trimesters[:index]):
            prev = by_trimester.get(earlier.trimester_id)
            if prev:
                change = round(overall - prev[0], 2)
                break

    # Average ng bawat aspect sa trimester na ito
    aspect_rows = (
        db.session.query(
            Aspect.aspect_id,
            func.avg(Rating.rating_value),
            func.count(Rating.rating_id),
        )
        .select_from(Rating)
        .join(Evaluation, Rating.evaluation_id == Evaluation.evaluation_id)
        .join(Aspect, Rating.aspect_id == Aspect.aspect_id)
        .filter(Evaluation.teacher_id == teacher_id, Evaluation.trimester_id == tid)
        .group_by(Aspect.aspect_id)
        .all()
    )
    aspect_stats = {r[0]: (float(r[1]), int(r[2])) for r in aspect_rows}

    categories = []
    for c in Category.query.order_by(Category.category_id).all():
        aspects, weighted, count = [], 0.0, 0
        for a in sorted(c.aspects, key=lambda a: a.aspect_id):
            stat = aspect_stats.get(a.aspect_id)
            aspects.append(
                {
                    "aspect_id": a.aspect_id,
                    "name": a.aspect_name,
                    "average": r2(stat[0]) if stat else None,
                }
            )
            if stat:
                weighted += stat[0] * stat[1]
                count += stat[1]
        avg = r2(weighted / count) if count else None
        categories.append(
            {
                "category_id": c.category_id,
                "name": c.category_name,
                "average": avg,
                "level": level_for(avg),
                "aspects": aspects,
            }
        )

    rated = [c for c in categories if c["average"] is not None]
    strongest = max(rated, key=lambda c: c["average"]) if rated else None
    weakest = min(rated, key=lambda c: c["average"]) if rated else None

    ranked = ranked_teachers(tid)
    mine = next((t for t in ranked if t["teacher_id"] == teacher_id), None)

    return jsonify(
        teacher={
            "teacher_id": teacher.teacher_id,
            "name": f"{teacher.first_name} {teacher.last_name}",
            "is_active": bool(teacher.is_active),
        },
        trimester={"trimester_id": tid, "label": trimester_label(trimester)},
        overall={
            "average": overall,
            "level": level_for(overall),
            "total_evaluations": total_evaluations,
            "change": change,
            "rank": mine["rank"] if mine else Nonteacher_profile,
            "ranked_count": len(ranked),
        },
        categories=categories,
        strongest=(
            {"category_id": strongest["category_id"], "name": strongest["name"], "average": strongest["average"]}
            if strongest
            else None
        ),
        weakest=(
            {"category_id": weakest["category_id"], "name": weakest["name"], "average": weakest["average"]}
            if weakest
            else None
        ),
        trend=[
            {
                "label": short_label(t),
                "average": by_trimester.get(t.trimester_id, (None, 0))[0],
                "evaluations": by_trimester.get(t.trimester_id, (None, 0))[1],
            }
            for t in trimesters
        ],
    )

@analytics_bp.get("/analytics/category-breakdown")
@login_required
def category_breakdown():
    trimester, _ = pick_trimester()
    if trimester is None:
        return jsonify(error="Trimester not found."), 404
    tid = trimester.trimester_id

    categories = Category.query.order_by(Category.category_id).all()

    # Average ng buong faculty kada category
    faculty_rows = (
        db.session.query(Aspect.category_id, func.avg(Rating.rating_value))
        .select_from(Rating)
        .join(Evaluation, Rating.evaluation_id == Evaluation.evaluation_id)
        .join(Aspect, Rating.aspect_id == Aspect.aspect_id)
        .filter(Evaluation.trimester_id == tid)
        .group_by(Aspect.category_id)
        .all()
    )
    faculty = {row[0]: r2(row[1]) for row in faculty_rows}

    # Average ng bawat teacher kada category
    teacher_rows = (
        db.session.query(
            Evaluation.teacher_id, Aspect.category_id, func.avg(Rating.rating_value)
        )
        .select_from(Rating)
        .join(Evaluation, Rating.evaluation_id == Evaluation.evaluation_id)
        .join(Aspect, Rating.aspect_id == Aspect.aspect_id)
        .filter(Evaluation.trimester_id == tid)
        .group_by(Evaluation.teacher_id, Aspect.category_id)
        .all()
    )
    per_teacher = {}
    for teacher_id, category_id, avg in teacher_rows:
        per_teacher.setdefault(teacher_id, {})[category_id] = r2(avg)

    category_list = [
        {
            "category_id": c.category_id,
            "name": c.category_name,
            "average": faculty.get(c.category_id),
            "level": level_for(faculty.get(c.category_id)),
        }
        for c in categories
    ]

    rated = [c for c in category_list if c["average"] is not None]
    top = max(rated, key=lambda c: c["average"]) if rated else None
    lowest = min(rated, key=lambda c: c["average"]) if rated else None

    teachers = []
    for t in ranked_teachers(tid):
        scores = per_teacher.get(t["teacher_id"], {})
        teachers.append(
            {
                "rank": t["rank"],
                "teacher_id": t["teacher_id"],
                "name": t["name"],
                "overall": t["average"],
                "level": t["level"],
                "total_evaluations": t["total_evaluations"],
                # kapareho ng pagkakasunod ng "categories"
                "scores": [scores.get(c.category_id) for c in categories],
            }
        )

    return jsonify(
        trimester={"trimester_id": tid, "label": trimester_label(trimester)},
        overall=average_by_trimester().get(tid),
        total_evaluations=Evaluation.query.filter_by(trimester_id=tid).count(),
        categories=category_list,
        top=top,
        lowest=lowest,
        teachers=teachers,
    )

@analytics_bp.get("/analytics/trimester-comparison")
@login_required
def trimester_comparison():
    teacher_id = request.args.get("teacher_id", type=int)  # wala = buong faculty
    if teacher_id is not None and not db.session.get(Teacher, teacher_id):
        return jsonify(error="Teacher not found."), 404

    trimesters = ordered_trimesters()

    totals_q = (
        db.session.query(
            Evaluation.trimester_id,
            func.avg(Rating.rating_value),
            func.count(func.distinct(Evaluation.evaluation_id)),
            func.count(func.distinct(Evaluation.teacher_id)),
        )
        .select_from(Evaluation)
        .join(Rating, Rating.evaluation_id == Evaluation.evaluation_id)
    )
    category_q = (
        db.session.query(
            Evaluation.trimester_id, Aspect.category_id, func.avg(Rating.rating_value)
        )
        .select_from(Rating)
        .join(Evaluation, Rating.evaluation_id == Evaluation.evaluation_id)
        .join(Aspect, Rating.aspect_id == Aspect.aspect_id)
    )
    if teacher_id is not None:
        totals_q = totals_q.filter(Evaluation.teacher_id == teacher_id)
        category_q = category_q.filter(Evaluation.teacher_id == teacher_id)

    totals = {
        r[0]: (r2(r[1]), int(r[2]), int(r[3]))
        for r in totals_q.group_by(Evaluation.trimester_id).all()
    }
    category_values = {
        (tid, cid): r2(avg)
        for tid, cid, avg in category_q.group_by(
            Evaluation.trimester_id, Aspect.category_id
        ).all()
    }

    empty = (None, 0, 0)
    return jsonify(
        teacher_id=teacher_id,
        trimesters=[
            {
                "trimester_id": t.trimester_id,
                "label": trimester_label(t),
                "short": short_label(t),
                "is_current": bool(t.is_current),
                "average": totals.get(t.trimester_id, empty)[0],
                "total_evaluations": totals.get(t.trimester_id, empty)[1],
                "teachers_evaluated": totals.get(t.trimester_id, empty)[2],
                "has_data": t.trimester_id in totals,
            }
            for t in trimesters
        ],
        # ang "values" ay kapareho ng pagkakasunod ng "trimesters"
        categories=[
            {
                "category_id": c.category_id,
                "name": c.category_name,
                "values": [category_values.get((t.trimester_id, c.category_id)) for t in trimesters],
            }
            for c in Category.query.order_by(Category.category_id).all()
        ],
    )