import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

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

let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);