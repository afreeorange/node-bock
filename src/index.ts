#!/usr/bin/env node

import { writeFile } from "fs/promises";

import chokidar from "chokidar";
import { sort } from "fast-sort";

import { Bock } from "./types";
import { getArguments } from "./cli";

import readEntities from "./readers";

import writeAssets from "./writers/assets";
import writeDatabase from "./writers/database";
import writeHome from "./writers/home";
import writeSearch from "./writers/search";
import writeRandom from "./writers/random";
import writeEntities from "./writers/entities";

(async () => {
  const {
    articleRoot,
    outputFolder,
    watch,
    prettify,
    progress: showProgress,
  } = getArguments();

  const entities = await readEntities(articleRoot);

  /**
   * Prepare the Bock object.
   */
  const bock: Bock = {
    articleRoot,
    outputFolder,
    entities,

    /**
     * NOTE: Sorting here by path. This is what most pages require. The home
     * page requires sorting by last modified.
     */
    listOfEntities: sort(Object.values(entities)).asc("path"),

    /**
     * NOTE: This is unused as of now. Might use it to make trees on the
     * articles page later.
     */
    listOfPaths: Object.keys(entities),
    prettify,
    showProgress,
  };

  await writeFile(
    `${bock.outputFolder}/entities.json`,
    JSON.stringify(entities, null, 2),
  );

  console.log(`Found ${bock.listOfEntities.length} entities in ${articleRoot}`);
  console.log(`Output folder is ${outputFolder}`);

  console.log(`Going to write ${bock.listOfEntities.length} articles...`);
  await writeEntities(bock);
  console.log(`Finished writing articles`);

  await writeHome(bock);
  console.log(`Rendered Homepage`);

  await writeSearch(bock);
  console.log(`Rendered Search`);

  await writeRandom(bock);
  console.log(`Rendered Random`);

  writeAssets(bock);
  console.log(`Copied static assets`);

  writeDatabase(bock);
  console.log(`Generated SQLite Database`);

  // if (watch) {
  //   console.log(`Watching ${articleRoot} for changes`);
  //   const watcher = chokidar.watch([`${articleRoot}/**/*.md`], {
  //     persistent: true,
  //   });

  //   watcher.on("change", async (path) => {
  //     let _path = path.replace(`${articleRoot}/`, "");
  //     console.log(`${_path} changed... re-rendering`);

  //     await writeEntity(bock, entities[_path]);
  //   });
  // }
})();
