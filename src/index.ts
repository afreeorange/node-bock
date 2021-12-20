#!/usr/bin/env node

import { writeFile } from "fs/promises";

import chokidar from "chokidar";
import { sort } from "fast-sort";

import CLI from "./cli";
import {
  createEntities,
  createSingleEntity,
  copyAssets,
  createHome,
  createSearch,
  createRoot,
  createRandom,
} from "./writers";
import { createDatabase } from "./database";
import { getEntities } from "./readers";
import { Bock } from "./types";

(async () => {
  CLI.parse(process.argv);
  const { articleRoot, outputFolder, watch, prettify } = CLI.opts();

  const entities = await getEntities(articleRoot);
  const bock: Bock = {
    articleRoot,
    outputFolder,
    entities,
    listOfEntities: sort(Object.values(entities)).asc((e) => e.name),
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

  await createHome(bock);
  console.log(`Rendered Homepage`);

  await createSearch(bock);
  console.log(`Rendered Search`);

  await createRoot(bock);
  console.log(`Rendered Root`);

  await createRandom(bock);
  console.log(`Rendered Random`);

  copyAssets(bock);
  console.log(`Copied static assets`);

  createDatabase(bock);
  console.log(`Generated SQLite Database`);

  if (watch) {
    console.log(`Watching ${articleRoot} for changes`);
    const watcher = chokidar.watch([`${articleRoot}/**/*.md`], {
      persistent: true,
    });

    watcher.on("change", async (path) => {
      let _path = path.replace(`${articleRoot}/`, "");
      console.log(`${_path} changed... re-rendering`);

      await createSingleEntity(bock, entities[_path]);
    });
  }
})();
