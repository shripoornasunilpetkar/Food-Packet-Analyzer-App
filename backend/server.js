require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

// Validate API key
if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    process.exit(1);
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('Gemini API initialized successfully');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Routes
app.post('/api/scan', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Initialize Tesseract worker
        const worker = await createWorker();
        
        // Perform OCR
        const { data: { text } } = await worker.recognize(req.file.path);
        await worker.terminate();

        // Analyze text with OpenAI
        const analysis = await analyzeIngredients(text);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            text,
            analysis
        });
    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Error processing image' });
    }
});

// Function to analyze ingredients using Gemini API
async function analyzeIngredients(text) {
    try {
        console.log('Starting Gemini analysis with text:', text.substring(0, 100) + '...');
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.0-flash",
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            }
        });
        
        const prompt = `You are a food safety expert. Analyze the following ingredients list and provide a structured response with these exact sections. Use clean formatting without any markdown or special characters:

1) Harmful Ingredients
- List each harmful ingredient with a dash (-) followed by its description
- Include artificial additives, preservatives, and potentially harmful substances
- Do not use any special characters or markdown formatting

2) Who Should Avoid
- List each group that should avoid this product with a dash (-) followed by the reason
- Include people with allergies, dietary restrictions, or health conditions
- Do not use any special characters or markdown formatting

3) Health Score (1-10)
- Provide a single number score
- Consider nutritional value, additives, and potential health impacts

4) Long-term Health Risks
- List each risk with a dash (-) followed by its description
- Include potential chronic health issues or cumulative effects
- Do not use any special characters or markdown formatting

Analyze these ingredients and provide a health assessment:
${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysisText = response.text();
        
        console.log('Gemini API response received:', analysisText);
        return analysisText;
    } catch (error) {
        console.error('Detailed Gemini API Error:', {
            message: error.message,
            stack: error.stack,
            response: error.response
        });
        throw error;
    }
}

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Handle image analysis
app.post('/analyze', async (req, res) => {
    try {
        const { image } = req.body;
        
        if (!image) {
            return res.status(400).json({ 
                error: 'No image provided',
                message: 'Please upload a valid image of a food package'
            });
        }

        console.log('Processing image...');
        
        // Initialize Tesseract worker
        const worker = await createWorker();
        
        // Convert base64 to buffer
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const tempPath = path.join(uploadDir, `temp_${Date.now()}.jpg`);
        
        // Save temporary file
        fs.writeFileSync(tempPath, buffer);
        
        // Perform OCR
        console.log('Running OCR...');
        const { data: { text } } = await worker.recognize(tempPath);
        await worker.terminate();

        // Clean up temporary file
        fs.unlinkSync(tempPath);

        // Check if text was extracted
        if (!text || text.trim().length === 0) {
            return res.status(400).json({
                error: 'No text found',
                message: 'Please upload a clear image of a food package with visible ingredients'
            });
        }

        console.log('Extracted text:', text.substring(0, 100) + '...');

        try {
            // Analyze text with OpenAI
            const analysis = await analyzeIngredients(text);

            // Parse the analysis into structured data
            const result = parseAnalysis(analysis);

            res.json(result);
        } catch (apiError) {
            console.error('API Error Details:', {
                message: apiError.message,
                status: apiError.status,
                type: apiError.type
            });
            
            // Handle specific API errors
            if (apiError.message.includes('API credits exceeded')) {
                return res.status(503).json({
                    error: 'Service temporarily unavailable',
                    message: 'Our analysis service is currently unavailable. Please try again later.'
                });
            }
            
            if (apiError.message.includes('Authentication')) {
                return res.status(500).json({
                    error: 'Authentication error',
                    message: 'There was an issue with the API authentication. Please contact support.'
                });
            }
            
            // For other API errors, return a more specific message
            return res.status(500).json({
                error: 'Analysis service error',
                message: apiError.message || 'We encountered an issue with our analysis service. Please try again later.'
            });
        }
    } catch (error) {
        console.error('Error analyzing image:', error);
        
        // Handle specific error types
        if (error.message.includes('ENOENT')) {
            return res.status(500).json({
                error: 'File system error',
                message: 'Failed to process the image. Please try again.'
            });
        }
        
        // Generic error response
        res.status(500).json({ 
            error: 'Analysis failed',
            message: 'Failed to analyze the image. Please try again with a clearer image.'
        });
    }
});

// Helper function to parse OpenAI analysis into structured data
function parseAnalysis(analysis) {
    // Default structure if parsing fails
    const defaultResult = {
        healthScore: 0,
        healthRating: "Unknown",
        riskLevel: "Unknown",
        harmfulIngredients: [],
        warnings: [],
        longTermRisks: []
    };

    try {
        // Split the analysis into sections
        const sections = analysis.split(/\d+\)/).filter(section => section.trim());
        const result = { ...defaultResult };

        sections.forEach(section => {
            const trimmedSection = section.trim();
            
            // Extract health score
            if (trimmedSection.toLowerCase().includes('health score')) {
                const scoreMatch = trimmedSection.match(/\d+/);
                if (scoreMatch) {
                    result.healthScore = parseInt(scoreMatch[0]);
                    result.healthRating = getHealthRating(result.healthScore);
                    result.riskLevel = getRiskLevel(result.healthScore);
                }
            }
            
            // Extract harmful ingredients
            if (trimmedSection.toLowerCase().includes('harmful ingredients')) {
                const ingredients = [];
                const lines = trimmedSection.split('\n');
                lines.forEach(line => {
                    const trimmedLine = line.trim().replace(/[*_]/g, ''); // Remove markdown characters
                    if (trimmedLine && !trimmedLine.toLowerCase().includes('harmful ingredients')) {
                        if (trimmedLine.includes('-')) {
                            const [name, description] = trimmedLine.split('-').map(s => s.trim());
                            ingredients.push({ name, severity: determineSeverity(description), description });
                        } else if (trimmedLine.length > 0) {
                            ingredients.push({ name: trimmedLine, severity: 'Low', description: 'Potential concern' });
                        }
                    }
                });
                result.harmfulIngredients = ingredients;
            }
            
            // Extract who should avoid
            if (trimmedSection.toLowerCase().includes('who should avoid')) {
                const warnings = [];
                const lines = trimmedSection.split('\n');
                lines.forEach(line => {
                    const trimmedLine = line.trim().replace(/[*_]/g, ''); // Remove markdown characters
                    if (trimmedLine && !trimmedLine.toLowerCase().includes('who should avoid')) {
                        if (trimmedLine.includes('-')) {
                            const [group, description] = trimmedLine.split('-').map(s => s.trim());
                            warnings.push({ group, description });
                        } else if (trimmedLine.length > 0) {
                            warnings.push({ group: trimmedLine, description: 'Should avoid this product' });
                        }
                    }
                });
                result.warnings = warnings;
            }
            
            // Extract long-term health risks
            if (trimmedSection.toLowerCase().includes('long-term health risks')) {
                const risks = [];
                const lines = trimmedSection.split('\n');
                lines.forEach(line => {
                    const trimmedLine = line.trim().replace(/[*_]/g, ''); // Remove markdown characters
                    if (trimmedLine && !trimmedLine.toLowerCase().includes('long-term health risks')) {
                        if (trimmedLine.includes('-')) {
                            const [name, description] = trimmedLine.split('-').map(s => s.trim());
                            risks.push({ name, severity: determineSeverity(description), description });
                        } else if (trimmedLine.length > 0) {
                            risks.push({ name: trimmedLine, severity: 'Low', description: 'Potential long-term risk' });
                        }
                    }
                });
                result.longTermRisks = risks;
            }
        });

        // Calculate summary counts
        result.totalHarmful = result.harmfulIngredients.length;
        result.criticalIngredients = result.harmfulIngredients.filter(i => i.severity === 'Critical').length;
        result.highRiskGroups = result.warnings.length;
        result.criticalRisks = result.longTermRisks.filter(r => r.severity === 'Critical').length;

        return result;
    } catch (error) {
        console.error('Error parsing analysis:', error);
        return defaultResult;
    }
}

// Helper functions for parsing
function getHealthRating(score) {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Fair";
    return "Poor";
}

function getRiskLevel(score) {
    if (score >= 8) return "Low";
    if (score >= 6) return "Moderate";
    if (score >= 4) return "High";
    return "Critical";
}

function extractIngredients(section) {
    const ingredients = [];
    const lines = section.split('\n');
    lines.forEach(line => {
        if (line.includes('-')) {
            const [name, description] = line.split('-').map(s => s.trim());
            const severity = determineSeverity(description);
            ingredients.push({ name, severity, description });
        }
    });
    return ingredients;
}

function extractWarnings(section) {
    const warnings = [];
    const lines = section.split('\n');
    lines.forEach(line => {
        if (line.includes('-')) {
            const [group, description] = line.split('-').map(s => s.trim());
            warnings.push({ group, description });
        }
    });
    return warnings;
}

function extractRisks(section) {
    const risks = [];
    const lines = section.split('\n');
    lines.forEach(line => {
        if (line.includes('-')) {
            const [name, description] = line.split('-').map(s => s.trim());
            const severity = determineSeverity(description);
            risks.push({ name, severity, description });
        }
    });
    return risks;
}

function determineSeverity(description) {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes('critical') || lowerDesc.includes('severe') || lowerDesc.includes('cancer')) {
        return "Critical";
    }
    if (lowerDesc.includes('moderate') || lowerDesc.includes('medium')) {
        return "Moderate";
    }
    return "Low";
}

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 