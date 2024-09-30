const skillsSection = document.getElementById('skills');
const skillsToggleBtn = document.createElement('button');
skillsToggleBtn.textContent = 'Toggle Skills';

skillsToggleBtn.addEventListener('click', () => {
    skillsSection!.classList.toggle('hidden');
    skillsToggleBtn.textContent = skillsSection!.classList.contains('hidden') ? 'Show Skills' : 'Hide Skills';
});

if (skillsSection) {
    skillsSection.parentNode?.insertBefore(skillsToggleBtn, skillsSection.nextSibling);
}