import { writeFile, readFile, stat } from "fs/promises";

import { copy } from "fs-extra";
import { v5 as uuidv5 } from "uuid";
import cliProgress from "cli-progress";
import highlight from "highlight.js";

import { render } from "./renderer";
import {
  ASSETS_FOLDER,
  HOME_PAGE_DOCUMENT,
  JSON_PADDING,
  UUID_NAMESPACE,
} from "./constants";
import parser from "./parser";
import { mkdirp, wordCount } from "./helpers";
import { getEntities, getReadme } from "./readers";

export const createSearch = async (bock: Bock) => {
  const { outputFolder, listOfEntities, prettify } = bock;

  await mkdirp(`${outputFolder}/search`);

  await writeFile(
    `${outputFolder}/search/index.html`,
    render({
      template: `${__dirname}/templates/search.html`,
      variables: {
        type: "search",
        name: "Search Articles",
        uri: "/search",

        articles: listOfEntities,
      },
      prettify,
    }),
  );
};

export const createHome = async (bock: Bock) => {
  const { entities, articleRoot, outputFolder, prettify } = bock;

  let html;
  let source;
  let stats;

  if (Object.keys(entities).includes("Hello.md")) {
    source = (
      await readFile(`${articleRoot}/${HOME_PAGE_DOCUMENT}`)
    ).toString();

    stats = await stat(`${articleRoot}/${HOME_PAGE_DOCUMENT}`);
  } else {
    source = `(Could not find a \`${HOME_PAGE_DOCUMENT}\`. You should make one!)`;

    await mkdirp(`${outputFolder}/Hello`);
  }

  html = parser.render(source);

  const entity = {
    created: stats ? stats.ctime : null,
    hierarchy: [
      {
        name: "ROOT",
        type: "folder",
        uri: "",
      },
      {
        name: "Hello",
        type: "article",
        uri: "Hello",
      },
    ],
    id: uuidv5(`/${HOME_PAGE_DOCUMENT}`, UUID_NAMESPACE),
    modified: stats ? stats.mtime : null,
    name: "Hello",
    path: "Hello.md",
    sizeInBytes: 0,
    type: "home",
    uri: "Hello",
    source,
    wordCount: wordCount(source),
    excerpt: "",
    html,
    uncommitted: false,
    revisions: [],
  };

  await writeFile(
    `${outputFolder}/Hello/index.html`,
    render({
      template: `${__dirname}/templates/entity.html`,
      variables: {
        type: "home",
        name: entity.name,
        uri: "/Hello",

        entity,
      },
      prettify,
    }),
  );

  await writeFile(
    `${outputFolder}/index.html`,
    `
<html>
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=/Hello" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />

    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <link rel="icon" href="/img/favicon.png" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="stylesheet" href="/css/styles.css" />

    <title>Redirecting...</title>

    <style type="text/css">
      body {
        align-items: center;
        display: flex;
        font-size: larger;
        justify-content: center;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div><a href="/Hello">Click here</a> if you are not redirected&hellip;</div>
  </body>
</html>  
  `,
  );
};

export const createEntity = async (bock: Bock, entity: Entity) => {
  const { outputFolder, prettify } = bock;

  await writeFile(
    `${outputFolder}/${entity.uri}/index.html`,
    render({
      template: `${__dirname}/templates/entity.html`,
      variables: {
        type: entity.type,
        name: entity.name,
        uri: entity.uri,

        entity,
      },
      prettify,
    }),
  );
};

export const createRoot = async (bock: Bock) => {
  const { articleRoot, outputFolder, prettify } = bock;

  const rootEntities = Object.values(await getEntities(articleRoot, "", 1));

  const entity = {
    created: null,
    hierarchy: [
      {
        name: "ROOT",
        type: "folder",
        uri: "",
      },
    ],
    id: uuidv5(`/ROOT`, UUID_NAMESPACE),
    modified: null,
    name: "Article Root",
    path: "/",
    sizeInBytes: 0,
    type: "folder",
    uri: "ROOT",
    children: {
      articles: rootEntities
        .filter((c) => c.type === "article")
        .map((c) => ({
          name: c.name,
          type: c.type,
          path: c.path,
          uri: c.uri,
        })),
      folders: rootEntities
        .filter((c) => c.type === "folder")
        .map((c) => ({
          name: c.name,
          type: c.type,
          path: c.path,
          uri: c.uri,
        })),
    },
  };

  await mkdirp(`${outputFolder}/ROOT`);

  await writeFile(
    `${outputFolder}/ROOT/index.html`,
    render({
      template: `${__dirname}/templates/entity.html`,
      variables: {
        type: "folder",
        name: entity.name,
        uri: entity.uri,

        entity,
      },
      prettify,
    }),
  );

  await writeFile(
    `${outputFolder}/ROOT/index.json`,
    JSON.stringify(entity, null, JSON_PADDING),
  );
};

