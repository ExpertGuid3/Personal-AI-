from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db, bcrypt

from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.todo import todo_bp
from routes.notes import notes_bp
from routes.email_gen import email_bp
from routes.planner import planner_bp
from routes.dashboard import dashboard_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)

    CORS(app, resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}})

    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(todo_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(planner_bp)
    app.register_blueprint(dashboard_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "INFINITY AI backend"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    with app.app_context():
        db.create_all()

    return app


app = create_app()

import os

if __name__ == "__main__":
    port=int(os.environ.get("PORT",5000))
    app.run(host="0.0.0.0",port=port)
