from flask import Blueprint, jsonify

from models import ChatMessage, Task, Note, GeneratedEmail, Activity, db
from auth_utils import token_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/stats", methods=["GET"])
@token_required
def stats(current_user):
    chat_sessions = (
        db.session.query(ChatMessage.session_id)
        .filter_by(user_id=current_user.id)
        .distinct()
        .count()
    )
    tasks_total = Task.query.filter_by(user_id=current_user.id).count()
    tasks_pending = Task.query.filter_by(user_id=current_user.id, is_done=False).count()
    notes_total = Note.query.filter_by(user_id=current_user.id).count()
    emails_total = GeneratedEmail.query.filter_by(user_id=current_user.id).count()

    return (
        jsonify(
            {
                "chats": chat_sessions,
                "tasks_total": tasks_total,
                "tasks_pending": tasks_pending,
                "notes": notes_total,
                "emails": emails_total,
            }
        ),
        200,
    )


@dashboard_bp.route("/activity", methods=["GET"])
@token_required
def activity(current_user):
    rows = (
        Activity.query.filter_by(user_id=current_user.id)
        .order_by(Activity.created_at.desc())
        .limit(10)
        .all()
    )
    return jsonify({"activity": [r.to_dict() for r in rows]}), 200
