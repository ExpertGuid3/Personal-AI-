from flask import Blueprint, request, jsonify

from extensions import db
from models import GeneratedEmail, Activity
from auth_utils import token_required
import ai_service

email_bp = Blueprint("email", __name__, url_prefix="/api/email")


@email_bp.route("", methods=["GET"])
@token_required
def list_emails(current_user):
    emails = (
        GeneratedEmail.query.filter_by(user_id=current_user.id)
        .order_by(GeneratedEmail.created_at.desc())
        .all()
    )
    return jsonify({"emails": [e.to_dict() for e in emails]}), 200


@email_bp.route("/generate", methods=["POST"])
@token_required
def generate(current_user):
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "").strip()
    tone = data.get("tone", "professional")

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    result = ai_service.generate_email(prompt, tone)

    email_obj = GeneratedEmail(user_id=current_user.id, prompt=prompt, tone=tone, result=result)
    db.session.add(email_obj)
    db.session.add(Activity(user_id=current_user.id, action="Generated Email", status="Completed"))
    db.session.commit()

    return jsonify({"email": email_obj.to_dict()}), 201


@email_bp.route("/<int:email_id>", methods=["DELETE"])
@token_required
def delete_email(current_user, email_id):
    email_obj = GeneratedEmail.query.filter_by(id=email_id, user_id=current_user.id).first()
    if not email_obj:
        return jsonify({"error": "Email not found"}), 404
    db.session.delete(email_obj)
    db.session.commit()
    return jsonify({"message": "Email deleted"}), 200
