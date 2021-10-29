import { constants } from "fs";
import { extname } from "path";
import { red, yellow } from "chalk";
import { access, mkdir, writeFile, readFile } from "fs/promises";

import { copy } from "fs-extra";
import { v5 as uuidv5 } from "uuid";
import cliProgress from "cli-progress";
import fg from "fast-glob";
import nunjucks from "nunjucks";

import packageJson from "../package.json";
import {
  ASSETS_FOLDER,
  ENTITIES_TO_IGNORE,
  JSON_PADDING,
  MAX_DEPTH,
  ROOT_NODE_NAME,
  UUID_NAMESPACE,
} from "./constants";
import parser from "./parser";

export const entityExists = async (
  outputFolder: string,
  outputEntity: EntityHierarchy,
): Promise<boolean> => {
  try {
    await access(`${outputFolder}/${outputEntity}`, constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

/**
 * Render the Homepage if `Home.md` exists. If it doesn't put up a message.
 */
export const maybeRenderHome = async (articleRoot: string) => {
  let html;

  try {
    let source = (await readFile(`${articleRoot}/Home.md`)).toString();
    html = parser.render(source);
  } catch (e) {
    html = "(Could not find a <code>Home.md</code>. You should make one!)";
  }
};

export const wordCount = (articleText: string): number =>
  articleText.split(" ").length;

export const renderEntity = async (outputFolder: string, entity: Entity) => {
  await writeFile(
    `${outputFolder}/${entity.uri}/index.html`,
    nunjucks.render(`${__dirname}/templates/default.html`, {
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
      console.error(red(`Problem creating ${entityToMake}: ${error}`));
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
};

export const createEntities = async (
  articleRoot: string,
  outputFolder: string,
  listOfEntities: Entity[],
): Promise<void> => {
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(listOfEntities.length, 0);

  await Promise.all([
    listOfEntities.map(async (entity) => {
      /**
       * TODO: Why does this work and doing this at the end not?
       * https://github.com/npkgz/cli-progress/issues/104
       *
       * Try to understand this...
       */
      bar.increment(1);
      await createSingleEntity(articleRoot, outputFolder, entity);
    }),
  ]);

  bar.stop();
};

export const copyAssets = async (articleRoot: string, outputFolder: string) => {
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
