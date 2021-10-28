import { constants } from "fs";
import { extname } from "path";
import { access, mkdir, writeFile, readFile } from "fs/promises";

import fg from "fast-glob";
import { v5 as uuidv5 } from "uuid";
import cliProgress from "cli-progress";

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

export const wordCount = (articleText: string): number =>
  articleText.split(" ").length;

export const renderEntities = async (
  articleRoot: string,
  outputFolder: string,
  listOfEntities: Entity[],
) => {
  listOfEntities.map(async (entity) => {
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

    let entityToRead = `${outputFolder}/${uri}/index.json`;
    let entityToMake = `${outputFolder}/${uri}/index.html`;

    let meta;
    try {
      meta = JSON.parse((await readFile(entityToRead)).toString());
    } catch (error) {
      console.error(`Could not write ${entityToMake}`);
    }

    if (entity.type === "article") {
      await writeFile(
        entityToMake,
        `
      <h1>${entity.name}</h1>
      ${meta.html}
      `,
      );
    } else {
      await writeFile(
        entityToMake,
        `
      <h1>${entity.name}</h1>
      <ul>
        ${entity.hierarchy
          .map(
            (e) =>
              `<li><a href="${e.name === ROOT_NODE_NAME ? "/" : e.uri}">${
                e.name
              }</a></li>`,
          )
          .join("")}
      </ul>
      <ul>
        ${meta.children
          .map((c: any) => `<li><a href="/${c.uri}">${c.name}</a></li>`)
          .join("")}
      </ul>
      `,
      );
    }
  });
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
    await mkdir(entityToMake);
  } catch (error) {
    if (!(error as Error).message.includes("EEXIST")) {
      console.error(`Problem creating ${entityToMake}`);
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
    const children = await getEntities(articleRoot, path, 1);

    data = {
      ...data,
      children: children.map((c) => ({
        name: c.name,
        type: c.type,
        path: c.path,
        uri: c.uri,
      })),
    };
  }

  await writeFile(
    `${entityToMake}/index.json`,
    JSON.stringify(data, null, JSON_PADDING),
  );
};

export const createEntities = async (
  articleRoot: string,
  outputFolder: string,
  listOfEntities: Entity[],
): Promise<void> => {
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(listOfEntities.length, 0);

  listOfEntities.map(async (e) => {
    /**
     * TODO: Why does this work and doing this at the end not?
     * https://github.com/npkgz/cli-progress/issues/104
     *
     * Try to understand this...
     */
    bar.increment(1);
    await createSingleEntity(articleRoot, outputFolder, e);
  });

  bar.stop();
};

export const copyAssets = (outputFolder: string) => {
  console.log("Will copy assets");
};

export const generateIdFrom = (articleRoot: string, articlePath: string) =>
  uuidv5(`${articleRoot}/${articlePath}`, UUID_NAMESPACE);

export const generatePrettyPath = (entityPath: string) =>
  entityPath.replace(/\s+/g, "_");

export const removeExtension = (articlePath: string) =>
  articlePath.replace(extname(articlePath), "");

type EntityHierarchy = {
  name: string;
  type: EntityType;
  uri: string;
};

export const generateHierarchyFrom = (
  articleRoot: string,
  articlePath: string,
): EntityHierarchy[] =>
  [
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

type EntityType = "article" | "folder";

type Entity = {
  created: Date;
  hierarchy: EntityHierarchy[];
  id: string;
  modified: Date;
  type: EntityType;

  sizeInBytes: number;

  // How to address an entity. Title, path on disk (relative), URI
  name: string;
  path: string;
  uri: string;

  children?: any[];
};

export const getEntities = async (
  articleRoot: string,
  prefix: string = "",
  maxDepth: number = MAX_DEPTH,
): Promise<Entity[]> => {
  console.log(
    "object :>> ",
    `${articleRoot}${prefix !== "" ? "/" + prefix : ""}/**`,
  );

  return (
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
        e.dirent.isFile() ||
        e.dirent.isDirectory() ||
        !e.path.includes(ASSETS_FOLDER),
    )
    .map((e) => ({
      id: generateIdFrom(articleRoot, e.path),
      created: e.stats!.ctime,
      hierarchy: generateHierarchyFrom(articleRoot, e.path),
      modified: e.stats!.mtime,
      type: e.dirent.isFile() ? "article" : "folder",

      name: removeExtension(e.name),
      uri: removeExtension(
        generatePrettyPath(e.path.replace(`${articleRoot}/`, "")),
      ),
      path: e.path.replace(`${articleRoot}/`, ""),

      sizeInBytes: e.stats!.size,
    }));
};
