const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const htmlPdf = require('html-pdf-node');
const debug = require('debug')('app:server');


app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
    console.error('Error details:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'production' ? {} : err
    });
  });
  

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
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;
    resumes[username] = { fullName, email, summary, skills, experience, profileImage };
    res.redirect(`/${username}/resume.html`);
});

app.post('/:username/update', upload.single('profileImage'), (req, res) => {
    const username = req.params.username;
    const { fullName, email, summary, skills, experience } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : resumes[username].profileImage;
    resumes[username] = { ...resumes[username], fullName, email, summary, skills, experience, profileImage };
    res.redirect(`/${username}/resume.html`);
});


app.get('/:username/resume.html', (req, res) => {
    const username = req.params.username;
    const resume = resumes[username];

    if (!resume) {
        return res.status(404).send('Resume not found');
    }

    let imageHtml = '';
    if (resume.profileImage) {
        imageHtml = `<img src="${resume.profileImage}" alt="${resume.fullName}" class="profile-image">`;
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
                ${imageHtml}
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
        const options = { format: 'A4' };
        const pdf = await htmlPdf.generatePdf({ content: resumeHTML }, options);
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
