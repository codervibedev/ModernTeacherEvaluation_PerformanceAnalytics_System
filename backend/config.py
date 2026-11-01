import os
from datetime import timedelta
from urllib.parse import quote_plus

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
USE_REMOTE_DB = bool(os.environ.get("DB_HOST"))


def _database_uri():
    if USE_REMOTE_DB:
        return (
            f"mysql+pymysql://{os.environ['DB_USER']}:{quote_plus(os.environ['DB_PASSWORD'])}"
            f"@{os.environ['DB_HOST']}:{os.environ.get('DB_PORT', '3306')}"
            f"/{os.environ['DB_NAME']}?charset=utf8mb4"
        )
    # XAMPP default: user root, walang password
    return "mysql+pymysql://root:@localhost/teacher_eval_system?charset=utf8mb4"


class Config:
    # Palitan ang SECRET_KEY ng random na mahabang string bago i-deploy
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")

    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    if USE_REMOTE_DB:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "connect_args": {
                "ssl": {"ca": os.environ.get("DB_SSL_CA", os.path.join(BASE_DIR, "ca.pem"))}
            },
            "pool_pre_ping": True,
            "pool_recycle": 280,
        }

    SESSION_COOKIE_HTTPONLY = True
    # Sa deployment (magkaibang domain ang frontend at backend), i-set sa "None"
    SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
    # I-set sa "1" kapag naka-HTTPS na ang deployment
    SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE") == "1"
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)