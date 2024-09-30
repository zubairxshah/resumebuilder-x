var _a;
var skillsSection = document.getElementById('skills');
var skillsToggleBtn = document.createElement('button');
skillsToggleBtn.textContent = 'Toggle Skills';
skillsToggleBtn.addEventListener('click', function () {
    skillsSection.classList.toggle('hidden');
    skillsToggleBtn.textContent = skillsSection.classList.contains('hidden') ? 'Show Skills' : 'Hide Skills';
});
if (skillsSection) {
    (_a = skillsSection.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(skillsToggleBtn, skillsSection.nextSibling);
}
