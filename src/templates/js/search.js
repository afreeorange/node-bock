/**
 * TODO: Use <input type=search>
 * TODO: Change URI param with term
 */

const REMOTE_DATABASE = "/entities.db";

(async () => {
  config = {
    locateFile: (filename) => `/js/${filename}`,
  };

  const sqlPromise = initSqlJs({
    locateFile: (file) => `/js/${file}`,
  });

  const dataPromise = fetch(REMOTE_DATABASE).then((res) => res.arrayBuffer());
  const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
  const db = new SQL.Database(new Uint8Array(buf));

  const renderer = nunjucks.configure({});
  renderer.addFilter("arrowPath", (path) =>
    path.replace(".md", "").replace(/\|/g, " &rarr; "),
  );

  const template = `
    <ul>
      {% for row in rows %}
      <li>
        <p>
          <strong><a href="/{{ row.uri }}" title="{{ row.name }}">{{ row.highlightedPath | arrowPath | safe }}</a></strong>
        </p>
        <p>
          {{ row.content | safe }}
        </p>
      </li>
      {% endfor %}
    </ul>
  `;

  const resultsSection = document.querySelector(`[data-content="results"]`);
  const listSection = document.querySelector(
    `[data-content="list-of-articles"]`,
  );
  const countSection = document.querySelector("h1 span");
  const oldCount = document.querySelector("h1 span").innerText;

  document.querySelector("input").addEventListener("keyup", (e) => {
    const term = e.target.value;

    if (term && term.length >= 3) {
      // https://sqlite.org/forum/info/00d53dbed15f5e5a
      const thingSearchStatement = db.prepare(`
          SELECT 
            uri,
            name,
            highlight(articles_fts, 6, '<mark>', '</mark>') as highlightedPath,
            snippet(articles_fts, 1, '<mark>', '</mark>', '...', 50) as content,
            path
          FROM articles_fts
          WHERE articles_fts MATCH 'path:${term}* OR content:${term}*'
          ORDER BY RANK
          LIMIT 100
          `);

      let rows = [];
      while (thingSearchStatement.step()) {
        const row = thingSearchStatement.getAsObject();
        /**
         * Can't have the Nunjucks filter use a slash because we're using
         * the <mark></mark> tags to show highlights. Make the path delimiter
         * something else and let the filter use that instead.
         */
        rows.push({ ...row, path: row.path.replace(/\//g, "|") });
      }

      thingSearchStatement.free();

      countSection.innerText = rows.length;
      listSection.style.display = "none";
      resultsSection.style.display = "block";
      resultsSection.innerHTML = renderer.renderString(template, {
        count: rows.length,
        term,
        rows,
      });
    } else {
      countSection.innerText = oldCount;
      listSection.style.display = "block";
      resultsSection.style.display = "none";
    }
  });
})();
