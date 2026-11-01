from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, login_manager


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    login_manager.init_app(app)
    login_manager.session_protection = "strong"
    CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

    from models import Admin  # na-i-import din dito ang lahat ng tables
    from student_routes import student_bp
    from admin_routes import admin_bp
    from analytics_routes import analytics_bp  # BAGO

    @login_manager.user_loader
    def load_admin(admin_id):
        try:
            return db.session.get(Admin, int(admin_id))
        except (TypeError, ValueError):
            return None

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify(error="Authentication required."), 401

    app.register_blueprint(student_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(analytics_bp)  # BAGO

    with app.app_context():
        db.create_all()

    @app.get("/api/health")
    def health():
        return jsonify(status="ok")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)