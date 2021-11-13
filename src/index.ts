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
  createHome,
  createListOfArticles,
  createRoot,
  createRandom,
} from "./filesystem";

(async () => {
  CLI.parse(process.argv);
  const { articleRoot, outputFolder, watch, prettify } = CLI.opts();
  const entities = await getEntities(articleRoot);
  const bock: Bock = {
    articleRoot,
    outputFolder,
    entities,
    listOfEntities: Object.values(entities),
    listOfPaths: Object.keys(entities),
    prettify,
  };

  await writeFile(
    `${bock.outputFolder}/entities.json`,
    JSON.stringify(entities, null, 2),
  );

  console.log(`Found ${bock.listOfEntities.length} entities in ${articleRoot}`);
  console.log(`Output folder is ${outputFolder}`);

  await createEntities(bock);
  console.log(`Finished writing ${bock.listOfEntities.length} entities`);

  await copyAssets(bock);
  console.log(`Copied static assets`);

  await createHome(bock);
  console.log(`Rendered Homepage`);

  await createListOfArticles(bock);
  console.log(`Rendered Articles`);

  await createRoot(bock);
  console.log(`Rendered Root`);

  await createRandom(bock);
  console.log(`Rendered Random`);

  if (watch) {
    console.log(`Watching ${articleRoot} for changes`);
    const watcher = chokidar.watch([`${articleRoot}/**/*.md`], {
      persistent: true,
    });

    watcher.on("change", async (path) => {
      let _path = path.replace(`${articleRoot}/`, "");

      console.log(
        chalk.yellow(`${chalk.green(_path)} changed... re-rendering`),
      );

      await createSingleEntity(bock, entities[_path]);
    });
  }
})();
