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
const svg = d3.select('#projects-pie-plot');
const legendUL = d3.select('.legend');

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
  // re-calculate rolled data
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );

  // re-calculate data
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

  // re-calculate slice generator, arc data, arcs, etc.
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let arcGen = d3.arc().innerRadius(0).outerRadius(50);
    let newArcs = newArcData.map((d) => arcGen(d));

    svg.selectAll('*').remove();
    legendUL.selectAll('*').remove();
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    newArcs.forEach((arc, idx) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(idx));
    });
    newData.forEach((d, idx) => {
        legendUL
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

// Call this function on page load 
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