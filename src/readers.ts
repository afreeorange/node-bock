import { readFile } from "fs/promises";

import fg from "fast-glob";

import { ASSETS_FOLDER, ENTITIES_TO_IGNORE, MAX_DEPTH } from "./constants";
import {
  generateHierarchyFrom,
  generateIdFrom,
  generatePrettyPath,
  removeExtension,
} from "./helpers";
import parser from "./parser";
import { Bock, Entity } from "./types";

export const getReadme = async ({ articleRoot }: Bock, entity: Entity) => {
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

export const getEntities = async (
  articleRoot: string,
  prefix: string = "",
  maxDepth: number = MAX_DEPTH,
): Promise<Record<string, Entity>> => {
  let ret: Record<string, Entity> = {};

  (
    await fg(`${articleRoot}${prefix !== "" ? "/" + prefix : ""}/**/*.md`, {
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
