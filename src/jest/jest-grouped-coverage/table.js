(() => {
  const COVERAGE_DATA = '__COVERAGE_DATA__'; // this will be replaced by script
  const ID_MAP = '__COVERAGE_TABLE_MAP__'; // this will be replaced by script

  // if data replacement failed, bail early.
  if (typeof COVERAGE_DATA === 'string' || typeof ID_MAP === 'string') return;

  //
  const coverageData = Object.keys(COVERAGE_DATA).reduce(
    (p, c) =>
      Object.assign(p, {
        [c]: {
          total: COVERAGE_DATA[c].total,
          files: Object.entries(COVERAGE_DATA[c].files)
        }
      }),
    {}
  );
  const columns = ['file', 'progress', 's', 'b', 'f', 'l'];

  function getCoverageClass(value) {
    if (value < 50) return 'low';

    if (value >= 50 && value < 80) return 'medium';

    if (value >= 80) return 'high';

    return '';
  }

  function getMaxPct(value) {
    return Math.max(...Object.values(value));
  }

  function generateTable(table, files) {
    const { tBodies } = table;
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
          case 'progress': {
            const progress = document.createElement('progress');
            progress.classList.add('progress');
            progress.value = Math.round(maxPct);
            progress.max = 100;
            td.appendChild(progress);
            td.classList.add(maxCoverageClass);
            break;
          }
          default:
            td.innerText = coverage[col];
            td.classList.add(getCoverageClass(coverage[col]));
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

      const sortedFiles = coverageData[ID_MAP[id]].files.sort(([fileA, coverageA], [fileB, coverageB]) => {
        switch (col) {
          case 'file':
            return newSort === 'asc' ? fileA.localeCompare(fileB) : fileB.localeCompare(fileA);
          case 'progress':
            return newSort === 'asc'
              ? getMaxPct(coverageA) - getMaxPct(coverageB)
              : getMaxPct(coverageB) - getMaxPct(coverageA);
          default:
            return newSort === 'asc' ? coverageA[col] - coverageB[col] : coverageB[col] - coverageA[col];
        }
      });

      generateTable(table, sortedFiles);
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
