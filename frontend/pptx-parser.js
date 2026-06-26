/**
 * PPTX Parser - Extracts text from PowerPoint files in the browser
 * Uses JSZip to parse the PPTX (ZIP) format and extract slide text
 */

const PPTXParser = {
    /**
     * Parse a PPTX file and extract text from all slides
     * @param {File} file - The .pptx file to parse
     * @returns {Promise<Array>} Array of slide objects with slide_number and content
     */
    parse: async function(file) {
        // Load JSZip dynamically
        const JSZip = await this.loadJSZip();
        const zip = await JSZip.loadAsync(file);
        
        const slides = [];
        const slideFiles = [];
        
        // Find all slide files in the PPTX
        zip.forEach((path, entry) => {
            if (path.match(/^ppt\/slides\/slide\d+\.xml$/)) {
                slideFiles.push(path);
            }
        });
        
        // Sort slides by number
        slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });
        
        // Extract text from each slide
        for (const slidePath of slideFiles) {
            const slideNum = parseInt(slidePath.match(/\d+/)[0]);
            const content = await zip.file(slidePath).async('string');
            const text = this.extractTextFromSlideXML(content);
            
            if (text.trim()) {
                slides.push({
                    slide_number: slideNum,
                    content: text.trim()
                });
            }
        }
        
        return slides;
    },
    
    /**
     * Load JSZip library dynamically
     */
    loadJSZip: function() {
        return new Promise((resolve, reject) => {
            if (window.JSZip) {
                resolve(window.JSZip);
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => resolve(window.JSZip);
            script.onerror = () => reject(new Error('Failed to load JSZip library'));
            document.head.appendChild(script);
        });
    },
    
    /**
     * Extract text content from slide XML
     */
    extractTextFromSlideXML: function(xml) {
        // Extract text from <a:t> tags (text elements in PowerPoint XML)
        const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
        const texts = textMatches.map(match => {
            const content = match.replace(/<a:t[^>]*>/, '').replace('</a:t>', '');
            return content.trim();
        });
        
        return texts.join(' ');
    }
};

/**
 * Local Question Generator - Creates MCQs from extracted slide content
 */
