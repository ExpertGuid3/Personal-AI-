from flask import Blueprint, request, jsonify

from extensions import db
from models import PlannerEntry, Activity
from auth_utils import token_required
import ai_service

planner_bp = Blueprint("planner", __name__, url_prefix="/api/planner")


@planner_bp.route("", methods=["GET"])
@token_required
def list_plans(current_user):
    plans = (
        PlannerEntry.query.filter_by(user_id=current_user.id)
        .order_by(PlannerEntry.created_at.desc())
        .all()
    )
    return jsonify({"plans": [p.to_dict() for p in plans]}), 200


@planner_bp.route("/generate", methods=["POST"])
@token_required
def generate(current_user):
    data = request.get_json(silent=True) or {}
    goals = (data.get("goals") or "").strip()

    if not goals:
        return jsonify({"error": "goals is required"}), 400

    plan_text = ai_service.generate_daily_plan(goals)

    entry = PlannerEntry(user_id=current_user.id, goals=goals, plan=plan_text)
    db.session.add(entry)
    db.session.add(Activity(user_id=current_user.id, action="Created Daily Plan", status="Pending"))
    db.session.commit()

    return jsonify({"plan": entry.to_dict()}), 201


@planner_bp.route("/<int:plan_id>", methods=["DELETE"])
@token_required
def delete_plan(current_user, plan_id):
    entry = PlannerEntry.query.filter_by(id=plan_id, user_id=current_user.id).first()
    if not entry:
        return jsonify({"error": "Plan not found"}), 404
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Plan deleted"}), 200
