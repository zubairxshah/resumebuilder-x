const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('html-pdf');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// In-memory storage for resumes (replace with a database in a real application)
const resumes = {};

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/build', (req, res) => {
    res.sendFile(__dirname + '/public/resumebuilder.html');
});

app.post('/submit-resume', upload.single('profileImage'), (req, res) => {
    const { username, fullName, email, summary, skills, experience } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;
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
                ${resume.profileImage ? `<img src="${resume.profileImage}" alt="${resume.fullName}" class="profile-image">` : ''}
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

    res.sendFile(__dirname + '/public/editresume.html');
});

app.post('/:username/update', upload.single('profileImage'), (req, res) => {
    const username = req.params.username;
    const { fullName, email, summary, skills, experience } = req.body;
    const profileImage = req.file ? `/uploads/${req.file.filename}` : resumes[username].profileImage;
    
    resumes[username] = { ...resumes[username], fullName, email, summary, skills, experience, profileImage };
    res.redirect(`/${username}/resume.html`);
});

app.get('/:username/download-pdf', (req, res) => {
    const username = req.params.username;
    const resume = resumes[username];
    
    if (!resume) {
        return res.status(404).send('Resume not found');
    }

    let imageHtml = '';
    if (resume.profileImage) {
        const imagePath = path.join(__dirname, 'public', resume.profileImage);
        const imageData = fs.readFileSync(imagePath);
        const base64Image = Buffer.from(imageData).toString('base64');
        imageHtml = `<img src="data:image/jpeg;base64,${base64Image}" alt="${resume.fullName}" style="max-width: 200px; max-height: 200px; border-radius: 50%; margin-bottom: 20px;">`;
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
             <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">

        </head>
        <body>
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
            </div>
        </body>
        </html>
    `;

    const options = { 
        format: 'Letter',
        border: {
            top: "20px",
            right: "20px",
            bottom: "20px",
            left: "20px"
        }
    };

    pdf.create(resumeHTML, options).toBuffer((err, buffer) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error generating PDF');
        }
        
        res.type('application/pdf');
        res.attachment(`${username}_resume.pdf`);
        res.send(buffer);
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

// Create uploads directory if it doesn't exist
const dir = './public/uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}
