import { extname } from "path";
import { mkdir, writeFile, readFile, stat } from "fs/promises";

import { copy } from "fs-extra";
import { v5 as uuidv5 } from "uuid";
import cliProgress from "cli-progress";
import fg from "fast-glob";
import highlight from "highlight.js";
import beautify from "js-beautify";

import { renderer } from "./renderer";
import packageJson from "../package.json";
import {
  ASSETS_FOLDER,
  BEAUTIFY_OPTIONS,
  ENTITIES_TO_IGNORE,
  HOME_PAGE_DOCUMENT,
  JSON_PADDING,
  MAX_DEPTH,
  ROOT_NODE_NAME,
  UUID_NAMESPACE,
} from "./constants";
import parser from "./parser";

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
    beautify.html(
      renderer.render(`${__dirname}/templates/articles.html`, {
        articles: listOfEntities,
        version: packageJson.version,
        name: packageJson.name,
        type: "articles",
      }),
      BEAUTIFY_OPTIONS,
    ),
  );
};

export const renderHome = async ({
  entities,
  articleRoot,
  outputFolder,
}: Bock) => {
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

    try {
      await mkdir(`${outputFolder}/Hello`);
    } catch (error) {
      if (!(error as Error).message.includes("EEXIST")) {
        console.error(`Problem creating ${outputFolder}/Hello: ${error}`);
      }
    }
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
    type: "article",
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
    beautify.html(
      renderer.render(`${__dirname}/templates/entity.html`, {
        entity,
        version: packageJson.version,
        name: packageJson.name,
        type: entity.type,
      }),
      BEAUTIFY_OPTIONS,
    ),
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
    <link rel="stylesheet" href="/styles.css" />

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

export const wordCount = (articleText: string): number =>
  articleText.split(" ").length;

export const renderEntity = async (outputFolder: string, entity: Entity) => {
  await writeFile(
    `${outputFolder}/${entity.uri}/index.html`,
    beautify.html(
      renderer.render(`${__dirname}/templates/entity.html`, {
        entity,
        version: packageJson.version,
        name: packageJson.name,
        type: entity.type,
      }),
      BEAUTIFY_OPTIONS,
    ),
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

export const renderRoot = async ({ articleRoot, outputFolder }: Bock) => {
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

  try {
    await mkdir(`${outputFolder}/ROOT`);
  } catch (error) {
    if (!(error as Error).message.includes("EEXIST")) {
      console.error(`Problem creating ${outputFolder}/ROOT: ${error}`);
    }
  }

  await writeFile(
    `${outputFolder}/ROOT/index.html`,
    beautify.html(
      renderer.render(`${__dirname}/templates/entity.html`, {
        entity,
        version: packageJson.version,
        name: packageJson.name,
        type: entity.type,
      }),
      BEAUTIFY_OPTIONS,
    ),
  );
};

export const renderRandom = async ({ listOfEntities, outputFolder }: Bock) => {
  try {
    await mkdir(`${outputFolder}/random`);
  } catch (error) {
    if (!(error as Error).message.includes("EEXIST")) {
      console.error(`Problem creating ${outputFolder}/random: ${error}`);
    }
  }

  await writeFile(
    `${outputFolder}/random/index.html`,
    beautify.html(
      renderer.render(`${__dirname}/templates/random.html`, {
        listOfEntities,
        version: packageJson.version,
        name: packageJson.name,
        type: "random",
      }),
      BEAUTIFY_OPTIONS,
    ),
  );
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
    beautify.html(
      renderer.render(`${__dirname}/templates/raw.html`, {
        entity: article,
        raw: highlight.highlight(article.source!, {
          language: "markdown",
        }).value,
        version: packageJson.version,
        name: packageJson.name,
        type: "raw",
      }),
      BEAUTIFY_OPTIONS,
    ),
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
    format: "[{bar}] {value} of {total} ({entity})",
    synchronousUpdate: false,
  });

  bar.start(listOfEntities.length, 0, { entity: "N/A" });

  for await (const e of listOfEntities) {
    await createSingleEntity(articleRoot, outputFolder, e);
    bar.increment({
      entity: e.name,
    });
  }

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
