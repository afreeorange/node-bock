import { extname } from "path";
import { mkdir, writeFile, readFile } from "fs/promises";

import { copy } from "fs-extra";
import { v5 as uuidv5 } from "uuid";
import cliProgress from "cli-progress";
import fg from "fast-glob";
import nunjucks from "nunjucks";
import highlight from "highlight.js";

import packageJson from "../package.json";
import {
  ASSETS_FOLDER,
  ENTITIES_TO_IGNORE,
  HOME_PAGE_DOCUMENT,
  JSON_PADDING,
  MAX_DEPTH,
  ROOT_NODE_NAME,
  UUID_NAMESPACE,
} from "./constants";
import parser from "./parser";
import e from "express";

export const renderArticles = async ({
  outputFolder,
  listOfEntities,
}: Bock) => {
  try {
    await mkdir(`${outputFolder}/articles`);
  } catch (error) {
    if (!(error as Error).message.includes("EEXIST")) {
      console.log(`Error creating articles folder: ${error}`);
    }
  }

  await writeFile(
    `${outputFolder}/articles/index.html`,
    nunjucks.render(`${__dirname}/templates/articles.html`, {
      articles: listOfEntities,
      version: packageJson.version,
      name: packageJson.name,
    }),
  );
};

export const renderHome = async ({
  entities,
  articleRoot,
  outputFolder,
}: Bock) => {
  let html;
  let source;

  if (Object.keys(entities).includes("Hello.md")) {
    source = (
      await readFile(`${articleRoot}/${HOME_PAGE_DOCUMENT}`)
    ).toString();
  } else {
    source = `(Could not find a <code>${HOME_PAGE_DOCUMENT}</code>. You should make one!)`;
  }

  html = parser.render(source);

  const entity = {
    created: new Date(),
    hierarchy: [],
    id: uuidv5(`/${HOME_PAGE_DOCUMENT}`, UUID_NAMESPACE),
    modified: new Date(),
    name: "Hello",
    path: "Hello.md",
    sizeInBytes: 0,
    type: "article",
    uri: "/Hello",
    source,
    wordCount: wordCount(source),
    excerpt: "",
    html,
    uncommitted: false,
    revisions: [],
  };

  await writeFile(
    `${outputFolder}/Hello/index.html`,
    nunjucks.render(`${__dirname}/templates/entity.html`, {
      entity,
      version: packageJson.version,
      name: packageJson.name,
    }),
  );

  await writeFile(
    `${outputFolder}/index.html`,
    `
  <html>
    <head>
    <meta http-equiv="refresh" content="0;url=/Hello" />
    <title>Page Moved</title>
    </head>
    <body>
      Click <a href="/Hello">here</a> if you are not redirected...
    </body>
  </html>
  `,
  );
};

export const wordCount = (articleText: string): number =>
  articleText.split(" ").length;

export const renderEntity = async (outputFolder: string, entity: Entity) => {
  await writeFile(
    `${outputFolder}/${entity.uri}/index.html`,
    nunjucks.render(`${__dirname}/templates/entity.html`, {
      entity: entity,
      version: packageJson.version,
      name: packageJson.name,
    }),
  );
};

export const maybeReadme = async (articleRoot: string, entity: Entity) => {
  let ret: {
    source: string;
    html: string;
  } | null;

  try {
    let source = (
      await readFile(`${articleRoot}/${entity.path}/README.md`)
    ).toString();

    let html = parser.render(source);

    ret = {
      source,
      html,
    };
  } catch (e) {
    ret = null;
  }

  return ret;
};

export const renderRawArticle = async (
  outputFolder: string,
  article: Article,
) => {
  try {
    await mkdir(`${outputFolder}/${article.uri}/raw`);
  } catch (error) {
    if (!(error as Error).message.includes("EEXIST")) {
      console.log(`Error creating raw entity folder: ${article.uri}`);
    }
  }

  await writeFile(
    `${outputFolder}/${article.uri}/raw/index.html`,
    highlight.highlight(article.source!, {
      language: "markdown",
    }).value,
  );
};

