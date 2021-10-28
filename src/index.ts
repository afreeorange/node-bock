#!/usr/bin/env node

import CLI from "./cli";
import {
  createEntities,
  getEntities,
  copyAssets,
  renderEntities,
} from "./filesystem";

(async () => {
  CLI.parse(process.argv);
  const { articleRoot, outputFolder } = CLI.opts();

  const entries = await getEntities(articleRoot);
  await createEntities(articleRoot, outputFolder, entries);
  console.log(`Finished writing ${entries.length} entities`);
  await renderEntities(articleRoot, outputFolder, entries);
  copyAssets(outputFolder);

  console.log(`Found ${entries.length} entities in ${articleRoot}`);
  console.log(`Output folder is ${outputFolder}`);

  // entries.map((e) => console.log(e));
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
