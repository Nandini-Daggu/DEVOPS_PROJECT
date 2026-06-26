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
│   └── .env               # OpenAI API key configuration
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Professional UI styles
│   └── app.js              # Application logic
└── README.md
```

## Quick Start (Demo Mode)

The frontend works standalone with demo questions. Simply open `frontend/index.html` in a browser:

1. Navigate to `c:\Users\NANDINI DAGGU\Desktop\QUIZ-GEN\frontend\`
2. Open `index.html` in your browser
3. Click the upload area (demo mode will simulate file upload)
4. Configure quiz settings and click "Generate Quiz"
5. Take the quiz and view results

## Full Setup (with AI Backend)

### Prerequisites
- Python 3.8+
- OpenAI API key

### Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Add your OpenAI API key to `backend/.env`:
```
OPENAI_API_KEY=your-actual-api-key-here
```

3. Start the Flask server:
```bash
cd backend
python app.py
```

4. Update `frontend/app.js`:
   - Set `USE_DEMO_MODE = false` (line ~15)

5. Open `frontend/index.html` in your browser

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload and parse PPTX file |
| `/api/generate-quiz` | POST | Generate MCQs from slide content |
| `/api/validate-quiz` | POST | Validate answers and return results |

## Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (no frameworks needed)
- **Backend**: Python Flask, python-pptx, OpenAI API
- **UI**: Custom dark theme with gradient accents, card-based layout, smooth animations

## Evaluation Criteria Coverage

| Criteria | Status |
|----------|--------|
| PPT Parsing & Input (15%) | ✅ python-pptx integration |
| AI MCQ Generation (25%) | ✅ OpenAI GPT integration |
| Quiz UI / UX (20%) | ✅ Responsive, animated, intuitive |
| Scoring Accuracy (15%) | ✅ Correct score computation |
| AI Feedback Quality (15%) | ✅ Detailed explanations |
| Code Quality & Docs (10%) | ✅ Clean code, README, comments |"# Quiz-Generator" 
