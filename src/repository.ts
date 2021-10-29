// import fs from "fs";
// import git, { ReadCommitResult } from "isomorphic-git";
// import { RevisionSummary } from "./types";
// const { StringDecoder } = require("string_decoder");

// export const decoder = new StringDecoder("utf8");

// const refineRevision = (commit: ReadCommitResult): RevisionSummary => ({
//   id: commit.oid,
//   author: commit.commit.author.name,
//   email: commit.commit.author.email,
//   committed: new Date(commit.commit.author.timestamp * 1000),
//   message: commit.commit.message,
// });

// export const getRevisions = async (
//   articleRoot: string,
//   articlePath: string
// ): Promise<RevisionSummary[]> =>
//   (
//     await git.log({
//       fs,
//       dir: articleRoot,
//       filepath: articlePath,
//       force: true,
//       follow: true,
//     })
//   ).map((c) => refineRevision(c));

// export const getRevision = async (
//   articleRoot: string,
//   articlePath: string,
//   commitId: string
// ): Promise<string> => {
//   const { blob } = await git.readBlob({
//     fs,
//     dir: articleRoot,
//     filepath: articlePath,
//     oid: commitId,
//   });

//   return decoder.write(blob);
// };

// // export const readArticle = async (articlePath: string): Promise<string> => {
// //   return fs.readFile(articlePath);
// // };

// export const isRootAGitRepoOnMaster = async (
//   articleRoot: string
// ): Promise<boolean> => {
//   try {
//     return (
//       (await git.currentBranch({
//         fs,
//         dir: articleRoot,
//       })) === "master"
//     );
//   } catch (e) {
//     return false;
//   }
// };

// /**
//  * The result is returned as a 2D array.
//  * The outer array represents the files and/or blobs in the repo, in alphabetical order.
//  * The inner arrays describe the status of the file:
//  * the first value is the filepath, and the next three are integers
//  * representing the HEAD status, WORKDIR status, and STAGE status of the entry.
//  *
//  * ```js
//  * // example StatusMatrix
//  * [
//  *   ["a.txt", 0, 2, 0], // new, untracked
//  *   ["b.txt", 0, 2, 2], // added, staged
//  *   ["c.txt", 0, 2, 3], // added, staged, with unstaged changes
//  *   ["d.txt", 1, 1, 1], // unmodified
//  *   ["e.txt", 1, 2, 1], // modified, unstaged
//  *   ["f.txt", 1, 2, 2], // modified, staged
//  *   ["g.txt", 1, 2, 3], // modified, staged, with unstaged changes
//  *   ["h.txt", 1, 0, 1], // deleted, unstaged
//  *   ["i.txt", 1, 0, 0], // deleted, staged
//  * ]
//  * ```
//  *
//  * - The HEAD status is either absent (0) or present (1).
//  * - The WORKDIR status is either absent (0), identical to HEAD (1), or different from HEAD (2).
//  * - The STAGE status is either absent (0), identical to HEAD (1), identical to WORKDIR (2), or different from WORKDIR (3).
//  *
//  * ```ts
//  * type Filename      = string
//  * type HeadStatus    = 0 | 1
//  * type WorkdirStatus = 0 | 1 | 2
//  * type StageStatus   = 0 | 1 | 2 | 3
//  *
//  * type StatusRow     = [Filename, HeadStatus, WorkdirStatus, StageStatus]
//  *
//  * type StatusMatrix  = StatusRow[]
//  * ```
//  *
//  * > Think of the natural progression of file modifications as being from HEAD (previous) -> WORKDIR (current) -> STAGE (next).
//  * > Then HEAD is "version 1", WORKDIR is "version 2", and STAGE is "version 3".
//  * > Then, imagine a "version 0" which is before the file was created.
//  * > Then the status value in each column corresponds to the oldest version of the file it is identical to.
//  * > (For a file to be identical to "version 0" means the file is deleted.)
//  *
//  * Here are some examples of queries you can answer using the result:
//  *
//  * #### Q: What files have been deleted?
//  * ```js
//  * const FILE = 0, WORKDIR = 2
//  *
//  * const filenames = (await statusMatrix({ dir }))
//  *   .filter(row => row[WORKDIR] === 0)
//  *   .map(row => row[FILE])
//  * ```
//  *
//  * #### Q: What files have unstaged changes?
//  * ```js
//  * const FILE = 0, WORKDIR = 2, STAGE = 3
//  *
//  * const filenames = (await statusMatrix({ dir }))
//  *   .filter(row => row[WORKDIR] !== row[STAGE])
//  *   .map(row => row[FILE])
//  * ```
//  *
//  * #### Q: What files have been modified since the last commit?
//  * ```js
//  * const FILE = 0, HEAD = 1, WORKDIR = 2
//  *
//  * const filenames = (await statusMatrix({ dir }))
//  *   .filter(row => row[HEAD] !== row[WORKDIR])
//  *   .map(row => row[FILE])
//  * ```
//  *
//  * #### Q: What files will NOT be changed if I commit right now?
//  * ```js
//  * const FILE = 0, HEAD = 1, STAGE = 3
//  *
//  * const filenames = (await statusMatrix({ dir }))
//  *   .filter(row => row[HEAD] === row[STAGE])
//  *   .map(row => row[FILE])
//  * ```
//  *
//  * For reference, here are all possible combinations:
//  *
//  * | HEAD | WORKDIR | STAGE | `git status --short` equivalent |
//  * | ---- | ------- | ----- | ------------------------------- |
//  * | 0    | 0       | 0     | ``                              |
//  * | 0    | 0       | 3     | `AD`                            |
//  * | 0    | 2       | 0     | `??`                            |
//  * | 0    | 2       | 2     | `A `                            |
//  * | 0    | 2       | 3     | `AM`                            |
//  * | 1    | 0       | 0     | `D `                            |
//  * | 1    | 0       | 1     | ` D`                            |
//  * | 1    | 0       | 3     | `MD`                            |
//  * | 1    | 1       | 0     | `D ` + `??`                     |
//  * | 1    | 1       | 1     | ``                              |
//  * | 1    | 1       | 3     | `MM`                            |
//  * | 1    | 2       | 0     | `D ` + `??`                     |
//  * | 1    | 2       | 1     | ` M`                            |
//  * | 1    | 2       | 2     | `M `                            |
//  * | 1    | 2       | 3     | `MM`                            |
//  */
// export const getArticlesAndStatus = async (articleRoot: string): Promise<any> =>
//   await git.statusMatrix({
//     fs,
//     dir: articleRoot,
//     filter: (f: string) => f.endsWith(".md"),
//   });
