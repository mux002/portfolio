import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale;
let yScale;

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    return data;
}

function processCommits(data) {
    return d3
        .groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/vis-society/lab-7/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                enumerable: false,
                writable: false,
                configurable: true,
            });

            return ret;
    });
}

function renderCommitInfo(data, commits) {
  // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);

  // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    const numFiles = d3.group(data, (d) => d.file).size;
    dl.append('dt').text('Files');
    dl.append('dd').text(numFiles);

    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (r) => r.line),
        (d) => d.file
    ); 
    const longestFileEntry = d3.greatest(fileLengths, (d) => d[1]);
    const longestFile = longestFileEntry?.[0] ?? '—';
    const longestFileLen = longestFileEntry?.[1] ?? 0;
    dl.append('dt').text('Longest file');
    dl.append('dd').text(`${longestFile} (${longestFileLen} lines)`);

    const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
    dl.append('dt').text('Avg file length');
    dl.append('dd').text(Math.round(averageFileLength ?? 0));

    const workByWeekday = d3.rollups(
    data,
    v => v.length,
    d => new Date(d.datetime).toLocaleString('en-US', { weekday: 'long' }) // e.g., "Monday"
    );
    const maxWeekday = d3.greatest(workByWeekday, d => d[1])?.[0] ?? '—';
    dl.append('dt').text('Most work weekday');
    dl.append('dd').text(maxWeekday);
}

function updateCommitInfo(filteredData, filteredCommits) {
    const dl = d3.select('#stats').select('dl.stats');
    if (dl.empty()) {
        d3.select('#stats').append('dl').attr('class', 'stats');
    }
    const target = d3.select('#stats').select('dl.stats');
    target.html('');
    target.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    target.append('dd').text(filteredData.length);
    target.append('dt').text('Total commits');
    target.append('dd').text(filteredCommits.length);
    const numFiles = d3.group(filteredData, d => d.file).size;
    target.append('dt').text('Files');
    target.append('dd').text(numFiles);
    const fileLengths = d3.rollups(
        filteredData,
        v => d3.max(v, r => r.line),
        d => d.file
    );
    const longestFileEntry = d3.greatest(fileLengths, d => d[1]);
    const longestFile = longestFileEntry?.[0] ?? '—';
    const longestFileLen = longestFileEntry?.[1] ?? 0;
    target.append('dt').text('Longest file');
    target.append('dd').text(`${longestFile} (${longestFileLen} lines)`);
    const averageFileLength = d3.mean(fileLengths, d => d[1]);
    target.append('dt').text('Avg file length');
    target.append('dd').text(Math.round(averageFileLength ?? 0));
    const workByWeekday = d3.rollups(
        filteredData,
        v => v.length,
        d => new Date(d.datetime).toLocaleString('en-US', { weekday: 'long' })
    );
    const maxWeekday = d3.greatest(workByWeekday, d => d[1])?.[0] ?? '—';
    target.append('dt').text('Most work weekday');
    target.append('dd').text(maxWeekday);
}


function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');

    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top  = `${event.clientY}px`;
}

function createBrushSelector(svg) {
    svg.call(d3.brush().on('start brush end', brushed));
    svg.selectAll('.dots, .overlay ~ *').raise();
}

function renderSelectionCount(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];

    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
        selectedCommits.length || 'No'
    } commits selected`;

    return selectedCommits;
}

function brushed(event) {
    const selection = event.selection;
    d3.selectAll('circle').classed('selected', (d) =>
        isCommitSelected(selection, d),
    );
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection);
}

function isCommitSelected(selection, commit) {
    if (!selection) return false;               
    const [x0, x1] = selection.map(d => d[0]);  
    const [y0, y1] = selection.map(d => d[1]); 
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type,
    );

    // Update DOM with breakdown
    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

        container.innerHTML += `
            <dt>${language}</dt>
            <dd>${count} lines (${formatted})</dd>
            `;
    }
}

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');

    xScale = d3
        .scaleTime()
        .domain(d3.extent(commits, (d) => d.datetime))
        .range([0, width])
        .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    const gridlines = svg
        .append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
        .axisLeft(yScale)
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
        .append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis') // new line to mark the g tag
        .call(xAxis);

    // Add Y axis
    svg
        .append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis') // just for consistency
        .call(yAxis);

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);
    
    const dots = svg.append('g').attr('class', 'dots');

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7)
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1);
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', () => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });

        createBrushSelector(svg);
}

function updateScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const svg = d3.select('#chart').select('svg');

    xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

    const xAxis = d3.axisBottom(xScale);
    const xAxisGroup = svg.select('g.x-axis');
    xAxisGroup.selectAll('*').remove();
    xAxisGroup.call(xAxis);

    const dots = svg.select('g.dots');

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });
}

let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

let commitProgress = 100;
let timeScale = d3
    .scaleTime()
    .domain([
        d3.min(commits, (d) => d.datetime),
        d3.max(commits, (d) => d.datetime),
    ])
    .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);

const progressEl = document.getElementById('commit-progress');
const timeEl     = document.getElementById('commit-time');
let filteredCommits = commits;

function onTimeSliderChange() {
    commitProgress = Number(progressEl.value);
    commitMaxTime  = timeScale.invert(commitProgress);
    timeEl.textContent = commitMaxTime.toLocaleString('en', {
        dateStyle: 'long',
        timeStyle: 'short',
    });
    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    const filteredData = data.filter(d => d.datetime <= commitMaxTime);
    updateScatterPlot(data, filteredCommits);
    updateCommitInfo(filteredData, filteredCommits);
}
progressEl.addEventListener('input', onTimeSliderChange);
onTimeSliderChange();


