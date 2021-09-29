import { Article } from "./types";

import fs from "fs";
import util from "util";

const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

import { getRevisions } from "./repository";

/**
 * A _very_ crude word count for each article
 *
 * @param articleText Article text to count words in
 * @returns Number of words in article
 */
export const wordCount = (articleText: string): number =>
  articleText.split(" ").length;

export const makeArticle = async (
  articleRoot: string,
  articlePath: string
): Promise<Article> => {
  /**
   * Note that this reads all the contents into memory. This is OK. Articles
   * aren't that big.
   */
  const _path = `${articleRoot}/${articlePath}`;
  const articleText = (await readFile(_path)).toString();
  const { ctime, mtime, size } = await stat(_path);

  return {
    created: new Date(ctime),
    modified: new Date(mtime),
    sizeInBytes: size,
    source: articleText,
    wordCount: wordCount(articleText),
    entityPath: articlePath,
    excerpt: "",
    hierarchy: [],
    html: "",
    id: "",
    name: "",
    revisions: await getRevisions(articleRoot, articlePath),
    type: "article",
    uncommitted: false,
    uri: "",
  };
};


export const makeHierarchy = async (
  articleRoot: string,
  articlePath: string
): Promise<void> => {};

export const writeArticle = async (article: Article): Promise<void> => {};
export const writeRevision = async (article: Article): Promise<void> => {};