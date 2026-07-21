from datetime import datetime
from extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(80), nullable=False)
    last_name = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(30))
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    chats = db.relationship("ChatMessage", backref="user", lazy=True, cascade="all, delete-orphan")
    tasks = db.relationship("Task", backref="user", lazy=True, cascade="all, delete-orphan")
    notes = db.relationship("Note", backref="user", lazy=True, cascade="all, delete-orphan")
    emails = db.relationship("GeneratedEmail", backref="user", lazy=True, cascade="all, delete-orphan")
    plans = db.relationship("PlannerEntry", backref="user", lazy=True, cascade="all, delete-orphan")
    activities = db.relationship("Activity", backref="user", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "phone": self.phone,
            "created_at": self.created_at.isoformat() + "Z",
        }


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_id = db.Column(db.String(80), nullable=False, index=True)
    role = db.Column(db.String(10), nullable=False)  # 'user' or 'ai'
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "role": self.role,
            "content": self.content,
            "created_at": self.created_at.isoformat() + "Z",
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    is_done = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(10), default="normal")  # low, normal, high
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "is_done": self.is_done,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() + "Z",
        }


class Note(db.Model):
    __tablename__ = "notes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    original_text = db.Column(db.Text, nullable=False)
    summary = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "original_text": self.original_text,
            "summary": self.summary,
            "created_at": self.created_at.isoformat() + "Z",
        }


class GeneratedEmail(db.Model):
    __tablename__ = "generated_emails"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    prompt = db.Column(db.Text, nullable=False)
    tone = db.Column(db.String(30), default="professional")
    result = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "prompt": self.prompt,
            "tone": self.tone,
            "result": self.result,
            "created_at": self.created_at.isoformat() + "Z",
        }


class PlannerEntry(db.Model):
    __tablename__ = "planner_entries"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    goals = db.Column(db.Text, nullable=False)
    plan = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "goals": self.goals,
            "plan": self.plan,
            "created_at": self.created_at.isoformat() + "Z",
        }


class Activity(db.Model):
    __tablename__ = "activities"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    action = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(20), default="Completed")  # Completed, Pending, Done
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "action": self.action,
            "status": self.status,
            "created_at": self.created_at.isoformat() + "Z",
        }
