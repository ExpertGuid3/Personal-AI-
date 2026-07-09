from flask import Blueprint, request, jsonify

from extensions import db
from models import Task, Activity
from auth_utils import token_required

todo_bp = Blueprint("todo", __name__, url_prefix="/api/todos")


@todo_bp.route("", methods=["GET"])
@token_required
def list_tasks(current_user):
    tasks = (
        Task.query.filter_by(user_id=current_user.id)
        .order_by(Task.created_at.desc())
        .all()
    )
    return jsonify({"tasks": [t.to_dict() for t in tasks]}), 200


@todo_bp.route("", methods=["POST"])
@token_required
def create_task(current_user):
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    priority = data.get("priority", "normal")

    if not title:
        return jsonify({"error": "title is required"}), 400

    task = Task(user_id=current_user.id, title=title, priority=priority)
    db.session.add(task)
    db.session.add(Activity(user_id=current_user.id, action=f"Added task: {title}", status="Completed"))
    db.session.commit()
    return jsonify({"task": task.to_dict()}), 201


@todo_bp.route("/<int:task_id>", methods=["PUT"])
@token_required
def update_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True) or {}
    if "title" in data:
        task.title = data["title"].strip() or task.title
    if "is_done" in data:
        task.is_done = bool(data["is_done"])
    if "priority" in data:
        task.priority = data["priority"]

    db.session.commit()
    return jsonify({"task": task.to_dict()}), 200


@todo_bp.route("/<int:task_id>", methods=["DELETE"])
@token_required
def delete_task(current_user, task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200