export const createRandom = async ({
  listOfEntities,
  outputFolder,
  prettify,
}: Bock) => {
  await mkdirp(`${outputFolder}/random`);

  await writeFile(
    `${outputFolder}/random/index.html`,

    render({
      template: `${__dirname}/templates/random.html`,
      variables: {
        type: "random",
        name: "Random Article",
        uri: "/random",

        listOfEntities,
      },
      prettify,
    }),
  );
};

export const createRawArticle = async (bock: Bock, article: Article) => {
  const { outputFolder, prettify } = bock;

  await mkdirp(`${outputFolder}/${article.uri}/raw`);

  await writeFile(
    `${outputFolder}/${article.uri}/raw/index.html`,
    render({
      template: `${__dirname}/templates/raw.html`,
      variables: {
        type: "raw",
        name: article.name,
        uri: article.uri,

        entity: article,
        raw: highlight.highlight(article.source!, {
          language: "markdown",
        }).value,
      },
      prettify,
    }),
  );
};

export const createRevision = async (
  bock: Bock,
  article: Article,
): Promise<void> => {
  const { outputFolder, prettify } = bock;

  await mkdirp(`${outputFolder}/${article.uri}/revisions`);

  await writeFile(
    `${outputFolder}/${article.uri}/revisions/index.html`,
    render({
      template: `${__dirname}/templates/revision.html`,
      variables: {
        type: "revision",
        name: article.name,
        uri: article.uri,

        entity: article,
      },
      prettify,
    }),
  );
};

export const createSingleEntity = async (
  bock: Bock,
  entity: Entity,
): Promise<void> => {
  const { outputFolder, articleRoot } = bock;

  const {
    created,
    hierarchy,
    id,
    modified,
    name,
    path,
    sizeInBytes,
    type,
    uri,
  } = entity;

  const entityToMake = `${outputFolder}/${uri}`;

  await mkdirp(entityToMake, { recursive: true });

  let data: any = {
    created,
    modified,
    hierarchy,
    id,
    name,
    type,
    uri,
    sizeInBytes,
  };

  if (type === "article") {
    const articleText = (await readFile(`${articleRoot}/${path}`)).toString();
    const html = parser.render(articleText);

    data = {
      ...data,
      source: articleText,
      wordCount: wordCount(articleText),
      excerpt: "",
      html,
      uncommitted: false,
      revisions: [],
    };
  } else {
    const children = Object.values(await getEntities(articleRoot, path, 1));

    data = {
      ...data,
      children: {
        articles: children
          .filter((c) => c.type === "article")
          .map((c) => ({
            name: c.name,
            type: c.type,
            path: c.path,
            uri: c.uri,
          })),
        folders: children
          .filter((c) => c.type === "folder")
          .map((c) => ({
            name: c.name,
            type: c.type,
            path: c.path,
            uri: c.uri,
          })),
      },
      readme: await getReadme(bock, entity),
    };
  }

  await writeFile(
    `${entityToMake}/index.json`,
    JSON.stringify(data, null, JSON_PADDING),
  );

  await createEntity(bock, data);

  if (entity.type === "article") {
    await createRawArticle(bock, data);
    await createRevision(bock, data);
  }
};

export const createEntities = async (bock: Bock): Promise<void> => {
  const { listOfEntities } = bock;

  const bar = new cliProgress.Bar({
    format: "[{bar}] {value} of {total} ({entity})",
    synchronousUpdate: false,
  });

  bar.start(listOfEntities.length, 0, { entity: "N/A" });

  for await (const e of listOfEntities) {
    await createSingleEntity(bock, e);

    bar.increment({
      entity: e.name,
    });
  }

  /**
   * This is the 'typical' way but the progress bar doesn't work...
   */
  // await Promise.all(
  //   listOfEntities.map(async (e) => {
  //     await createSingleEntity(articleRoot, outputFolder, e);
  //   }),
  // );

  bar.stop();
};

export const copyAssets = async ({ articleRoot, outputFolder }: Bock) => {
  try {
    await copy(
      `${articleRoot}/${ASSETS_FOLDER}`,
      `${outputFolder}/${ASSETS_FOLDER}`,
    );

    await copy(`${__dirname}/templates`, `${outputFolder}`, {
      filter: (src) => !src.endsWith("html"),
    });
  } catch (error) {
    console.log(`Could not copy assets: ${error}`);
  }
};
