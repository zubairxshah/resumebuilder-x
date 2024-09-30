var resumeForm = document.getElementById('resumeForm');
var resumeContent = document.getElementById('resumeContent');
resumeForm.addEventListener('submit', function (event) {
    event.preventDefault();
    var formData = new FormData(resumeForm);
    var name = formData.get('name');
    var email = formData.get('email');
    var phone = formData.get('phone');
    var linkedin = formData.get('linkedin');
    var github = formData.get('github');
    var degree = formData.get('degree');
    var university = formData.get('university');
    var graduationYear = formData.get('graduationYear');
    var jobTitle = formData.get('jobTitle');
    var company = formData.get('company');
    var startDate = formData.get('startDate');
    var endDate = formData.get('endDate');
    var jobDescription = formData.get('jobDescription');
    var skills = formData.get('skills').split(',').map(function (skill) { return skill.trim(); });
    // Generate the resume HTML
    var resumeHTML = "\n        <header>\n            <h1>".concat(name, "</h1>\n            <p>").concat(email, "</p>\n            <p>").concat(phone, "</p>\n            <p>LinkedIn: <a href=\"").concat(linkedin, "\">").concat(linkedin, "</a></p>\n            <p>GitHub: <a href=\"").concat(github, "\">").concat(github, "</a></p>\n        </header>\n        <section class=\"section\" id=\"education\" data-section-data='{\"degree\": \"").concat(degree, "\", \"university\": \"").concat(university, "\", \"year\": \"").concat(graduationYear, "\"}'>\n            <h2>Education</h2>\n            <ul>\n                <li>\n                    <h3><span data-field=\"degree\" class=\"editable\">").concat(degree, "</span></h3>\n                    <p><span data-field=\"university\" class=\"editable\">").concat(university, "</span> - <span data-field=\"year\" class=\"editable\">").concat(graduationYear, "</span></p>\n                </li>\n            </ul>\n        </section>\n        <section class=\"section\" id=\"experience\" data-section-data='{\"title\": \"").concat(jobTitle, "\", \"company\": \"").concat(company, "\", \"start\": \"").concat(startDate, "\", \"end\": \"").concat(endDate, "\", \"description\": \"").concat(jobDescription, "\"}'>\n            <h2>Work Experience</h2>\n            <ul>\n                <li>\n                    <h3><span data-field=\"title\" class=\"editable\">").concat(jobTitle, "</span></h3>\n                    <p><span data-field=\"company\" class=\"editable\">").concat(company, "</span> - <span data-field=\"start\" class=\"editable\">").concat(startDate, "</span> - <span data-field=\"end\" class=\"editable\">").concat(endDate, "</span></p>\n                    <ul>\n                        <li><span data-field=\"description\" class=\"editable\">").concat(jobDescription, "</span></li>\n                    </ul>\n                </li>\n            </ul>\n        </section>\n        <section class=\"section\" id=\"skills\" data-section-data='{\"skills\": \"").concat(skills.join(', '), "\"}'>\n            <h2>Skills</h2>\n            <ul>\n                ").concat(skills.map(function (skill) { return "<li><span data-field=\"skills\" class=\"editable\">".concat(skill, "</span></li>"); }).join(''), "\n            </ul>\n        </section>\n    ");
    // Create a link to the resume
    var resumeURL = "http://localhost:3000/".concat(name.replace(/\s+/g, ''), "/resume.html");
    if (resumeContent) {
        resumeContent.innerHTML = "\n            <a href=\"".concat(resumeURL, "\" target=\"_blank\">View Your Resume</a>\n        ");
    }
});
