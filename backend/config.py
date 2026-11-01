import os
from datetime import timedelta


class Config:
    # Palitan ang SECRET_KEY ng random na mahabang string bago i-deploy
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")

    # XAMPP default: user root, walang password
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "mysql+pymysql://root:@localhost/teacher_eval_system?charset=utf8mb4",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    # I-set sa "1" kapag naka-HTTPS na ang deployment
    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE") == "1"
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)