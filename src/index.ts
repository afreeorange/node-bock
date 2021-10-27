#!/usr/bin/env node

import CLI from "./cli";
import { createEntities, getEntities, copyAssets } from "./filesystem";

(async () => {
  CLI.parse(process.argv);
  const { articleRoot, outputFolder } = CLI.opts();

  const entries = await getEntities(articleRoot);
  // entries.map((e) => console.log(e));
  await createEntities(articleRoot, outputFolder, entries);
  console.log(`Finished writing ${entries.length} entities`);
  copyAssets(outputFolder);

  console.log(`Found ${entries.length} entities in ${articleRoot}`);
  console.log(`Output folder is ${outputFolder}`);
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
