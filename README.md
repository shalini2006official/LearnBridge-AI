# LearnBridge AI — Personalized Adaptive Education Platform

LearnBridge AI is a full-stack, production-style personalized education platform that runs entirely on local, open-source AI models (or operates in a fully interactive, rule-based **Demo Mode** out-of-the-box with zero external API keys).

> **Core Loop:** ASK → UNDERSTAND → EXPLAIN → CHECK → PRACTICE → ANALYZE → DETECT GAP → ADAPT → IMPROVE → REPEAT  
> **Key Innovation:** Continually builds and adapts a learner profile tracking what students know, specific cognitive gaps (using a misconception library), self-rated confidence calibrations, and preferred explanation styles (Technical, Analogy, Worked Example, Visual).

---

## Technical Stack

*   **Frontend**: React (Vite) + TypeScript + Tailwind CSS (v4) + React Router + Recharts + Lucide Icons.
*   **Backend**: Python + FastAPI + SQLAlchemy + SQLite (with dynamic PostgreSQL connector configurations) + Pydantic schemas.
*   **Local AI (Ollama)**: Automatically connects to local Ollama server (`http://localhost:11434`) for text/agent generation.
*   **Demo Mode (Offline Fallback)**: If Ollama is not running, the platform shifts to a structured rule-based agent simulator using local database context to serve highly detailed educational responses, allowing 100% features test-drive immediately.
*   **Local RAG**: Numpy-based cosine similarity vector database fallback (FAISS compatible) + text/PDF parser.
*   **Voice Doubt Input**: Web Speech Recognition API (browser level - zero python audio packages compilation needed).
*   **Text-to-Speech (TTS)**: Web Speech Synthesis API.
*   **OCR Image Dubts Scanner**: Pillow + Pytesseract integration with fallback simulated text extractors.

---

## Directory Structure

```
learnbridge-ai/
├── backend/                  # FastAPI Backend application
│   ├── app/
│   │   ├── main.py           # Server entry point & DB sync
│   │   ├── config.py         # Config loader
│   │   ├── database.py       # SQL Connection engine
│   │   ├── models/           # SQLAlchemy DB Models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routes/           # REST API endpoints (auth, student, teacher, docs)
│   │   ├── services/         # LLM connector, OCR, Quiz Engine
│   │   ├── agents/           # Multi-agent orchestrator (Diagnostic, Retrieval, etc.)
│   │   └── rag/              # Vector database & chunk parser
│   └── requirements.txt
├── frontend/                 # Vite Frontend application
│   ├── src/
│   │   ├── components/       # Layout, SVG Knowledge Graph, Classroom Radar
│   │   ├── pages/            # Login, Student Dashboard, Quiz Arena, Tutor Chat
│   │   ├── hooks/            # Accessibility controls widget
│   │   ├── services/         # Fetch API client
│   │   └── types/            # TypeScript interfaces
│   ├── index.html
│   └── package.json
├── data/
│   ├── documents/            # Textbook chapters for RAG Reranking
│   └── seed/                 # Database seed script
├── docker-compose.yml        # Orchestration configuration
└── README.md
```

---

## Installation & Running

### 1. Backend Setup & Seeding

Ensure Python 3.10+ is installed. Navigate to the `backend/` directory:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies (incorporates precompiled binary wheels)
pip install -r requirements.txt

# Run database seeder
python ../data/seed/seed_db.py

# Start FastAPI development server
uvicorn app.main:app --reload
```
The API documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup

Navigate to the `frontend/` directory:

```bash
# Install NPM modules
npm install

# Start Vite React server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Exploring Demo Mode (Sandbox)

We have created pre-configured student and teacher accounts in our seed script. Click the **Student Sandbox** or **Teacher Sandbox** buttons on the Login Page for single-click access:

### 🔑 Seeded Sandbox Accounts:
*   **Student Login**:
    *   *Email*: `student@learnbridge.edu`
    *   *Password*: `student123`
    *   *Features to explore*: SVG Knowledge Graph, Tutor Chat with strategy switching, Feynman Teach-Back mode, Adaptive Quiz with confidence calibration, Achievements panel.
*   **Teacher Login**:
    *   *Email*: `teacher@learnbridge.edu`
    *   *Password*: `teacher123`
    *   *Features to explore*: Classroom Pulse (at-risk count), Classroom Radar (grouping students by specific topic misconceptions like "recursion call order"), AI-recommended Intervention actions (Accept/Modify/Dismiss).
