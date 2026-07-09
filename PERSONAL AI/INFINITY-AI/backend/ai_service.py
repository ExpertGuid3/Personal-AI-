"""
Thin wrapper around the Google Gemini API.

If GEMINI_API_KEY is not configured, every function falls back to a
clearly-labeled demo response so the rest of the app keeps working
while someone is wiring up their real key.
"""

import google.generativeai as genai
from flask import current_app

_configured = False


def _ensure_configured():
    global _configured
    if not _configured and current_app.config.get("GEMINI_API_KEY"):
        genai.configure(api_key=current_app.config["GEMINI_API_KEY"])
        _configured = True


def _has_key():
    return bool(current_app.config.get("GEMINI_API_KEY"))


def _model():
    _ensure_configured()
    return genai.GenerativeModel(current_app.config.get("GEMINI_MODEL", "gemini-1.5-flash"))


def _generate(prompt):
    """Call Gemini with a single prompt string and return plain text."""
    if not _has_key():
        return (
            "⚠️ Demo mode: no GEMINI_API_KEY is set in backend/.env yet, "
            "so this is a placeholder reply. Add your key to get real AI answers.\n\n"
            f"(Your prompt was: \"{prompt[:200]}\")"
        )

    try:
        response = _model().generate_content(prompt)
        return response.text.strip()
    except Exception as exc:  # pragma: no cover - network/SDK errors
        return f"⚠️ Gemini API error: {exc}"


def chat_reply(history, new_message):
    """
    history: list of {"role": "user"|"ai", "content": str}
    new_message: str
    """
    convo = "\n".join(
        f"{'User' if h['role'] == 'user' else 'Assistant'}: {h['content']}" for h in history
    )
    prompt = (
        "You are INFINITY AI, a friendly and concise personal productivity assistant. "
        "Continue the conversation naturally.\n\n"
        f"{convo}\nUser: {new_message}\nAssistant:"
    )
    return _generate(prompt)


def summarize_note(text):
    prompt = (
        "Summarize the following note into 3-5 short, clear bullet points. "
        "Keep only the key information.\n\nNOTE:\n" + text
    )
    return _generate(prompt)


def generate_email(details, tone="professional"):
    prompt = (
        f"Write a {tone} email based on this request. Include a subject line "
        "on the first line prefixed with 'Subject:', then a blank line, then the email body.\n\n"
        f"REQUEST:\n{details}"
    )
    return _generate(prompt)


def generate_daily_plan(goals):
    prompt = (
        "Create a realistic, time-blocked daily schedule based on these goals/priorities. "
        "Format as a simple list of time slots (e.g. '9:00 AM - 10:00 AM: ...'). "
        "Keep it practical and not overly long.\n\nGOALS:\n" + goals
    )
    return _generate(prompt)


def generate_ideas(topic):
    prompt = f"Give 5 fresh, practical ideas about: {topic}. Number them 1-5, one line each."
    return _generate(prompt)
