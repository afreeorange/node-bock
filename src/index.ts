#!/usr/bin/env node

import { writeFile } from "fs/promises";
import CLI from "./cli";
import { createEntities, getEntities, copyAssets } from "./filesystem";

(async () => {
  CLI.parse(process.argv);
  const { articleRoot, outputFolder } = CLI.opts();

  const listOfEntities = await getEntities(articleRoot);
  await createEntities(articleRoot, outputFolder, listOfEntities);
  await copyAssets(articleRoot, outputFolder);

  // await writeFile(
  //   "/Users/nikhil/Downloads/out.json",
  //   JSON.stringify(listOfEntities, null, 2),
  // );

  console.log(`Finished writing ${listOfEntities.length} entities`);
  console.log(`Found ${listOfEntities.length} entities in ${articleRoot}`);
  console.log(`Output folder is ${outputFolder}`);

  // listOfEntities.map((e) => console.log(e));
})();

/**
 * Food/index.json
 * Food/Thai_Curry_Experiments/index.json
 * Food/Thai_Curry_Experiments/Thai_Green_Curry_Chicken_-_Instant_Pot/index.json
 * Food/Thai_Curry_Experiments/Thai_Green_Curry_Chicken_-_Instant_Pot/revisions/asjahsd718273kqbwfaki011.json
 * Food/Thai_Curry_Experiments/Thai_Green_Curry_Chicken_-_Instant_Pot/revisions/asjahsd718273kqbwfaki011.json
 * Food/Thai_Curry_Experiments/Thai_Green_Curry_Chicken_-_Instant_Pot/revisions/asjahsd718273kqbwfaki011.json
 * Food/Thai_Curry_Experiments/Thai_Green_Curry_Chicken_-_Instant_Pot/revisions/asjahsd718273kqbwfaki011.json
 * Food/Thai_Curry_Experiments/Thai_Green_Curry_Chicken_-_Instant_Pot/revisions/asjahsd718273kqbwfaki011.json
 */
