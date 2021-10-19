#!/usr/bin/env node

import serve from "./server";

// TODO: Use commander for article root and other options
const articleRoot = "/Users/nikhilanand/personal/wiki.nikhil.io.articles";

serve(articleRoot);

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
