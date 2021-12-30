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
  renderer.addFilter("markMatch", (path) =>
    path.replace(/\>\>\>/g, "<mark>").replace(/\<\<\</g, "</mark>"),
  );
  renderer.addFilter("arrowPath", (path) =>
    path.replace(".md", "").replace(/\//g, " &rarr; "),
  );

  const template = `
   {% for row in rows %}
   <li>
     <a href="/{{ row.uri }}" title="{{ row.name }}">{{ row.highlightedPath | arrowPath | markMatch | safe }}</a>
     <br />
     <small>
       {{ row.content | markMatch | safe }}
     </small>
   </li>
   {% endfor %}
   `;

  const resultsSection = document.querySelector(`[data-content="results"]`);
  const listSection = document.querySelector(
    `[data-content="list-of-articles"]`,
  );
  const countSection = document.querySelector("h1");
  const oldCount = document.querySelector("h1").innerHTML;

  document.querySelector("input").addEventListener("keyup", (e) => {
    const term = e.target.value;

    if (term && term.length >= 3) {
      // https://sqlite.org/forum/info/00d53dbed15f5e5a
      const thingSearchStatement = db.prepare(`
      SELECT
        uri,
        name,
        highlight(articles_fts, 6, '>>>', '<<<') as highlightedPath,
        snippet(articles_fts, 1, '>>>', '<<<', '...', 50) as content,
        path
      FROM articles_fts
      WHERE articles_fts MATCH 'path:${term}* OR content:${term}*'
      ORDER BY RANK
      LIMIT 100
      `);

      let rows = [];
      while (thingSearchStatement.step()) {
        const row = thingSearchStatement.getAsObject();
        rows.push(row);
      }

      console.log(rows);

      thingSearchStatement.free();

      const summary =
        rows.length > 1
          ? rows.length.toString() + " results"
          : rows.length === 1
          ? "One result"
          : "No Results :/";

      countSection.innerHTML = term + " <span>" + summary + "</span>";
      listSection.style.display = "none";
      resultsSection.style.display = "block";
      resultsSection.innerHTML = renderer.renderString(template, {
        count: rows.length,
        term,
        rows,
      });
    } else {
      countSection.innerHTML = oldCount;
      listSection.style.display = "block";
      resultsSection.style.display = "none";
    }
  });
})();
