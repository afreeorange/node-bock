import { writeFile, readFile, stat } from "fs/promises";

import { ncp } from "ncp";
import { v5 as uuidv5 } from "uuid";
import cliProgress from "cli-progress";
import highlight from "highlight.js";
import { sort } from "fast-sort";

import { render } from "./renderer";
import {
  ASSETS_FOLDER,
  HOME_PAGE_DOCUMENT,
  JSON_PADDING,
  MAX_RECENT_ARTICLES,
  UUID_NAMESPACE,
} from "./constants";
import parser from "./parser";
import { mkdirp } from "./helpers";
import { getEntities, getReadme } from "./readers";
import { Article, Bock, Entity } from "./types";
import { getDates, getRevisionList, getRevision } from "./repository";

export const createSearch = async (bock: Bock) => {
  const { outputFolder, listOfEntities, prettify } = bock;

  await mkdirp(`${outputFolder}/search`);

  await writeFile(
    `${outputFolder}/search/index.html`,
    render({
      template: `search.html`,
      variables: {
        type: "search",
        name: "Search Articles",
        uri: "/search",

        articles: sort(listOfEntities).asc((e) => e.path),
      },
      prettify,
    }),
  );
};

export const createHome = async (bock: Bock) => {
  const { entities, articleRoot, outputFolder, prettify, listOfEntities } =
    bock;

  let html;
  let source;
  let stats;

  if (Object.keys(entities).includes(HOME_PAGE_DOCUMENT)) {
    source = (
      await readFile(`${articleRoot}/${HOME_PAGE_DOCUMENT}`)
    ).toString();

    stats = await stat(`${articleRoot}/${HOME_PAGE_DOCUMENT}`);
  } else {
    source = `(Could not find a \`${HOME_PAGE_DOCUMENT}\`. You should make one!)`;

    await mkdirp(`${outputFolder}/Home`);
  }

  html = parser.render(source);

  const { created, modified } = await getDates(
    articleRoot,
    `${articleRoot}/Home.md`,
  );

  const entity = {
    created,
    hierarchy: [
      {
        name: "ROOT",
        type: "folder",
        uri: "",
      },
      {
        name: "Home",
        type: "article",
        uri: "Home",
      },
    ],
    id: uuidv5(`/${HOME_PAGE_DOCUMENT}`, UUID_NAMESPACE),
    modified,
    name: "Home",
    path: HOME_PAGE_DOCUMENT,
    sizeInBytes: 0,
    type: "home",
    uri: "Home",
    source,
    excerpt: "",
    html,
    uncommitted: false,
    revisions: [],
  };

  await writeFile(
    `${outputFolder}/index.html`,
    render({
      template: `entity.html`,
      variables: {
        type: "home",
        name: entity.name,
        uri: "/",

        entity,
        recent: listOfEntities.slice(0, MAX_RECENT_ARTICLES),
      },
      prettify,
    }),
  );
};

export const createEntity = async (bock: Bock, entity: Entity) => {
  const { outputFolder, prettify } = bock;

  await writeFile(
    `${outputFolder}/${entity.uri}/index.html`,
    render({
      template: `entity.html`,
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
      template: `entity.html`,
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
      template: `random.html`,
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
      template: `raw.html`,
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

export const createRevisionList = async (
  bock: Bock,
  article: Article,
): Promise<void> => {
  const { outputFolder, prettify } = bock;
  const revisionListFolder = `${outputFolder}/${article.uri}/revisions`;

  await mkdirp(revisionListFolder);

  await writeFile(
    `${revisionListFolder}/index.json`,
    `{ "revisions": ${JSON.stringify(article.revisions, null, JSON_PADDING)}}`,
  );

  await writeFile(
    `${revisionListFolder}/index.html`,
    render({
      template: `revision-list.html`,
      variables: {
        type: "revision-list",
        name: article.name,
        uri: article.uri,

        entity: article,
      },
      prettify,
    }),
  );
};

export const createRevisions = async (
  bock: Bock,
  article: Article,
): Promise<void> => {
  const { outputFolder, prettify } = bock;

  await mkdirp(`${outputFolder}/${article.uri}/revisions`);

  await Promise.all(
    article.revisions.map(async (r) => {
      let revisionPath = `${outputFolder}/${article.uri}/revisions/${r.shortId}`;
      let revisionData = await getRevision(
        bock.articleRoot,
        article.path,
        r.id,
      );

      await mkdirp(`${revisionPath}`);

      await writeFile(
        `${revisionPath}/index.json`,
        JSON.stringify(revisionData, null, JSON_PADDING),
      );

      await writeFile(
        `${revisionPath}/index.html`,
        render({
          template: `revision.html`,
          variables: {
            type: "revision",
            name: article.name,
            uri: article.uri,

            entity: article,
            revisionData,
          },
          prettify,
        }),
      );
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
    hierarchy,
    id,
    modified,
    name,
    path,
    sizeInBytes,
    type,
    uri,
  };

  if (type === "article") {
    const articleText = (await readFile(`${articleRoot}/${path}`)).toString();
    const html = parser.render(articleText);

    data = {
      ...data,
      source: articleText,
      excerpt: "",
      html,
      uncommitted: false,
      revisions: await getRevisionList(bock.articleRoot, path),
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
    await createRevisionList(bock, data);
    await createRevisions(bock, data);
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

/**
 * Note: `fs-extra` did not work with `pkg` and the compiled executable so I
 * had to resort to this ancient-ass (but simple) package instead.
 */
export const copyAssets = ({ articleRoot, outputFolder }: Bock) => {
  ncp(
    `${articleRoot}/${ASSETS_FOLDER}`,
    `${outputFolder}/${ASSETS_FOLDER}`,
    (e) => (e ? console.log(`Could not copy assets: ${e}`) : true),
  );

  ncp(
    `${__dirname}/templates`,
    `${outputFolder}`,
    {
      filter: (src) => !src.endsWith("html"),
    },
    (e) => (e ? console.log(`Could not copy assets: ${e}`) : true),
  );
};
