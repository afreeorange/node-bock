#!/usr/bin/env node

import { writeFile } from "fs/promises";
import chokidar from "chokidar";
import chalk from "chalk";

import CLI from "./cli";
import {
  createEntities,
  createSingleEntity,
  getEntities,
  copyAssets,
} from "./filesystem";

(async () => {
  CLI.parse(process.argv);
  const { articleRoot, outputFolder, watch } = CLI.opts();

  const entities = await getEntities(articleRoot);
  const listOfEntities = Object.values(entities);
  await writeFile(
    `${outputFolder}/entities.json`,
    JSON.stringify(entities, null, 2),
  );

  console.log(`Found ${listOfEntities.length} entities in ${articleRoot}`);
  console.log(`Output folder is ${outputFolder}`);

  await createEntities(articleRoot, outputFolder, listOfEntities);
  console.log(`Finished writing ${listOfEntities.length} entities`);

  await copyAssets(articleRoot, outputFolder);
  console.log(`Copied static assets`);

  if (watch) {
    console.log(`Watching ${articleRoot} for changes`);
    const watcher = chokidar.watch([`${articleRoot}/**/*.md`], {
      persistent: true,
    });

    watcher.on("change", async (path) => {
      console.log(chalk.gray(`${chalk.white(path)} changed: re-rendering...`));
      await createSingleEntity(
        articleRoot,
        outputFolder,
        entities[path.replace(`${articleRoot}/`, "")],
      );
    });
  }
})();