const QuestionGenerator = {
    /**
     * Generate questions from slide content
     * @param {Array} slides - Array of slide objects
     * @param {number} numQuestions - Number of questions to generate
     * @param {string} difficulty - 'simple', 'medium', or 'complex'
     * @returns {Array} Array of question objects
     */
    generate: function(slides, numQuestions, difficulty) {
        // Combine all slide text
        const allText = slides.map(s => s.content).join(' ');
        const sentences = this.extractSentences(allText);
        const keywords = this.extractKeywords(allText);
        const keyPhrases = this.extractKeyPhrases(allText);
        
        const questions = [];
        const usedSentences = new Set();
        
        // Generate questions based on difficulty
        for (let i = 0; i < numQuestions && i < sentences.length; i++) {
            const sentence = sentences[i];
            if (!sentence || sentence.length < 20 || usedSentences.has(sentence)) {
                // Try to use a keyword-based question instead
                if (keywords.length > 0) {
                    const kw = keywords[i % keywords.length];
                    const question = this.createKeywordQuestion(kw, allText, difficulty);
                    if (question) {
                        question.id = questions.length + 1;
                        questions.push(question);
                        continue;
                    }
                }
                continue;
            }
            
            usedSentences.add(sentence);
            const question = this.createQuestionFromSentence(sentence, allText, difficulty, i);
            if (question) {
                question.id = questions.length + 1;
                questions.push(question);
            }
        }
        
        // If we don't have enough questions, create more from keywords
        while (questions.length < numQuestions && keywords.length > 0) {
            const kwIndex = questions.length % keywords.length;
            const kw = keywords[kwIndex];
            const question = this.createKeywordQuestion(kw, allText, difficulty);
            if (question) {
                question.id = questions.length + 1;
                // Check for duplicate
                const isDuplicate = questions.some(q => q.question === question.question);
                if (!isDuplicate) {
                    questions.push(question);
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        return questions;
    },
    
    /**
     * Extract sentences from text
     */
    extractSentences: function(text) {
        // Split by sentence endings
        const raw = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
        // Shuffle for variety
        return this.shuffle(raw.map(s => s.trim()));
    },
    
    /**
     * Extract important keywords from text
     */
    extractKeywords: function(text) {
        const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        const stopWords = new Set([
            'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they',
            'their', 'will', 'would', 'could', 'should', 'about', 'which',
            'when', 'where', 'what', 'there', 'into', 'over', 'such', 'only',
            'other', 'than', 'then', 'also', 'very', 'just', 'because', 'these',
            'those', 'them', 'some', 'each', 'more', 'most', 'much', 'many',
            'after', 'before', 'between', 'through', 'during', 'without',
            'within', 'along', 'following', 'including', 'until', 'while',
            'first', 'second', 'third', 'last', 'next', 'another', 'still',
            'often', 'always', 'never', 'sometimes', 'usually', 'however',
            'although', 'though', 'while', 'since', 'until', 'because', 'slide',
            'content', 'text', 'page', 'number', 'title', 'section', 'chapter'
        ]);
        
        const wordFreq = {};
        words.forEach(w => {
            if (!stopWords.has(w) && w.length > 3) {
                wordFreq[w] = (wordFreq[w] || 0) + 1;
            }
        });
        
        // Sort by frequency and return top keywords
        return Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(entry => entry[0]);
    },
    
    /**
     * Extract key phrases (2-3 word combinations)
     */
    extractKeyPhrases: function(text) {
        const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        const phrases = [];
        
        for (let i = 0; i < words.length - 1; i++) {
            if (words[i].length > 3 && words[i+1].length > 3) {
                phrases.push(`${words[i]} ${words[i+1]}`);
            }
        }
        
        const phraseFreq = {};
        phrases.forEach(p => {
            phraseFreq[p] = (phraseFreq[p] || 0) + 1;
        });
        
        return Object.entries(phraseFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(entry => entry[0]);
    },
    
    /**
     * Create a question from a sentence
     */
    createQuestionFromSentence: function(sentence, allText, difficulty, index) {
        const words = sentence.split(' ');
        if (words.length < 4) return null;
        
        // Find a key term to ask about
        const keyTerms = words.filter(w => w.length > 4);
        if (keyTerms.length === 0) return null;
        
        const term = keyTerms[index % keyTerms.length];
        const cleanTerm = term.replace(/[^a-zA-Z]/g, '');
        if (cleanTerm.length < 3) return null;
        
        // Create question based on difficulty
        let question, correctAnswer, explanation;
        
        if (difficulty === 'simple') {
            // Simple: Direct recall
            question = `According to the presentation, what is mentioned about "${cleanTerm}"?`;
            correctAnswer = this.extractContext(sentence, cleanTerm);
            explanation = `The presentation states: "${sentence.substring(0, 100)}..."`;
        } else if (difficulty === 'medium') {
            // Medium: Comprehension
            question = `Based on the slide content, which statement best describes "${cleanTerm}"?`;
            correctAnswer = this.extractContext(sentence, cleanTerm);
            explanation = `This is explained in the context of: "${sentence.substring(0, 120)}..."`;
        } else {
            // Complex: Analysis
            question = `From the presentation material, what can be inferred about "${cleanTerm}"?`;
            correctAnswer = this.extractContext(sentence, cleanTerm);
            explanation = `The presentation provides context: "${sentence.substring(0, 150)}..."`;
        }
        
        if (!correctAnswer || correctAnswer.length < 5) return null;
        
        // Generate distractors
        const distractors = this.generateDistractors(correctAnswer, allText, cleanTerm);
        if (distractors.length < 3) return null;
        
        // Shuffle options
        const options = {
            A: correctAnswer,
            B: distractors[0],
            C: distractors[1],
            D: distractors[2]
        };
        
        const letters = ['A', 'B', 'C', 'D'];
        const shuffled = this.shuffle(letters);
        const correctLetter = shuffled[0];
        
        const shuffledOptions = {};
        shuffled.forEach((letter, i) => {
            shuffledOptions[letter] = options[letters[i]];
        });
        
        return {
            question,
            options: shuffledOptions,
            correct_answer: correctLetter,
            explanation: explanation.substring(0, 200)
        };
    },
    
    /**
     * Create a question based on a keyword
     */
    createKeywordQuestion: function(keyword, allText, difficulty) {
        // Find sentences containing this keyword
        const sentences = this.extractSentences(allText);
        const relevantSentences = sentences.filter(s => 
            s.toLowerCase().includes(keyword)
        );
        
        if (relevantSentences.length === 0) return null;
        
        const sentence = relevantSentences[0];
        const context = this.extractContext(sentence, keyword);
        
        if (!context || context.length < 5) return null;
        
        const question = `What does the presentation say about "${keyword}"?`;
        const distractors = this.generateDistractors(context, allText, keyword);
        
        if (distractors.length < 3) return null;
        
        const options = { A: context, B: distractors[0], C: distractors[1], D: distractors[2] };
        const letters = ['A', 'B', 'C', 'D'];
        const shuffled = this.shuffle(letters);
        const correctLetter = shuffled[0];
        
        const shuffledOptions = {};
        shuffled.forEach((letter, i) => {
            shuffledOptions[letter] = options[letters[i]];
        });
        
        return {
            question,
            options: shuffledOptions,
            correct_answer: correctLetter,
            explanation: `Based on the presentation: "${sentence.substring(0, 200)}"`
        };
    },
    
    /**
     * Extract context around a term in a sentence
     */
    extractContext: function(sentence, term) {
        const lower = sentence.toLowerCase();
        const termLower = term.toLowerCase();
        const idx = lower.indexOf(termLower);
        
        if (idx === -1) {
            // Return a meaningful part of the sentence
            const words = sentence.split(' ');
            if (words.length > 8) {
                return words.slice(0, 8).join(' ') + '...';
            }
            return sentence;
        }
        
        // Extract a phrase around the term
        const start = Math.max(0, idx - 30);
        const end = Math.min(sentence.length, idx + term.length + 40);
        let phrase = sentence.substring(start, end).trim();
        
        if (start > 0) phrase = '...' + phrase;
        if (end < sentence.length) phrase = phrase + '...';
        
        return phrase;
    },
    
    /**
     * Generate plausible distractors
     */
    generateDistractors: function(correctAnswer, allText, keyword) {
        const sentences = this.extractSentences(allText);
        const distractors = [];
        const used = new Set([correctAnswer.toLowerCase()]);
        
        // Find other sentences that could serve as distractors
        for (const s of sentences) {
            if (distractors.length >= 3) break;
            
            const lower = s.toLowerCase();
            if (!used.has(lower) && !lower.includes(keyword)) {
                const text = s.length > 60 ? s.substring(0, 60) + '...' : s;
                if (text.length > 10 && !used.has(text.toLowerCase())) {
                    distractors.push(text);
                    used.add(text.toLowerCase());
                }
            }
        }
        
        // If we don't have enough, create generic distractors
        const genericDistractors = [
            `This concept is not directly addressed in the presentation slides.`,
            `The presentation does not provide specific information about this topic.`,
            `This is a common misconception not supported by the slide content.`,
            `The slides reference this only in passing without detailed explanation.`,
            `This interpretation conflicts with the information presented in the slides.`
        ];
        
        while (distractors.length < 3) {
            const gd = genericDistractors[distractors.length % genericDistractors.length];
            if (!used.has(gd.toLowerCase())) {
                distractors.push(gd);
                used.add(gd.toLowerCase());
            }
        }
        
        return distractors;
    },
    
    /**
     * Shuffle an array (Fisher-Yates)
     */
    shuffle: function(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
};