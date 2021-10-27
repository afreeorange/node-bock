#!/usr/bin/env node

import CLI from "./cli";
import { getEntities } from "./filesystem";

(async () => {
  CLI.parse(process.argv);
  const options = CLI.opts();
  const entries = await getEntities(options.articleRoot);

  entries.map((e: any) => console.log(e));
  // console.log(entries.length);
})();

// console.log("getDirectoryTree :>> ", getDirectoryTree(articleRoot));

const foo =
  "/Users/nikhilanand/personal/wiki.nikhil.io.articles/Food/Thai Curry Experiments/Basic Curry - 03.md";
