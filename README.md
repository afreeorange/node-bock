# Bock

A static wiki generator. WIP. [See it in action here](https://wiki.nikhil.io/Home/). 

```bash
yarn exe --help
```

## TODO

* [ ] Check if git repo
* [ ] Check output folder
* [x] Home page
* [ ] remove trailing slashes
* [ ] LR local server
* [x] HTML generation
* [x] SQL generation job
* [x] SQL search JavaScript
* [ ] Tags?
* [ ] Stats
* [ ] Server
* [ ] Latest entries
* [ ] List of articles
* [x] RAW page
* [ ] Revisions page
* [ ] Compare page
* [ ] Plain text in search
* [ ] Excerpt
* [x] Search Page
* [ ] "This_is_a_Test!/Antoher/Damani&#39s_List_of_Jazz_101_Albums" <- quotes!

## Design Notes

To Templates: you will have a `type` 

Exceptions

* Root is `Home.md`
* Assets are in `__assets`
* `/articles` is special
* `/search` is special
* `/random` is special
* `/raw` is special
* `/revisions` is special
* `/ROOT` is special
* Can add a `README.md` to each folder except root for description

---

## Scratchpad

### Building

Doing this on a CircleCI/Ubuntu 20.04 image `cimg/node:14.15.2`:

```bash
npm i -g nexe
yarn
yarn clean
yarn build
```

```bash
find . -type f -exec gzip -9 '{}' \; -exec mv '{}.gz' '{}' \;
aws s3 sync . s3://wiki.nikhil.io/ --content-encoding gzip --delete --profile nikhil.io
```

```javascript
// serve(articleRoot);

// const gitOpen = util.promisify(Git.Repository.open);
// import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";
// const options: Partial<SimpleGitOptions> = {
//   baseDir: articleRoot,
//   binary: "git",
//   maxConcurrentProcesses: 6,
// };
// const git: SimpleGit = simpleGit(options);

// import {
//   isRootAGitRepoOnMaster,
//   getArticlesAndStatus,
//   getRevisions,
//   getRevision,
// } from "./repository";
// import { makeArticle } from "./helpers";

// (async () => {
//   const l = await git.log({ file: "Varnish.md" });

//   console.log("l :>> ", l);
// })();

// // Open the repository directory.
// Git.Repository.open(articleRoot)
//   // Open the master branch.
//   .then(function(repo) {
//     return repo.getMasterCommit();
//   })
//   // Display information about commits on master.
//   .then(function(firstCommitOnMaster) {
//     // Create a new history event emitter.
//     var history = firstCommitOnMaster.history();

//     // Create a counter to only show up to 9 entries.
//     var count = 0;

//     // Listen for commit events from the history.
//     history.on("commit", function(commit) {
//       // Disregard commits past 9.
//       if (++count >= 9) {
//         return;
//       }

//       // Show the commit sha.
//       console.log("commit " + commit.sha());

//       // Store the author object.
//       var author = commit.author();

//       // Display author information.
//       console.log("Author:\t" + author.name() + " <" + author.email() + ">");

//       // Show the commit date.
//       console.log("Date:\t" + commit.date());

//       // Give some space and show the message.
//       console.log("\n    " + commit.message());
//     });

//     // Start emitting events.
//     history.start();
//   });

// // (async () => {
// //   console.log(chalk.yellow("Checking repository", articleRoot));

// //   if (!(await isRootAGitRepoOnMaster(articleRoot))) {
// //     console.log(chalk.red(`${articleRoot} is not a Git repo. Quitting!`));
// //     process.exit(1);
// //   }

// //   const status = await getArticlesAndStatus(articleRoot);
// //   console.log(`Found ${status.length} articles in repo`);

// //   // const commits = await getRevisions(
// //   //   articleRoot,
// //   //   "Turning Off Deep Sleep on Brother HL2350DW.md"
// //   // );

// //   // console.log(revisions.map((r: any) => r.commit));

// //   // cd957036b5e4d093b5cb09b0dc99d2d58d131dc9
// //   // 5a5b1a32f41081d062ab86f8869a961bcad79668
// //   //   const revision = await getRevision(
// //   //     articleRoot,
// //   //     "Varnish.md",
// //   //     "5a5b1a32f41081d062ab86f8869a961bcad79668"
// //   //   );
// //   //   console.log(revision);

// //   const a = await makeArticle(
// //     articleRoot,
// //     "Turning Off Deep Sleep on Brother HL2350DW.md"
// //   );

// //   console.log("a :>> ", a);
// // })();
```

```javascript
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

/**
  new, untracked
  added, staged
  added, staged, with unstaged changes
  unmodified
  modified, unstaged
  modified, staged
  modified, staged, with unstaged changes
  deleted, unstaged
  deleted, staged
 */
```