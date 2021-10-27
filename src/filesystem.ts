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

export const createSingleEntity = async (
  articleRoot: string,
  outputFolder: string,
  entity: Entity,
): Promise<void> => {
  const {
    type,
    created,
    modified,
    sizeInBytes,
    hierarchy,
    id,
    name,
    sourceFile,
    path,
  } = entity;

  let entityToMake = `${outputFolder}/${path}`;

  try {
    await mkdir(entityToMake);
  } catch (error) {
    if (!(error as Error).message.includes("EEXIST")) {
      console.error(`Problem creating ${entityToMake}`);
    }
  }

  let data;
  if (type === "article") {
    const articleText = (
      await readFile(`${articleRoot}/${sourceFile}`)
    ).toString();

    data = {
      created,
      modified,
      hierarchy,
      id,
      name,
      type,

      sizeInBytes,
      source: articleText,
      wordCount: wordCount(articleText),
      excerpt: "",
      html: parser.render(articleText),

      uncommitted: false,
      revisions: [],
    };
  } else {
    const children = await getEntities(articleRoot, name, 1);

    data = {
      created,
      modified,
      hierarchy,
      id,
      name,
      type,
      children: children.map((c) => ({
        name: c.name,
        type: c.type,
        path: c.path,
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
    createSingleEntity(articleRoot, outputFolder, e);
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
  path: string;
  type: EntityType;
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
    path: removeExtension(generatePrettyPath(e)),
    type: extname(e).toLowerCase().includes("md") ? "article" : "folder",
  }));

type EntityType = "article" | "folder";

type Entity = {
  created: Date;
  createdRelative: Date;
  sourceFile: string | null;
  hierarchy: EntityHierarchy[];
  id: string;
  modified: Date;
  modifiedRelative: Date;
  name: string;
  path: string;
  sizeInBytes: number;
  type: EntityType;
};

export const getEntities = async (
  articleRoot: string,
  prefix: string = "",
  maxDepth: number = MAX_DEPTH,
): Promise<Entity[]> =>
  (
    await fg(`${articleRoot}${prefix !== "" ? "/" + prefix : ""}/**`, {
      deep: maxDepth,
      followSymbolicLinks: false,
      ignore: ENTITIES_TO_IGNORE,
      markDirectories: true,
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
      created: e.stats!.ctime,
      createdRelative: e.stats!.ctime,
      sourceFile: e.dirent.isFile()
        ? e.path.replace(`${articleRoot}/`, "")
        : null,
      hierarchy: generateHierarchyFrom(articleRoot, e.path),
      id: generateIdFrom(articleRoot, e.path),
      modified: e.stats!.mtime,
      modifiedRelative: e.stats!.mtime,
      name: removeExtension(e.name),
      path: removeExtension(
        generatePrettyPath(e.path.replace(`${articleRoot}/`, "")),
      ),
      sizeInBytes: e.stats!.size,
      type: e.dirent.isFile() ? "article" : "folder",
    }));
