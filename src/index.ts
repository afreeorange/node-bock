#!/usr/bin/env node

import process from "process";

import chalk from "chalk";

import {
  isRootAGitRepoOnMaster,
  getArticlesAndStatus,
  getCommits,
  getRevision,
} from "./repository";

const articleRoot = "/Users/nikhilanand/personal/wiki.nikhil.io.articles";

(async () => {
  console.log(chalk.yellow("Checking repository", articleRoot));

  if (!(await isRootAGitRepoOnMaster(articleRoot))) {
    console.log(chalk.red(`${articleRoot} is not a Git repo. Quitting!`));
    process.exit(1);
  }

  //   const status = await getArticlesAndStatus(articleRoot);
  //   console.log(`Found ${status.length} articles in repo`);

  //   const commits = await getCommits(articleRoot, "Varnish.md");
  //   console.log(commits);

  // cd957036b5e4d093b5cb09b0dc99d2d58d131dc9
  // 5a5b1a32f41081d062ab86f8869a961bcad79668
  const { blob: revisionBlob } = await getRevision(
    articleRoot,
    "Varnish.md",
    "cd957036b5e4d093b5cb09b0dc99d2d58d131dc9"
  );
  console.log(revisionBlob);
})();
