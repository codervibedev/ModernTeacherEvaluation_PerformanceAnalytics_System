from getpass import getpass

from app import app
from extensions import db
from models import Admin

with app.app_context():
    username = input("Admin username: ").strip()
    password = getpass("Admin password: ")
    admin = Admin.query.filter_by(username=username).first()
    if admin:
        admin.set_password(password)
        print("Password updated.")
    else:
        admin = Admin(username=username, first_name="System", last_name="Admin")
        admin.set_password(password)
        db.session.add(admin)
        print("Admin created.")
    db.session.commit()