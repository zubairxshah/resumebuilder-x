const debug = require('debug')('app:server');
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
            <link rel="stylesheet" href="/style.css">
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
    debug('Attempting to generate PDF');
    const username = req.params.username;
    const resume = resumes[username];
    
    if (!resume) {
        debug('Resume not found');
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
                    margin: 0;
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
        </body>
        </html>
    `;

    try {
        debug('Launching browser');
        const browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
        });

        debug('Creating new page');
        const page = await browser.newPage();
        debug('Setting content');
        await page.setContent(resumeHTML, { waitUntil: 'networkidle0' });
        debug('Generating PDF');
        const pdf = await page.pdf({ 
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        debug('Closing browser');
        await browser.close();

        debug('Sending PDF');
        res.contentType('application/pdf');
        res.send(pdf);
    } catch (error) {
        debug('PDF generation error:', error);
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
