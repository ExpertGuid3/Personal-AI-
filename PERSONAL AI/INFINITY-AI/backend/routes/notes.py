from flask import Blueprint, request, jsonify

from extensions import db
from models import Note, Activity
from auth_utils import token_required
import ai_service

notes_bp = Blueprint("notes", __name__, url_prefix="/api/notes")


@notes_bp.route("", methods=["GET"])
@token_required
def list_notes(current_user):
    notes = (
        Note.query.filter_by(user_id=current_user.id)
        .order_by(Note.created_at.desc())
        .all()
    )
    return jsonify({"notes": [n.to_dict() for n in notes]}), 200


@notes_bp.route("/summarize", methods=["POST"])
@token_required
def summarize(current_user):
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()

    if not text:
        return jsonify({"error": "text is required"}), 400

    summary = ai_service.summarize_note(text)

    note = Note(user_id=current_user.id, original_text=text, summary=summary)
    db.session.add(note)
    db.session.add(Activity(user_id=current_user.id, action="Summarized Notes", status="Completed"))
    db.session.commit()

    return jsonify({"note": note.to_dict()}), 201


@notes_bp.route("/<int:note_id>", methods=["DELETE"])
@token_required
def delete_note(current_user, note_id):
    note = Note.query.filter_by(id=note_id, user_id=current_user.id).first()
    if not note:
        return jsonify({"error": "Note not found"}), 404
    db.session.delete(note)
    db.session.commit()
    return jsonify({"message": "Note deleted"}), 200
