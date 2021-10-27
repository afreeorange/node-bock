import { extname } from "path";

import dirTree from "directory-tree";
import fg from "fast-glob";
import { Entry } from "fast-glob/out/types";
import { v5 as uuidv5 } from "uuid";

import { MAX_DEPTH, ROOT_NODE_NAME, UUID_NAMESPACE } from "./constants";
import { Entity, EntityHierarchy } from "./types";

export const generateIdFrom = (articleRoot: string, articlePath: string) =>
  uuidv5(`${articleRoot}/${articlePath}`, UUID_NAMESPACE);

export const generateHierarchyFrom = (
  articleRoot: string,
  articlePath: string
): EntityHierarchy[] =>
  [
    ROOT_NODE_NAME,
    ...articlePath
      .replace(articleRoot, "")
      .split("/")
      .filter((p) => p !== ""),
  ].map((e) => ({
    name: e,
    type: extname(e).toLowerCase().includes("md") ? "article" : "folder",
  }));

export const refineRawListing = (articleRoot: string, listing: Entry[]): any =>
  listing
    .filter((e) => e.dirent.isFile() || e.dirent.isDirectory())
    .map((e) => ({
      id: generateIdFrom(articleRoot, e.path),
      created: e.stats?.ctime,
      modified: e.stats?.mtime,
      sizeInBytes: e.stats?.size,
      type: e.dirent.isFile() ? "article" : "folder",
      hierarchy: generateHierarchyFrom(articleRoot, e.path),
      name: e.name,
      path: e.path.replace(`${articleRoot}/`, ""),
    }));

export const getDirectoryTree = (articleRoot: string) =>
  dirTree(articleRoot, {
    followSymlink: false,
    attributes: ["isDirectory", "isFile"],
  });

/**
 * Get a list of entities in the specified article root
 *
 * @param articleRoot
 * @returns
 */
export const getEntities = async (
  articleRoot: string,
  prefix: string = ""
): Promise<any> =>
  refineRawListing(
    articleRoot,
    await fg(`${articleRoot}${prefix !== "" ? "/" + prefix : ""}/**`, {
      ignore: [".git"],
      deep: MAX_DEPTH,
      markDirectories: true,
      objectMode: true,
      stats: true,
      followSymbolicLinks: false,
      onlyFiles: false,
    })
  );
