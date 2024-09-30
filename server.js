const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

const upload = multer();

// In-memory storage for resumes (replace with a database in a real application)
const resumes = {};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/build', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'resumebuilder.html'));
});

app.post('/submit-resume', upload.single('profileImage'), (req, res) => {
    const { username, fullName, email, summary, skills, experience } = req.body;
    const profileImage = null; // For now, we're not handling file uploads
    resumes[username] = { fullName, email, summary, skills, experience, profileImage };
    res.redirect(`/${username}/resume.html`);
});

app.get('/:username/resume.html', (req, res) => {
    const username = req.params.username;
    const resume = resumes[username];
    
    if (!resume) {
        return res.status(404).send('Resume not found');
    }

    const resumeHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${resume.fullName}'s Resume</title>
            <link rel="stylesheet" href="/static/style.css">
        </head>
        <body>
            <nav>
                <ul>
                    <li><a href="/">Home</a></li>
                    <li><a href="/build">Build Resume</a></li>
                </ul>
            </nav>
            <div class="container">
                <h1>${resume.fullName}'s Resume</h1>
                <div class="section">
                    <h2>Contact</h2>
                    <p>Email: ${resume.email}</p>
                </div>
                <div class="section">
                    <h2>Summary</h2>
                    <p>${resume.summary}</p>
                </div>
                <div class="section">
                    <h2>Skills</h2>
                    <p>${resume.skills}</p>
                </div>
                <div class="section">
                    <h2>Experience</h2>
                    <p>${resume.experience}</p>
                </div>
                <a href="/${username}/edit" class="edit-button">Edit Resume</a>
                <a href="/${username}/download-pdf" class="download-button">Download PDF</a>
            </div>
        </body>
        </html>
    `;
    res.send(resumeHTML); 
});

app.get('/:username/edit', (req, res) => {
    const username = req.params.username;
    const resume = resumes[username];
    
    if (!resume) {
        return res.status(404).send('Resume not found');
    }

    res.sendFile(path.join(__dirname, 'public', 'editresume.html'));
});

app.post('/:username/update', upload.single('profileImage'), (req, res) => {
    const username = req.params.username;
    const { fullName, email, summary, skills, experience } = req.body;
    const profileImage = resumes[username].profileImage; // Keep the existing image or null
    resumes[username] = { ...resumes[username], fullName, email, summary, skills, experience, profileImage };
    res.redirect(`/${username}/resume.html`);
});

app.get('/:username/download-pdf', async (req, res) => {
    const username = req.params.username;
    const resume = resumes[username];
    
    if (!resume) {
        return res.status(404).send('Resume not found');
    }

    const resumeHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${resume.fullName}'s Resume</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }
                .container {
                    width: 80%;
                    margin: auto;
                    overflow: hidden;
                    padding: 20px;
                }
                h1, h2 {
                    color: #2c3e50;
                }
                .section {
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${resume.fullName}'s Resume</h1>
                <div class="section">
                    <h2>Contact</h2>
                    <p>Email: ${resume.email}</p>
                </div>
                <div class="section">
                    <h2>Summary</h2>
                    <p>${resume.summary}</p>
                </div>
                <div class="section">
                    <h2>Skills</h2>
                    <p>${resume.skills}</p>
                </div>
                <div class="section">
                    <h2>Experience</h2>
                    <p>${resume.experience}</p>
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        const page = await browser.newPage();
        await page.setContent(resumeHTML);
        const pdf = await page.pdf({ format: 'A4' });

        await browser.close();

        res.contentType('application/pdf');
        res.send(pdf);
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).send('Error generating PDF');
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}

module.exports = app;
