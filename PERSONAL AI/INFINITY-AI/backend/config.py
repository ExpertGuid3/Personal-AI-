import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'infinity.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_EXPIRES_HOURS = int(os.getenv("JWT_EXPIRES_HOURS", 24))

    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "*")
