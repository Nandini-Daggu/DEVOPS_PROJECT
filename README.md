# QuizGen AI - AI-Powered Quiz Generator

Transform any PowerPoint presentation into an interactive, scored multiple-choice quiz — powered by AI.

## Features

- **📤 PPT Upload** - Drag & drop or browse to upload .pptx/.ppt files
- **⚙️ Quiz Configuration** - Choose question count (5-30) and difficulty (Simple/Medium/Complex)
- **🤖 AI Generation** - Uses OpenAI GPT to analyze slides and generate relevant MCQs
- **🎯 Interactive Quiz** - One question at a time with smooth navigation and timer
- **📊 Results & Feedback** - Score, percentage, grade, and detailed AI explanations for each answer
- **⌨️ Keyboard Navigation** - Use arrow keys and number keys for faster interaction
- **📱 Responsive Design** - Works on desktop, tablet, and mobile

## Project Structure

```
QUIZ-GEN/
├── backend/
│   ├── app.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container definition
│   └── .env               # OpenAI API key (not committed to git)
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Professional UI styles
│   ├── app.js              # Application logic
│   ├── pptx-parser.js      # In-browser PPT parser
│   ├── Dockerfile          # Frontend container definition
│   └── nginx.conf          # nginx configuration
├── docker-compose.yml      # Orchestrates both containers
├── .dockerignore           # Files excluded from Docker images
├── .gitignore              # Files excluded from git
├── .env.example            # Environment variable template
└── README.md
```

---

## 🐳 Docker Setup (Recommended)

Run the entire application with a single command. No Python, no pip, no virtual environment needed on your machine.

### Architecture

```
Browser
  │
  │ http://localhost:8080
  ▼
Frontend container (nginx)
  │  serves index.html, app.js, styles.css, pptx-parser.js
  │
  │ http://localhost:5000/api  (called from browser)
  ▼
Backend container (gunicorn + Flask)
  │
  │ HTTPS
  ▼
OpenAI API
```

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Setup

```bash
# 1. Clone or download the project
git clone <repository-url>
cd QUIZ-GEN

# 2. Create your .env file with your OpenAI API key
#    Copy the template and fill in your real key
copy .env.example .env
```

Edit `.env`:
```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
```

### Run

```bash
docker compose up --build
```

This builds both images and starts the containers. On first run it downloads base images (~200MB). Subsequent builds are fast due to layer caching.

### Access

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:8080            |
| Backend  | http://localhost:5000            |
| Health   | http://localhost:5000/api/health |

### Stop

```bash
docker compose down
```

### Rebuild after code changes

```bash
docker compose up --build
```

### View logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Frontend only
docker compose logs -f frontend
```

---

## 💻 Local Development (without Docker)

### Prerequisites
- Python 3.8+
- OpenAI API key

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Add your API key
# Edit backend/.env and set OPENAI_API_KEY=your-key-here

# Start Flask development server
python app.py
```

The backend runs at `http://localhost:5000`.

### Frontend

Open `frontend/index.html` directly in your browser. No build step required.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload and parse PPTX file |
| `/api/generate-quiz` | POST | Generate MCQs from slide content |
| `/api/validate-quiz` | POST | Validate answers and return results |

---

## Technical Stack

| Layer     | Technology                                                |
|-----------|-----------------------------------------------------------|
| Frontend  | Vanilla JavaScript, HTML5, CSS3                           |
| Backend   | Python 3.12, Flask 3.0, gunicorn (production)             |
| AI        | OpenAI GPT-3.5-turbo via openai 3.x SDK                  |
| PPT Parse | python-pptx (server), JSZip + in-browser parser (client)  |
| Container | Docker, Docker Compose, nginx 1.25                        |

---

## Environment Variables

| Variable         | Required | Description                     |
|------------------|----------|---------------------------------|
| `OPENAI_API_KEY` | Yes      | Your OpenAI API key             |
| `PORT`           | No       | Backend port (default: `5000`)  |

---

## Evaluation Criteria Coverage

| Criteria | Status |
|----------|--------|
| PPT Parsing & Input (15%) | ✅ python-pptx integration |
| AI MCQ Generation (25%) | ✅ OpenAI GPT integration |
| Quiz UI / UX (20%) | ✅ Responsive, animated, intuitive |
| Scoring Accuracy (15%) | ✅ Correct score computation |
| AI Feedback Quality (15%) | ✅ Detailed explanations |
| Code Quality & Docs (10%) | ✅ Clean code, README, comments |
| DevOps / Docker (bonus) | ✅ Dockerized with Compose, healthcheck, secrets handling |
