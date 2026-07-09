import uuid
from flask import Blueprint, request, jsonify

from extensions import db
from models import ChatMessage, Activity
from auth_utils import token_required
import ai_service

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


@chat_bp.route("/sessions", methods=["GET"])
@token_required
def list_sessions(current_user):
    """Return one row per session_id with its most recent message + a title."""
    rows = (
        ChatMessage.query.filter_by(user_id=current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    sessions = {}
    for row in rows:
        sessions.setdefault(row.session_id, []).append(row)

    result = []
    for session_id, msgs in sessions.items():
        first_user_msg = next((m.content for m in msgs if m.role == "user"), "New chat")
        result.append(
            {
                "session_id": session_id,
                "title": (first_user_msg[:40] + "…") if len(first_user_msg) > 40 else first_user_msg,
                "updated_at": msgs[-1].created_at.isoformat(),
            }
        )
    result.sort(key=lambda s: s["updated_at"], reverse=True)
    return jsonify({"sessions": result}), 200


@chat_bp.route("/history/<session_id>", methods=["GET"])
@token_required
def history(current_user, session_id):
    rows = (
        ChatMessage.query.filter_by(user_id=current_user.id, session_id=session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return jsonify({"messages": [r.to_dict() for r in rows]}), 200


@chat_bp.route("/send", methods=["POST"])
@token_required
def send(current_user):
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    session_id = data.get("session_id") or str(uuid.uuid4())

    if not message:
        return jsonify({"error": "message is required"}), 400

    previous = (
        ChatMessage.query.filter_by(user_id=current_user.id, session_id=session_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    history_payload = [{"role": m.role, "content": m.content} for m in previous[-10:]]

    user_msg = ChatMessage(
        user_id=current_user.id, session_id=session_id, role="user", content=message
    )
    db.session.add(user_msg)
    db.session.commit()

    reply_text = ai_service.chat_reply(history_payload, message)

    ai_msg = ChatMessage(
        user_id=current_user.id, session_id=session_id, role="ai", content=reply_text
    )
    db.session.add(ai_msg)
    db.session.add(Activity(user_id=current_user.id, action="AI Chat message", status="Completed"))
    db.session.commit()

    return (
        jsonify(
            {
                "session_id": session_id,
                "reply": ai_msg.to_dict(),
                "user_message": user_msg.to_dict(),
            }
        ),
        200,
    )
