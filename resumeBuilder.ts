const resumeForm = document.getElementById('resumeForm') as HTMLFormElement;
const resumeContent = document.getElementById('resumeContent'); 

resumeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(resumeForm);

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const linkedin = formData.get('linkedin') as string;
    const github = formData.get('github') as string;

    const degree = formData.get('degree') as string;
    const university = formData.get('university') as string;
    const graduationYear = formData.get('graduationYear') as string;

    const jobTitle = formData.get('jobTitle') as string;
    const company = formData.get('company') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const jobDescription = formData.get('jobDescription') as string;

    const skills = (formData.get('skills') as string).split(',').map(skill => skill.trim());

    // Generate the resume HTML
    const resumeHTML = `
        <header>
            <h1>${name}</h1>
            <p>${email}</p>
            <p>${phone}</p>
            <p>LinkedIn: <a href="${linkedin}">${linkedin}</a></p>
            <p>GitHub: <a href="${github}">${github}</a></p>
        </header>
        <section class="section" id="education" data-section-data='{"degree": "${degree}", "university": "${university}", "year": "${graduationYear}"}'>
            <h2>Education</h2>
            <ul>
                <li>
                    <h3><span data-field="degree" class="editable">${degree}</span></h3>
                    <p><span data-field="university" class="editable">${university}</span> - <span data-field="year" class="editable">${graduationYear}</span></p>
                </li>
            </ul>
        </section>
        <section class="section" id="experience" data-section-data='{"title": "${jobTitle}", "company": "${company}", "start": "${startDate}", "end": "${endDate}", "description": "${jobDescription}"}'>
            <h2>Work Experience</h2>
            <ul>
                <li>
                    <h3><span data-field="title" class="editable">${jobTitle}</span></h3>
                    <p><span data-field="company" class="editable">${company}</span> - <span data-field="start" class="editable">${startDate}</span> - <span data-field="end" class="editable">${endDate}</span></p>
                    <ul>
                        <li><span data-field="description" class="editable">${jobDescription}</span></li>
                    </ul>
                </li>
            </ul>
        </section>
        <section class="section" id="skills" data-section-data='{"skills": "${skills.join(', ')}"}'>
            <h2>Skills</h2>
            <ul>
                ${skills.map(skill => `<li><span data-field="skills" class="editable">${skill}</span></li>`).join('')}
            </ul>
        </section>
    `;

    // Create a link to the resume
    const resumeURL = `http://localhost:3000/${name.replace(/\s+/g, '')}/resume.html`;
    if (resumeContent) {
        resumeContent.innerHTML = `
            <a href="${resumeURL}" target="_blank">View Your Resume</a>
        `;
    }
});