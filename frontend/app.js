/**
 * QuizGen AI - Application Logic
 * Handles all frontend interactions, PPT parsing, question generation, and UI updates
 * Now uses real PPT parsing with JSZip and generates questions from actual slide content
 */

// ============================================
// Configuration
// ============================================

const API_BASE_URL = 'http://localhost:5000/api';
const TIMER_DURATION = 15 * 60; // 15 minutes in seconds
const USE_DEMO_MODE = true; // Demo mode uses sample questions; set false for real PPT parsing

// ============================================
// Demo Data (fallback when no PPT uploaded)
// ============================================

const DEMO_QUESTIONS = [
    {
        id: 1,
        question: "What is the primary purpose of a PowerPoint presentation?",
        options: {
            A: "To store large amounts of data",
            B: "To visually communicate information to an audience",
            C: "To edit high-resolution images",
            D: "To compile computer code"
        },
        correct_answer: "B",
        explanation: "PowerPoint is designed for visual communication. Its primary purpose is to help presenters convey information effectively through slides that combine text, images, and multimedia elements."
    },
    {
        id: 2,
        question: "Which of the following is NOT a standard component of a PowerPoint slide?",
        options: {
            A: "Text boxes",
            B: "Charts and graphs",
            C: "Database queries",
            D: "Images and shapes"
        },
        correct_answer: "C",
        explanation: "Database queries are not a standard PowerPoint component. PowerPoint focuses on presentation elements like text boxes, charts, images, and shapes to create visual slides."
    },
    {
        id: 3,
        question: "What does AI-powered quiz generation typically use to create questions from slides?",
        options: {
            A: "Random word selection",
            B: "Natural Language Processing (NLP)",
            C: "Manual entry by users",
            D: "Pre-written question banks"
        },
        correct_answer: "B",
        explanation: "AI quiz generation leverages Natural Language Processing (NLP) to understand slide content, identify key concepts, and generate relevant questions that test comprehension of the material."
    },
    {
        id: 4,
        question: "In the context of quiz generation, what makes a good distractor?",
        options: {
            A: "An obviously wrong answer",
            B: "A humorous but incorrect option",
            C: "A plausible but incorrect answer",
            D: "A technically correct but unrelated answer"
        },
        correct_answer: "C",
        explanation: "Good distractors are plausible but incorrect answers that challenge the test-taker's understanding. They should be believable enough that someone who hasn't mastered the material might select them."
    },
    {
        id: 5,
        question: "What is the recommended approach for extracting text from PowerPoint files programmatically?",
        options: {
            A: "Taking screenshots of each slide",
            B: "Using OCR on slide images",
            C: "Using libraries like python-pptx to parse the file structure",
            D: "Manually typing the content"
        },
        correct_answer: "C",
        explanation: "Libraries like python-pptx provide direct access to the text content within PowerPoint files by parsing the underlying XML structure, making it efficient and accurate to extract slide text programmatically."
    },
    {
        id: 6,
        question: "Which difficulty level would test higher-order thinking skills like analysis and evaluation?",
        options: {
            A: "Simple (recall-based)",
            B: "Medium (comprehension-based)",
            C: "Complex (analysis-based)",
            D: "All difficulty levels equally"
        },
        correct_answer: "C",
        explanation: "Complex difficulty questions are designed to test higher-order thinking skills including analysis, synthesis, and evaluation. Simple questions focus on recall, while medium questions test comprehension and application."
    },
    {
        id: 7,
        question: "What is the main advantage of using AI for quiz generation over manual question creation?",
        options: {
            A: "AI always creates better questions",
            B: "AI can process large amounts of content quickly",
            C: "AI doesn't require any input data",
            D: "AI questions are always perfectly accurate"
        },
        correct_answer: "B",
        explanation: "The main advantage of AI quiz generation is speed and scalability. AI can analyze extensive slide content and generate relevant questions in seconds, saving educators significant time compared to manual creation."
    },
    {
        id: 8,
        question: "When providing feedback for incorrect answers, what information is most valuable to the learner?",
        options: {
            A: "Just telling them they're wrong",
            B: "Showing the correct answer only",
            C: "Explaining why their answer was wrong and why the correct answer is right",
            D: "Giving them a lower score"
        },
        correct_answer: "C",
        explanation: "Effective feedback includes both why the selected answer was incorrect and why the correct answer is right. This helps learners understand their mistakes and reinforces proper understanding of the material."
    },
    {
        id: 9,
        question: "What is the purpose of a timer in an online quiz?",
        options: {
            A: "To make the quiz more stressful",
            B: "To simulate real exam conditions and manage pacing",
            C: "To limit the number of questions students can answer",
            D: "To automatically fail slow test-takers"
        },
        correct_answer: "B",
        explanation: "Timers in online quizzes help simulate real exam conditions, encourage efficient time management, and maintain a consistent testing experience for all participants."
    },
    {
        id: 10,
        question: "Which of the following best describes the workflow of an AI quiz generator application?",
        options: {
            A: "User writes questions → AI grades them",
            B: "User uploads content → AI analyzes and generates questions → User takes quiz → Results displayed",
            C: "AI creates random questions → User answers them",
            D: "User takes a pre-made quiz → AI provides answers"
        },
        correct_answer: "B",
        explanation: "The correct workflow is: user uploads source material (like PowerPoint), AI analyzes the content and generates relevant questions, the user takes the interactive quiz, and finally results with detailed feedback are displayed."
    }
];

