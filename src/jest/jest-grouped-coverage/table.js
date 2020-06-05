(() => {
  if (!window.__COVERAGE_DATA__) {
    return;
  }

  const coverageData = Object.keys(window.__COVERAGE_DATA__).reduce(
    (p, c) =>
      Object.assign(p, {
        [c]: {
          total: window.__COVERAGE_DATA__[c].total,
          files: Object.entries(window.__COVERAGE_DATA__[c].files)
        }
      }),
    {}
  );
  const ID_MAP = window.__COVERAGE_TABLE_MAP__;
  const columns = ['file', 'progress', 'statements', 'branches', 'functions', 'lines'];

  function getCoverageClass(value) {
    if (value < 50) return 'low';

    if (value >= 50 && value < 80) return 'medium';

    if (value >= 80) return 'high';

    return '';
  }

  function getMaxPct(value) {
    return Math.max(value.lines.pct, value.functions.pct, value.statements.pct, value.branches.pct);
  }

  function generateTable(table, files) {
    const { id, tBodies } = table;
    const tBody = tBodies[0];

    const fragment = document.createDocumentFragment();

    files.forEach(([file, coverage]) => {
      const tr = document.createElement('tr');

      columns.forEach(col => {
        const td = document.createElement('td');
        const maxPct = getMaxPct(coverage);
        const maxCoverageClass = getCoverageClass(maxPct);

        switch (col) {
          case 'file':
            td.innerText = file;
            td.classList.add(maxCoverageClass);
            break;
          case 'progress':
            const progress = document.createElement('progress');
            progress.classList.add('progress');
            progress.value = Math.round(maxPct);
            progress.max = 100;
            td.appendChild(progress);
            td.classList.add(maxCoverageClass);
            break;
          default:
            td.innerText = coverage[col].pct;
            td.classList.add(getCoverageClass(coverage[col].pct));
        }

        tr.appendChild(td);
      });

      fragment.appendChild(tr);
    });

    tBody.innerHTML = '';
    tBody.appendChild(fragment);
  }

  const tables = document.querySelectorAll('table');

  tables.forEach(table => {
    const { id } = table;
    const files = coverageData[ID_MAP[id]].files;
    generateTable(table, files);

    table.addEventListener('click', e => {
      if (e.target.tagName !== 'TH' || !e.target.dataset.sort) {
        return;
      }

      const th = e.target;
      const cells = Array.from(th.parentNode.cells);
      const index = cells.indexOf(th);
      const { sort } = th.dataset;
      const col = columns[index];

      let newSort;

      if (sort === 'none' || sort === 'desc') {
        newSort = 'asc';
      } else if (sort === 'asc') {
        newSort = 'desc';
      }

      const files = coverageData[ID_MAP[id]].files.sort(([fileA, coverageA], [fileB, coverageB]) => {
        switch (col) {
          case 'file':
            return newSort === 'asc' ? fileA.localeCompare(fileB) : fileB.localeCompare(fileA);
          case 'progress':
            return newSort === 'asc'
              ? getMaxPct(coverageA) - getMaxPct(coverageB)
              : getMaxPct(coverageB) - getMaxPct(coverageA);
          default:
            return newSort === 'asc'
              ? coverageA[col].pct - coverageB[col].pct
              : coverageB[col].pct - coverageA[col].pct;
        }
      });

      generateTable(table, files);
      Array.from(table.tHead.rows).forEach(row =>
        Array.from(row.cells).forEach(cell => {
          console.log(cell !== th);
          if (cell !== th && cell.dataset.sort) cell.dataset.sort = 'none';
        })
      );
      th.dataset.sort = newSort;
    });
  });
})();