export const createSingleEntity = async (
  articleRoot: string,
  outputFolder: string,
  entity: Entity,
): Promise<void> => {
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

  let entityToMake = `${outputFolder}/${uri}`;

  try {
    await mkdir(entityToMake, { recursive: true });
  } catch (error) {
    if (!(error as Error).message.includes("EEXIST")) {
      console.error(`Problem creating ${entityToMake}: ${error}`);
    }
  }

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
      readme: await maybeReadme(articleRoot, entity),
    };
  }

  await writeFile(
    `${entityToMake}/index.json`,
    JSON.stringify(data, null, JSON_PADDING),
  );

  await renderEntity(outputFolder, data);

  if (entity.type === "article") {
    await renderRawArticle(outputFolder, data);
  }
};

export const createEntities = async ({
  articleRoot,
  outputFolder,
  listOfEntities,
}: Bock): Promise<void> => {
  const bar = new cliProgress.Bar({
    format: "[{bar}] {percentage}% | {value}/{total} | Processing: {entity}",
    synchronousUpdate: false,
  });

  bar.start(listOfEntities.length, 0, { entity: "N/A" });

  await Promise.all(
    listOfEntities.map(async (entity, index) => {
      // This doesn't work as expected...
      bar.update(index + 1, {
        entity: entity.name,
      });

      await createSingleEntity(articleRoot, outputFolder, entity);
    }),
  );

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

export const generateIdFrom = (articleRoot: string, articlePath: string) =>
  uuidv5(`${articleRoot}/${articlePath}`, UUID_NAMESPACE);

export const generatePrettyPath = (entityPath: string) =>
  entityPath.replace(/\s+/g, "_");

export const removeExtension = (articlePath: string) =>
  articlePath.replace(extname(articlePath), "");

export const generateHierarchyFrom = (
  articleRoot: string,
  articlePath: string,
): EntityHierarchy[] => {
  const initialList = [
    ROOT_NODE_NAME,
    ...articlePath
      .replace(articleRoot, "")
      .split("/")
      .filter((p) => p !== ""),
  ].map((e) => ({
    name: removeExtension(e),
    type: extname(e).toLowerCase().includes("md") ? "article" : "folder",
    uri: removeExtension(generatePrettyPath(e.replace(`${articleRoot}/`, ""))),
  }));

  let finalList: any[] = [
    {
      ...initialList[0],
      uri: "",
    },
  ];

  for (let i = 1; i < initialList.length; i++) {
    finalList.push({
      name: initialList[i].name,
      type: initialList[i].type,
      uri: initialList
        .slice(1, i + 1)
        .map((_) => _.uri)
        .reduce((a, v) => a + "/" + v),
    });
  }

  return finalList;
};

export const getEntities = async (
  articleRoot: string,
  prefix: string = "",
  maxDepth: number = MAX_DEPTH,
): Promise<Record<string, Entity>> => {
  let ret: Record<string, Entity> = {};

  (
    await fg(`${articleRoot}${prefix !== "" ? "/" + prefix : ""}/**`, {
      deep: maxDepth,
      followSymbolicLinks: false,
      ignore: ENTITIES_TO_IGNORE,
      objectMode: true,
      onlyFiles: false,
      stats: true,
    })
  )
    .filter(
      (e) =>
        (e.dirent.isFile() || e.dirent.isDirectory()) &&
        !e.path.includes(ASSETS_FOLDER),
    )
    .map((e) => {
      let path = e.path.replace(`${articleRoot}/`, "");

      ret[path] = {
        id: generateIdFrom(articleRoot, e.path),
        created: e.stats!.ctime,
        hierarchy: generateHierarchyFrom(articleRoot, e.path),
        modified: e.stats!.mtime,
        type: e.dirent.isFile() ? "article" : "folder",
        sizeInBytes: e.stats!.size,
        name: removeExtension(e.name),
        uri: removeExtension(
          generatePrettyPath(e.path.replace(`${articleRoot}/`, "")),
        ),
        path: e.path.replace(`${articleRoot}/`, ""),
      };
    });

  return ret;
};
