import { constants } from "fs";
import { access, stat, readFile } from "fs/promises";

import { Article, EntityHierarchy, Folder } from "./types";

// /** ---- */

// export const maybeArticle = async (
//   articleRoot: string,
//   entityPath: string
// ): Promise<boolean> => {
//   try {
//     await access(`${articleRoot}/${entityPath}.md`, constants.R_OK);
//     return true;
//   } catch {
//     return false;
//   }
// };

// /**
//  * Figure out if the specified entity exists
//  */
// export const entityExists = async (
//   articleRoot: string,
//   entityPath: string
// ): Promise<boolean> => {
//   try {
//     await access(`${articleRoot}/${entityPath}`, constants.R_OK);
//     console.log(`${articleRoot}/${entityPath}`);
//     return true;
//   } catch {
//     return false;
//   }
// };

// /**
//  * Figure out if a given entity is an article or a folder
//  */
// export const entityType = async (
//   articleRoot: string,
//   entityPath: string
// ): Promise<"article" | "folder"> =>
//   (await stat(`${articleRoot}/${entityPath}`)).isDirectory()
//     ? "folder"
//     : "article";

// export const makeEntityPath = (entityPath: string): string =>
//   entityPath.replace(/\s+/g, "_").replace(/(\.md)/i, "");

// export const makeEntityHierarchy = async (
//   articleRoot: string,
//   entityPath: string
// ): Promise<any> => {
//   /**
//    * Start with `foo/bar/baz/lol.md`
//    *
//    * With this, we will have ["foo", "bar", "baz", "lol.md"]
//    *
//    */
//   const fragments = entityPath.split("/");

//   /**
//    * For our entity type checks we will need
//    *
//    * ["foo/bar/baz/lol.md", ""]
//    */

//   // const ret = [];
//   // console.log("FRAG", fragments);

//   // for (let i = 0; i > fragments.length; i++) {
//   //   const element = fragments[i];
//   //   ret
//   // }

//   const vals = await Promise.all([
//     fragments.map((f) => ({
//       name: f,
//       type: entityType(articleRoot, f),
//     })),
//   ]);

//   return vals;
// };

// /**
//  * A _very_ crude word count for each article
//  *
//  * @param articleText Article text to count words in
//  * @returns Number of words in article
//  */
// export const wordCount = (articleText: string): number =>
//   articleText.split(" ").length;

// export const makeEntity = async (
//   articleRoot: string,
//   entityPath: string
// ): Promise<Article | Folder | null> =>
//   (await entityExists(articleRoot, entityPath))
//     ? (await entityType(articleRoot, entityPath)) === "article"
//       ? await makeArticle(articleRoot, entityPath)
//       : await makeFolder(articleRoot, entityPath)
//     : null;

// export const makeArticle = async (
//   articleRoot: string,
//   articlePath: string
// ): Promise<Article> => {
//   /**
//    * Note that this reads all the contents into memory. This is OK. Articles
//    * aren't that big.
//    */
//   const _path = `${articleRoot}/${articlePath}`;
//   const articleText = (await readFile(_path)).toString();
//   const { ctime, mtime, size } = await stat(_path);

//   const foo = await makeEntityHierarchy(articleRoot, articlePath);
//   console.log(foo);

//   return {
//     created: new Date(ctime),
//     modified: new Date(mtime),
//     sizeInBytes: size,
//     source: articleText,
//     wordCount: wordCount(articleText),
//     entityPath: makeEntityPath(articlePath),
//     excerpt: "",
//     hierarchy: [],
//     html: "",
//     id: "",
//     name: "",
//     type: "article",
//     uri: "",

//     uncommitted: false,
//     revisions: [],
//   };
// };

// export const makeFolder = async (
//   articleRoot: string,
//   folderPath: string
// ): Promise<Folder> => {
//   /**
//    * Note that this reads all the contents into memory. This is OK. Articles
//    * aren't that big.
//    */
//   const _path = `${articleRoot}/${folderPath}`;
//   const { ctime, mtime, size } = await stat(_path);

//   return {
//     created: new Date(ctime),
//     modified: new Date(mtime),
//     sizeInBytes: size,
//     entityPath: folderPath,
//     hierarchy: [],
//     id: "",
//     name: "",
//     type: "folder",
//     uri: "",
//     children: {
//       articles: [],
//       count: 0,
//       folders: [],
//     },
//     readme: {
//       html: "",
//       present: false,
//       source: "",
//     },
//   };
// };

// export const makeHierarchy = async (
//   articleRoot: string,
//   articlePath: string
// ): Promise<void> => {};

// export const writeArticle = async (article: Article): Promise<void> => {};
// export const writeRevision = async (article: Article): Promise<void> => {};
