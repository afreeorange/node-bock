import { writeFile, readFile } from "fs/promises";

import { ncp } from "ncp";
import { v5 as uuidv5 } from "uuid";
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

export const writeSearch = async (bock: Bock) => {
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

        // Don't want to render the ROOT entity. It's special.
        articles: listOfEntities.filter((e) => e.uri !== "ROOT"),
      },
      prettify,
    }),
  );
};

export const writeHome = async (bock: Bock) => {
  const { entities, articleRoot, outputFolder, prettify, listOfEntities } =
    bock;

  let html;
  let source;

  if (Object.keys(entities).includes(HOME_PAGE_DOCUMENT)) {
    source = (
      await readFile(`${articleRoot}/${HOME_PAGE_DOCUMENT}`)
    ).toString();
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

        // Remove the root entity from the list of recents.
        recent: sort(listOfEntities)
          .desc("modified")
          .slice(0, MAX_RECENT_ARTICLES + 1)
          .filter((e) => e.uri !== "ROOT"),
      },
      prettify,
    }),
  );
};

export const writeRandom = async ({
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

export const writeArticle__Raw = async (bock: Bock, article: Article) => {
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

export const writeArticle__RevisionList = async (
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

export const writeArticle__Revisions = async (
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

export const writeEntity = async (
  bock: Bock,
  entity: Entity,
): Promise<void> => {
  const { outputFolder, articleRoot, prettify } = bock;

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
      html,
      uncommitted: false,
      revisions: await getRevisionList(bock.articleRoot, path),
    };
  } else {
    const children = Object.values(await getEntities(articleRoot, path, 1));

    data = {
      ...data,
      children: {
        articles: sort(
          children
            .filter((c) => c.type === "article")
            .map((c) => ({
              name: c.name,
              type: c.type,
              path: c.path,
              uri: c.uri,
            })),
        ).asc("path"),
        folders: sort(
          children
            .filter((c) => c.type === "folder")
            .map((c) => ({
              name: c.name,
              type: c.type,
              path: c.path,
              uri: c.uri,
            })),
        ).asc("path"),
      },
      readme: await getReadme(bock, entity),
    };
  }

  await writeFile(
    `${outputFolder}/${entity.uri}/index.html`,
    render({
      template: `entity.html`,
      variables: {
        type: entity.type,
        name: entity.name,
        uri: entity.uri,

        entity: data,
      },
      prettify,
    }),
  );

  await writeFile(
    `${entityToMake}/index.json`,
    JSON.stringify(data, null, JSON_PADDING),
  );

  if (entity.type === "article") {
    await writeArticle__Raw(bock, data);
    await writeArticle__RevisionList(bock, data);
    await writeArticle__Revisions(bock, data);
  }
};

export const writeEntities = async (bock: Bock): Promise<void> => {
  const { listOfEntities } = bock;

  await Promise.all(
    listOfEntities.map(async (e) => {
      await writeEntity(bock, e);
    }),
  );

  /**
   * This is slow. Why?
   */
  // for await (const e of listOfEntities) {
  //   console.log(`Writing ${e.name}`);
  //   await writeEntity(bock, e);
  // }
};

/**
 * Note: `fs-extra` did not work with `pkg` and the compiled executable so I
 * had to resort to this ancient-ass (but simple) package instead.
 */
export const writeAssets = ({ articleRoot, outputFolder }: Bock) => {
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
