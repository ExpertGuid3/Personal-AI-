# INFINITY — Personal AI Productivity Assistant

A full-stack productivity app: AI Chat, To-Do Manager, AI Note Summarizer,
AI Email Generator, and AI Daily Planner — all powered by Google's Gemini API.

```
INFINITY-AI/
├── frontend/     → HTML, CSS, JS (static, no build step)
└── backend/      → Python Flask API + SQLite database
```

## 1. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit .env and paste your GEMINI_API_KEY
python app.py
```

The API now runs at **http://127.0.0.1:5000**. It auto-creates `infinity.db`
(SQLite) on first run — no manual database setup needed.

Get a free Gemini API key at https://aistudio.google.com/app/apikey and put it
in `backend/.env` as `GEMINI_API_KEY=...`. Until you do, every AI feature
still works but returns a clearly-labeled demo reply instead of a real answer.

## 2. Frontend setup

No build tools required — it's plain HTML/CSS/JS. Just serve the folder so
`fetch()` calls work correctly (opening the files directly with `file://`
can cause CORS issues in some browsers):

```bash
cd frontend
python -m http.server 5500
```

Then open **http://127.0.0.1:5500** in your browser.

If you serve the frontend from a different port/host, update:
- `FRONTEND_ORIGIN` in `backend/.env`
- `API_BASE_URL` in `frontend/js/api.js`

## 3. Using the app

1. Open `index.html` → **Get Started** → create an account (`register.html`).
2. You're redirected to `dashboard.html`, which now shows *your* real stats,
   tasks and recent activity pulled from the backend.
3. Use the sidebar to reach:
   - **AI Chat** (`chat.html`) — full conversations with saved history/sessions.
   - **Tasks** (`todo.html`) — add/complete/delete to-dos.
   - **Notes** (`notes.html`) — paste text, get an AI summary.
   - **Email Generator** (`email.html`) — describe an email, pick a tone, generate it.
   - **Planner** (`planner.html`) — list your goals, get a time-blocked schedule.

All data is scoped to the logged-in user via a JWT token (stored in
`localStorage`) sent as `Authorization: Bearer <token>` on every request.

## 4. Tech stack

| Layer      | Tech                                            |
|------------|--------------------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JS, Bootstrap 5 / Bootstrap Icons |
| Backend    | Python, Flask, Flask-SQLAlchemy, Flask-Bcrypt, Flask-CORS, PyJWT |
| Database   | SQLite                                            |
| AI / LLM   | Google Gemini API (`google-generativeai`)        |

## 5. API reference (all under `/api`)

| Method | Endpoint                     | Auth | Description |
|--------|-------------------------------|------|--------------|
| POST   | `/auth/register`              | —    | Create account |
| POST   | `/auth/login`                 | —    | Log in, get JWT |
| GET    | `/auth/me`                    | ✅   | Current user |
| GET    | `/dashboard/stats`             | ✅   | Counts for dashboard cards |
| GET    | `/dashboard/activity`          | ✅   | Recent activity feed |
| GET    | `/chat/sessions`               | ✅   | List chat sessions |
| GET    | `/chat/history/<session_id>`   | ✅   | Messages in a session |
| POST   | `/chat/send`                   | ✅   | Send a message, get AI reply |
| GET/POST/PUT/DELETE | `/todos[/<id>]`  | ✅   | Task CRUD |
| GET    | `/notes`                       | ✅   | List saved summaries |
| POST   | `/notes/summarize`             | ✅   | Summarize text |
| DELETE | `/notes/<id>`                  | ✅   | Delete a summary |
| GET    | `/email`                       | ✅   | List generated emails |
| POST   | `/email/generate`              | ✅   | Generate an email |
| DELETE | `/email/<id>`                  | ✅   | Delete a generated email |
| GET    | `/planner`                     | ✅   | List saved plans |
| POST   | `/planner/generate`            | ✅   | Generate a daily plan |
| DELETE | `/planner/<id>`                | ✅   | Delete a plan |

Enjoy building on top of it! 🚀