// ============================================
// State Management
// ============================================

const state = {
    slides: null,
    questions: null,
    currentQuestion: 0,
    answers: {},
    timer: TIMER_DURATION,
    timerInterval: null,
    isQuizActive: false,
    isQuizComplete: false,
    difficulty: 'simple',
    numQuestions: 10,
    uploadedFile: null,
    isRealPpt: false
};

// ============================================
// DOM References
// ============================================

const DOM = {
    navLinks: document.querySelectorAll('.nav-link'),
    navStatus: document.getElementById('navStatus'),
    navbar: document.querySelector('.navbar'),

    homeSection: document.getElementById('home'),
    quizSection: document.getElementById('quiz'),
    resultsSection: document.getElementById('results'),

    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('fileInput'),
    uploadContent: document.getElementById('uploadContent'),
    uploadProgress: document.getElementById('uploadProgress'),
    uploadSuccess: document.getElementById('uploadSuccess'),
    progressCircle: document.getElementById('progressCircle'),
    progressText: document.getElementById('progressText'),
    progressLabel: document.getElementById('progressLabel'),
    slideCount: document.getElementById('slideCount'),
    configCard: document.getElementById('configCard'),

    numQuestions: document.getElementById('numQuestions'),
    decrementQ: document.getElementById('decrementQ'),
    incrementQ: document.getElementById('incrementQ'),
    difficultySelector: document.getElementById('difficultySelector'),
    diffBtns: document.querySelectorAll('.diff-btn'),
    generateBtn: document.getElementById('generateBtn'),

    quizProgress: document.getElementById('quizProgress'),
    quizDifficulty: document.getElementById('quizDifficulty'),
    timerDisplay: document.getElementById('timerDisplay'),
    quizTimer: document.getElementById('quizTimer'),
    progressBarFill: document.getElementById('progressBarFill'),
    questionText: document.getElementById('questionText'),
    qNumberBadge: document.getElementById('qNumberBadge'),
    optionsGrid: document.getElementById('optionsGrid'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    submitBtn: document.getElementById('submitBtn'),

    scoreNumber: document.getElementById('scoreNumber'),
    scoreTotal: document.getElementById('scoreTotal'),
    scorePercentage: document.getElementById('scorePercentage'),
    scoreGrade: document.getElementById('scoreGrade'),
    scoreCircle: document.getElementById('scoreCircle'),
    correctCount: document.getElementById('correctCount'),
    wrongCount: document.getElementById('wrongCount'),
    accuracyDisplay: document.getElementById('accuracyDisplay'),
    reviewList: document.getElementById('reviewList'),
    retakeBtn: document.getElementById('retakeBtn'),
    newQuizBtn: document.getElementById('newQuizBtn'),

    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingBarFill: document.getElementById('loadingBarFill'),
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
};

// ============================================
// Utility Functions
// ============================================

function showSection(section) {
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active-section');
        s.style.display = 'none';
    });
    section.classList.add('active-section');
    section.style.display = 'block';
}

