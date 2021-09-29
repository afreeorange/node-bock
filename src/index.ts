#!/usr/bin/env node

import process from "process";

import chalk from "chalk";

import {
  isRootAGitRepoOnMaster,
  getArticlesAndStatus,
  getRevisions,
  getRevision,
} from "./repository";
import { makeArticle } from "./helpers";

const articleRoot = "/Users/nikhilanand/personal/wiki.nikhil.io.articles";

(async () => {
  console.log(chalk.yellow("Checking repository", articleRoot));

  if (!(await isRootAGitRepoOnMaster(articleRoot))) {
    console.log(chalk.red(`${articleRoot} is not a Git repo. Quitting!`));
    process.exit(1);
  }

  const status = await getArticlesAndStatus(articleRoot);
  console.log(`Found ${status.length} articles in repo`);

  // const commits = await getRevisions(
  //   articleRoot,
  //   "Turning Off Deep Sleep on Brother HL2350DW.md"
  // );
  // console.log("commits :>> ", commits);

  // console.log(revisions.map((r: any) => r.commit));

  // cd957036b5e4d093b5cb09b0dc99d2d58d131dc9
  // 5a5b1a32f41081d062ab86f8869a961bcad79668
  //   const revision = await getRevision(
  //     articleRoot,
  //     "Varnish.md",
  //     "5a5b1a32f41081d062ab86f8869a961bcad79668"
  //   );
  //   console.log(revision);

  const a = await makeArticle(
    articleRoot,
    "Turning Off Deep Sleep on Brother HL2350DW.md"
  );

  console.log("a :>> ", a);
})();
