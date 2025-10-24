import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const titleEl = document.querySelector('.projects-title');
if (titleEl && Array.isArray(projects)) {
    const n = projects.length;
    titleEl.textContent = `${n} Projects`;
}
const container = document.querySelector('.projects');
renderProjects(projects, container, 'h2');