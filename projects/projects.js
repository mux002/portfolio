import { fetchJSON, renderProjects } from '../global.js';
const projects = await fetchJSON('../lib/projects.json');
const titleEl = document.querySelector('.projects-title');
if (titleEl && Array.isArray(projects)) {
    const n = projects.length;
    titleEl.textContent = `${n} Projects`;
}
const container = document.querySelector('.projects');
renderProjects(projects, container, 'h2');

import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let selectedIndex = -1;

const svg = d3.select('#projects-pie-plot');
const legendUL = d3.select('.legend');

function renderPieChart(projectsGiven) {
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let pie = d3.pie().value((d) => d.value);
    let arcGen = d3.arc().innerRadius(0).outerRadius(50);
    let newArcData = pie(newData);
    let newArcs = newArcData.map((d) => arcGen(d));
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    svg.selectAll('*').remove();
    legendUL.selectAll('*').remove();

    newArcs.forEach((pathD, i) => {
        svg.append('path')
        .attr('d', pathD)
        .attr('fill', colors(i))
        .attr('class', i === selectedIndex ? 'selected' : null)
        .on('click', () => {
            selectedIndex = (selectedIndex === i) ? -1 : i;
            svg.selectAll('path')
                .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : null));
            legendUL.selectAll('li')
                .attr('class', (_, idx) => `legend-item${idx === selectedIndex ? ' selected' : ''}`);
            if (selectedIndex === -1) {
                renderProjects(projectsGiven, container, 'h2');
            } else {
                const year = newData[selectedIndex].label;          
                const filtered = projectsGiven.filter(p => String(p.year) === String(year));
                renderProjects(filtered, container, 'h2');
            }
        });
    });

    newData.forEach((d, idx) => {
        legendUL.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', `legend-item${idx === selectedIndex ? ' selected' : ''}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', () => {
                selectedIndex = (selectedIndex === idx) ? -1 : idx;
                svg.selectAll('path')
                    .attr('class', (_, i) => (i === selectedIndex ? 'selected' : null));
                legendUL.selectAll('li')
                    .attr('class', (_, i) => `legend-item${i === selectedIndex ? ' selected' : ''}`);
                if (selectedIndex === -1) {
                    renderProjects(projectsGiven, container, 'h2');
                } else {
                    const year = newData[selectedIndex].label;
                const filtered = projectsGiven.filter(p => String(p.year) === String(year));
                renderProjects(filtered, container, 'h2');
                }
        });
    });
}

renderPieChart(projects);

let query = '';
const searchInput = document.querySelector('.searchBar');
function setQuery(q) {
    query = q;
    return projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
}
if (searchInput) {
    searchInput.addEventListener('change', (event) => {
        let filteredProjects = setQuery(event.target.value);
        renderProjects(filteredProjects, container, 'h2');
        renderPieChart(filteredProjects);
    });
}
