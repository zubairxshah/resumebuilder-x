const debug = require('debug')('app:server');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const PDFDocument = require('pdfkit');
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

app.get('/:username/download-pdf', (req, res) => {
    debug('Attempting to generate PDF');
    const username = req.params.username;
    const resume = resumes[username];
    
    if (!resume) {
        debug('Resume not found');
        return res.status(404).send('Resume not found');
    }

    const doc = new PDFDocument();
    
    res.contentType('application/pdf');
    doc.pipe(res);

    doc.fontSize(25).text(resume.fullName + "'s Resume", {align: 'center'});
    doc.moveDown();
    doc.fontSize(14).text('Contact', {underline: true});
    doc.fontSize(12).text('Email: ' + resume.email);
    doc.moveDown();
    doc.fontSize(14).text('Summary', {underline: true});
    doc.fontSize(12).text(resume.summary);
    doc.moveDown();
    doc.fontSize(14).text('Skills', {underline: true});
    doc.fontSize(12).text(resume.skills);
    doc.moveDown();
    doc.fontSize(14).text('Experience', {underline: true});
    doc.fontSize(12).text(resume.experience);

    doc.end();
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
