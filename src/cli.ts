import { Command } from "commander";

import packageJson from "../package.json";

const bockCLI = new Command();

bockCLI
  .version(packageJson.version)
  .requiredOption(
    "-a, --article-root <articleRoot>",
    "Git repo containing your articles",
  )
  .requiredOption(
    "-o, --output-folder <outputFolder>",
    "Output folder for generated articles",
  )
  .option("-d, --debug", "Show debugging information", false)
  .option("-s, --serve", "Run a local live-reloading server", false)
  .option("-b, --build", "Build all the static output", false)
  .option("-w, --watch", "Watch the output folder for changes", false)
  .option("-c, --clean", "Clear output folder before writing", false)
  .option("-p, --prettify", "Prettify output HTML (slow)", false);

export default bockCLI;
