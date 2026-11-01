"""
DEMO / TEST DATA lang ito. Hindi ito totoong evaluations.
Gumawa:  python seed_demo.py
Burahin: python seed_demo.py --clear
Ang mga test student ay may ID na nagsisimula sa "TEST-".
"""
import random
import sys
from datetime import datetime, timedelta

from app import app
from extensions import db
from models import Aspect, Evaluation, Rating, Section, Student, Teacher, Trimester

PREFIX = "TEST-"
DEMO_YEAR = "2024-2025"


def get_or_create_trimester(year, name):
    t = Trimester.query.filter_by(school_year=year, trimester_name=name).first()
    if not t:
        t = Trimester(school_year=year, trimester_name=name, is_current=False)
        db.session.add(t)
        db.session.flush()
    return t


def clear():
    with app.app_context():
        test_ids = [
            s.student_id
            for s in Student.query.filter(Student.student_id.like(f"{PREFIX}%")).all()
        ]
        if test_ids:
            for ev in Evaluation.query.filter(Evaluation.student_id.in_(test_ids)).all():
                db.session.delete(ev)
            db.session.flush()
            Student.query.filter(Student.student_id.in_(test_ids)).delete(
                synchronize_session=False
            )
        for t in Trimester.query.filter_by(school_year=DEMO_YEAR).all():
            if not Evaluation.query.filter_by(trimester_id=t.trimester_id).first():
                db.session.delete(t)
        db.session.commit()
        print("Demo data removed.")


def generate():
    random.seed(7)
    with app.app_context():
        if Student.query.filter(Student.student_id.like(f"{PREFIX}%")).first():
            print("Demo data already exists. Run with --clear first.")
            return

        section = Section.query.order_by(Section.section_id).first()
        teachers = Teacher.query.filter_by(is_active=True).all()
        aspects = Aspect.query.all()
        current = Trimester.query.filter_by(is_current=True).first()
        if not (section and teachers and aspects and current):
            print("Run seed.py first (need a section, teachers, aspects, current trimester).")
            return

        students = [
            Student(student_id=f"{PREFIX}{i:04d}", section_id=section.section_id)
            for i in range(1, 31)
        ]
        db.session.add_all(students)
        db.session.flush()

        # (trimester, ilang araw na ang nakalipas, pagbabago sa rating)
        periods = [
            (get_or_create_trimester(DEMO_YEAR, "2nd Trimester"), 240, -0.35),
            (get_or_create_trimester(DEMO_YEAR, "3rd Trimester"), 120, -0.15),
            (current, 5, 0.0),
        ]

        base = {t.teacher_id: random.uniform(3.2, 4.8) for t in teachers}
        category_bias = {a.category_id: random.uniform(-0.3, 0.3) for a in aspects}
        now = datetime.utcnow()
        total = 0

        for trimester, days_ago, trend in periods:
            for teacher in teachers:
                for student in random.sample(students, random.randint(12, 24)):
                    ev = Evaluation(
                        student_id=student.student_id,
                        teacher_id=teacher.teacher_id,
                        trimester_id=trimester.trimester_id,
                        date_submitted=now
                        - timedelta(days=days_ago + random.randint(0, 25)),
                    )
                    db.session.add(ev)
                    for a in aspects:
                        raw = (
                            base[teacher.teacher_id]
                            + category_bias[a.category_id]
                            + trend
                            + random.gauss(0, 0.6)
                        )
                        value = min(5, max(1, round(raw)))
                        db.session.add(
                            Rating(evaluation=ev, aspect_id=a.aspect_id, rating_value=value)
                        )
                    total += 1

        db.session.commit()
        print(f"Demo data created: {total} test evaluations.")


if __name__ == "__main__":
    if "--clear" in sys.argv:
        clear()
    else:
        generate()