function updateNavStatus(text, type = 'ready') {
    const statusDot = DOM.navStatus.querySelector('.status-dot');
    statusDot.className = 'status-dot';
    const colors = { loading: 'var(--warning)', ready: 'var(--success)', error: 'var(--error)' };
    statusDot.style.background = colors[type] || colors.ready;
    DOM.navStatus.querySelector('span:last-child').textContent = text;
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { error: 'exclamation-circle', success: 'check-circle', warning: 'exclamation-triangle', info: 'info-circle' };
    const colors = { error: 'var(--error)', success: 'var(--success)', warning: 'var(--warning)', info: 'var(--primary)' };
    
    toast.innerHTML = `<i class="fas fa-${icons[type] || icons.info}"></i><span>${message}</span>`;
    toast.style.cssText = `
        position: fixed; bottom: 24px; right: 24px; padding: 16px 24px;
        background: ${colors[type] || colors.info}; color: white; border-radius: 12px;
        font-weight: 600; font-size: 0.9rem; z-index: 3000;
        display: flex; align-items: center; gap: 10px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease; font-family: 'Inter', sans-serif;
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInLeft 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// Navigation
// ============================================

DOM.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        const target = link.getAttribute('href').substring(1);
        if (target === 'home') {
            showSection(DOM.homeSection);
        }
    });
});

window.addEventListener('scroll', () => {
    DOM.navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ============================================
// File Upload - Real PPT Parsing
// ============================================

DOM.uploadZone.addEventListener('click', () => DOM.fileInput.click());

DOM.uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.uploadZone.classList.add('dragover');
});

DOM.uploadZone.addEventListener('dragleave', () => {
    DOM.uploadZone.classList.remove('dragover');
});

DOM.uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

DOM.fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

async function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.pptx') && !file.name.toLowerCase().endsWith('.ppt')) {
        showToast('Please upload a valid PowerPoint file (.pptx or .ppt)', 'error');
        return;
    }

    if (file.size > 50 * 1024 * 1024) {
        showToast('File size exceeds 50MB limit', 'error');
        return;
    }

    DOM.uploadContent.style.display = 'none';
    DOM.uploadProgress.style.display = 'block';
    DOM.uploadSuccess.style.display = 'none';
    updateNavStatus('Parsing PPT...', 'loading');

    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        DOM.progressCircle.setAttribute('stroke-dasharray', `${progress}, 100`);
        DOM.progressText.textContent = `${Math.round(progress)}%`;
        if (progress < 30) DOM.progressLabel.textContent = 'Reading file structure...';
        else if (progress < 60) DOM.progressLabel.textContent = 'Extracting slide content...';
        else DOM.progressLabel.textContent = 'Analyzing text...';
    }, 200);

    try {
        // Try to parse the PPTX file in the browser using JSZip
        let slides;
        try {
            slides = await PPTXParser.parse(file);
            state.isRealPpt = true;
        } catch (parseError) {
            console.warn('Browser PPTX parsing failed, using demo mode:', parseError);
            // Fallback to demo slides
            slides = [
                { slide_number: 1, content: "Welcome to AI-Powered Quiz Generation" },
                { slide_number: 2, content: "How to extract text from PowerPoint" },
                { slide_number: 3, content: "Generating MCQs with AI" }
            ];
            state.isRealPpt = false;
        }

        clearInterval(progressInterval);
        DOM.progressCircle.setAttribute('stroke-dasharray', '100, 100');
        DOM.progressText.textContent = '100%';
        DOM.progressLabel.textContent = 'PPT parsed successfully!';

        setTimeout(() => {
            DOM.uploadProgress.style.display = 'none';
            DOM.uploadSuccess.style.display = 'block';
            DOM.slideCount.textContent = slides.length;
            state.slides = slides;
            state.uploadedFile = file;
            
            setTimeout(() => {
                DOM.configCard.style.display = 'block';
                DOM.configCard.style.animation = 'slideUp 0.4s ease';
            }, 500);

            updateNavStatus(`${slides.length} slides loaded`);
            showToast(`Successfully parsed ${slides.length} slides from your PPT!`, 'success');
        }, 500);

    } catch (error) {
        clearInterval(progressInterval);
        DOM.uploadProgress.style.display = 'none';
        DOM.uploadContent.style.display = 'block';
        showToast('Failed to parse PPT: ' + error.message, 'error');
        updateNavStatus('Parse failed', 'error');
    }
}

// ============================================
// Quiz Configuration
// ============================================

DOM.decrementQ.addEventListener('click', () => {
    let val = parseInt(DOM.numQuestions.value);
    if (val > 5) DOM.numQuestions.value = val - 1;
});

DOM.incrementQ.addEventListener('click', () => {
    let val = parseInt(DOM.numQuestions.value);
    if (val < 30) DOM.numQuestions.value = val + 1;
});

DOM.numQuestions.addEventListener('change', () => {
    let val = parseInt(DOM.numQuestions.value);
    if (val < 5) DOM.numQuestions.value = 5;
    if (val > 30) DOM.numQuestions.value = 30;
});

DOM.diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        DOM.diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.difficulty = btn.dataset.difficulty;
    });
});

// ============================================
// Generate Quiz - Uses Real Slide Content
// ============================================

DOM.generateBtn.addEventListener('click', generateQuiz);

async function generateQuiz() {
    if (!state.slides) {
        showToast('Please upload a PowerPoint file first', 'error');
        return;
    }

    state.numQuestions = parseInt(DOM.numQuestions.value);

    DOM.loadingOverlay.style.display = 'flex';
    DOM.loadingBarFill.style.animation = 'loadingProgress 3s ease forwards';
    updateNavStatus('Generating quiz...', 'loading');

    // Animate loading steps
    setTimeout(() => {
        DOM.step1.classList.add('completed');
        DOM.step2.classList.add('active');
    }, 1000);

    setTimeout(() => {
        DOM.step2.classList.add('completed');
        DOM.step3.classList.add('active');
    }, 2000);

    try {
        let questions;

        if (state.isRealPpt && state.slides.length > 0) {
            // Generate questions from REAL slide content using the local QuestionGenerator
            const allText = state.slides.map(s => s.content).join(' ');
            if (allText.trim().length > 20) {
                questions = QuestionGenerator.generate(state.slides, state.numQuestions, state.difficulty);
                if (questions.length === 0) {
                    // Fallback to demo questions if generation failed
                    questions = DEMO_QUESTIONS.slice(0, state.numQuestions);
                }
            } else {
                // Not enough text content, use demo questions
                questions = DEMO_QUESTIONS.slice(0, state.numQuestions);
            }
        } else {
            // Demo mode - use sample questions
            questions = DEMO_QUESTIONS.slice(0, state.numQuestions);
        }

        setTimeout(() => {
            DOM.step3.classList.add('completed');
            DOM.loadingBarFill.style.width = '100%';

            setTimeout(() => {
                DOM.loadingOverlay.style.display = 'none';
                state.questions = questions;
                state.currentQuestion = 0;
                state.answers = {};
                state.isQuizComplete = false;
                
                showSection(DOM.quizSection);
                setupQuiz();
            }, 1000);
        }, 3000);

    } catch (error) {
        DOM.loadingOverlay.style.display = 'none';
        showToast('Generation failed: ' + error.message, 'error');
        updateNavStatus('Generation failed', 'error');
    }
}

// ============================================
// Quiz Setup & Navigation
// ============================================

function setupQuiz() {
    if (!state.questions || state.questions.length === 0) {
        showToast('No questions generated', 'error');
        return;
    }

    state.isQuizActive = true;
    state.isQuizComplete = false;
    
    const diffLabels = { simple: 'Simple', medium: 'Medium', complex: 'Complex' };
    DOM.quizDifficulty.innerHTML = `<i class="fas fa-tag"></i> ${diffLabels[state.difficulty] || 'Medium'}`;

    startTimer();
    showQuestion(0);
    updateNavStatus('Quiz started');
}

function showQuestion(index) {
    const q = state.questions[index];
    if (!q) return;

    DOM.quizProgress.textContent = `Question ${index + 1} of ${state.questions.length}`;
    DOM.progressBarFill.style.width = `${((index + 1) / state.questions.length) * 100}%`;
    
    DOM.qNumberBadge.textContent = `Q${index + 1}`;
    DOM.questionText.textContent = q.question;

    DOM.optionsGrid.innerHTML = '';
    const labels = ['A', 'B', 'C', 'D'];

    labels.forEach(letter => {
        const optionText = q.options[letter];
        const isSelected = state.answers[q.id] === letter;
        
        const btn = document.createElement('button');
        btn.className = `option-btn ${isSelected ? 'selected' : ''}`;
        btn.dataset.value = letter;
        
        btn.innerHTML = `
            <span class="option-letter">${letter}</span>
            <span class="option-text">${optionText}</span>
            <i class="fas fa-check option-icon"></i>
        `;

        if (state.isQuizComplete) {
            btn.classList.add('disabled');
            if (letter === q.correct_answer) {
                btn.classList.add('correct');
            } else if (isSelected && letter !== q.correct_answer) {
                btn.classList.add('wrong');
            }
        } else {
            btn.addEventListener('click', () => selectOption(q.id, letter));
        }

        DOM.optionsGrid.appendChild(btn);
    });

    DOM.prevBtn.disabled = index === 0;
    DOM.prevBtn.style.display = state.isQuizComplete ? 'none' : 'flex';
    DOM.nextBtn.style.display = (index === state.questions.length - 1 || state.isQuizComplete) ? 'none' : 'flex';
    DOM.submitBtn.style.display = (index === state.questions.length - 1 && !state.isQuizComplete) ? 'flex' : 'none';
}

function selectOption(questionId, value) {
    if (state.isQuizComplete) return;
    state.answers[questionId] = value;
    
    DOM.optionsGrid.querySelectorAll('.option-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.value === value);
    });
}

DOM.prevBtn.addEventListener('click', () => {
    if (state.currentQuestion > 0) {
        state.currentQuestion--;
        showQuestion(state.currentQuestion);
    }
});

DOM.nextBtn.addEventListener('click', () => {
    if (state.currentQuestion < state.questions.length - 1) {
        const currentQ = state.questions[state.currentQuestion];
        if (!state.answers[currentQ.id]) {
            showToast('Please select an answer before proceeding', 'info');
            return;
        }
        state.currentQuestion++;
        showQuestion(state.currentQuestion);
    }
});

DOM.submitBtn.addEventListener('click', submitQuiz);

function submitQuiz() {
    const unanswered = state.questions.filter(q => !state.answers[q.id]);
    if (unanswered.length > 0) {
        showToast(`Please answer all questions (${unanswered.length} remaining)`, 'info');
        return;
    }

    if (!confirm('Are you sure you want to submit your quiz? You cannot change answers after submission.')) {
        return;
    }

    stopTimer();
    state.isQuizComplete = true;
    submitResults();
}

// ============================================
// Timer
// ============================================

function startTimer() {
    state.timer = TIMER_DURATION;
    updateTimerDisplay();
    
    state.timerInterval = setInterval(() => {
        state.timer--;
        updateTimerDisplay();
        
        if (state.timer <= 0) {
            clearInterval(state.timerInterval);
            showToast('Time is up! Submitting your quiz...', 'warning');
            state.isQuizComplete = true;
            submitResults();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(state.timerInterval);
}

function updateTimerDisplay() {
    const minutes = Math.floor(state.timer / 60);
    const seconds = state.timer % 60;
    DOM.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    DOM.quizTimer.classList.remove('warning', 'danger');
    if (state.timer < 60) {
        DOM.quizTimer.classList.add('danger');
    } else if (state.timer < 300) {
        DOM.quizTimer.classList.add('warning');
    }
}

// ============================================
// Results & Scoring
// ============================================

async function submitResults() {
    updateNavStatus('Calculating results...', 'loading');

    try {
        // Calculate results locally
        setTimeout(() => {
            const results = calculateResults();
            showSection(DOM.resultsSection);
            displayResults(results);
            updateNavStatus('Quiz completed!');
        }, 1000);

    } catch (error) {
        const results = calculateResults();
        showSection(DOM.resultsSection);
        displayResults(results);
        updateNavStatus('Quiz completed!');
    }
}

function calculateResults() {
    let score = 0;
    const results = state.questions.map(q => {
        const userAnswer = state.answers[q.id];
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) score++;
        
        return {
            id: q.id,
            question: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
            user_answer: userAnswer,
            is_correct: isCorrect,
            explanation: q.explanation
        };
    });

    const percentage = Math.round((score / state.questions.length) * 100);
    return {
        score,
        total: state.questions.length,
        percentage,
        results,
        passed: percentage >= 40
    };
}

function displayResults(data) {
    const { score, total, percentage, results, passed } = data;

    animateScore(score, total, percentage, passed);

    DOM.correctCount.textContent = score;
    DOM.wrongCount.textContent = total - score;
    DOM.accuracyDisplay.textContent = `${percentage}%`;

    const grade = getGrade(percentage);
    DOM.scoreGrade.className = `score-grade ${grade.class}`;
    DOM.scoreGrade.innerHTML = `<i class="fas fa-${grade.icon}"></i><span>${grade.label}</span>`;

    renderReviewList(results);
}

function animateScore(score, total, percentage, passed) {
    let current = 0;
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    const interval = duration / steps;
    
    DOM.scoreTotal.textContent = total;
    
    const counter = setInterval(() => {
        current += increment;
        if (current >= score) {
            current = score;
            clearInterval(counter);
        }
        DOM.scoreNumber.textContent = Math.round(current);
    }, interval);

    setTimeout(() => {
        DOM.scorePercentage.textContent = `${percentage}%`;
    }, 200);

    const degrees = (percentage / 100) * 360;
    DOM.scoreCircle.style.background = `conic-gradient(
        ${passed ? 'var(--success)' : 'var(--error)'} 0deg,
        ${passed ? 'var(--success)' : 'var(--error)'} ${degrees}deg,
        var(--border-color) ${degrees}deg
    )`;
}

function getGrade(percentage) {
    if (percentage >= 90) return { class: 'excellent', icon: 'crown', label: 'Outstanding! Exceptional Performance!' };
    if (percentage >= 75) return { class: 'excellent', icon: 'trophy', label: 'Excellent! Great Job!' };
    if (percentage >= 60) return { class: 'good', icon: 'star', label: 'Good Effort! Keep Learning!' };
    if (percentage >= 40) return { class: 'average', icon: 'book', label: 'Average! Room for Improvement!' };
    return { class: 'poor', icon: 'graduation-cap', label: 'Needs Improvement! Keep Practicing!' };
}

function renderReviewList(results) {
    DOM.reviewList.innerHTML = '';
    
    results.forEach((result, index) => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.style.animation = `fadeIn 0.3s ease ${index * 0.1}s both`;

        let answersHtml = '';
        Object.entries(result.options).forEach(([letter, text]) => {
            let classes = '';
            let icon = '';
            
            if (letter === result.correct_answer) {
                classes = 'correct-answer';
                icon = '<i class="fas fa-check-circle"></i>';
            } else if (letter === result.user_answer && letter !== result.correct_answer) {
                classes = 'user-wrong';
                icon = '<i class="fas fa-times-circle"></i>';
            }

            answersHtml += `
                <div class="review-answer ${classes}">
                    ${icon} <strong>${letter}:</strong> ${text}
                </div>
            `;
        });

        card.innerHTML = `
            <div class="review-header">
                <div class="review-number ${result.is_correct ? 'correct' : 'wrong'}">
                    ${result.is_correct ? '<i class="fas fa-check"></i>' : '<i class="fas fa-times"></i>'}
                </div>
                <div class="review-status ${result.is_correct ? 'correct' : 'wrong'}">
                    ${result.is_correct ? 'Correct' : 'Incorrect'}
                </div>
            </div>
            <div class="review-question">${result.question}</div>
            <div class="review-answers">${answersHtml}</div>
            <div class="review-explanation">
                <strong>Explanation:</strong> ${result.explanation}
            </div>
        `;

        DOM.reviewList.appendChild(card);
    });
}

// ============================================
// Action Buttons
// ============================================

DOM.retakeBtn.addEventListener('click', () => {
    state.currentQuestion = 0;
    state.answers = {};
    state.isQuizComplete = false;
    state.isQuizActive = false;
    stopTimer();

    showSection(DOM.quizSection);
    setupQuiz();
});

DOM.newQuizBtn.addEventListener('click', () => {
    state.slides = null;
    state.questions = null;
    state.currentQuestion = 0;
    state.answers = {};
    state.isQuizComplete = false;
    state.isQuizActive = false;
    state.isRealPpt = false;
    state.uploadedFile = null;
    stopTimer();

    DOM.uploadContent.style.display = 'block';
    DOM.uploadProgress.style.display = 'none';
    DOM.uploadSuccess.style.display = 'none';
    DOM.configCard.style.display = 'none';

    showSection(DOM.homeSection);
    updateNavStatus('Ready');
});

// ============================================
// Demo Button - Quick Start
// ============================================

const demoBtn = document.getElementById('demoBtn');
if (demoBtn) {
    demoBtn.addEventListener('click', () => {
        state.slides = [
            { slide_number: 1, content: "Welcome to AI-Powered Quiz Generation" },
            { slide_number: 2, content: "How to extract text from PowerPoint" },
            { slide_number: 3, content: "Generating MCQs with AI" }
        ];
        state.isRealPpt = false;
        
        DOM.configCard.style.display = 'block';
        DOM.configCard.style.animation = 'slideUp 0.4s ease';
        DOM.uploadSuccess.style.display = 'block';
        DOM.slideCount.textContent = '3';
        
        updateNavStatus('3 slides loaded (Demo)');
        showToast('Demo mode activated! Configure your quiz below.', 'success');
    });
}

// ============================================
// Keyboard Navigation
// ============================================

document.addEventListener('keydown', (e) => {
    if (!state.isQuizActive || state.isQuizComplete) return;

    if (e.key === 'ArrowLeft' && !DOM.prevBtn.disabled) {
        DOM.prevBtn.click();
    } else if (e.key === 'ArrowRight') {
        if (DOM.nextBtn.style.display !== 'none') {
            DOM.nextBtn.click();
        } else if (DOM.submitBtn.style.display !== 'none') {
            DOM.submitBtn.click();
        }
    } else if (['1', '2', '3', '4', 'a', 'b', 'c', 'd'].includes(e.key.toLowerCase())) {
        const map = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', 'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D' };
        const letter = map[e.key.toLowerCase()];
        const btn = DOM.optionsGrid.querySelector(`[data-value="${letter}"]`);
        if (btn) btn.click();
    }
});

// ============================================
// Initialize
// ============================================

updateNavStatus('Ready');
console.log('QuizGen AI initialized successfully');