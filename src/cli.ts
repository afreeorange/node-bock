import { Command } from "commander";

const bockCLI = new Command();

bockCLI
  .version("1.0.0")
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
  .option("-c, --clean", "Clear output folder before writing", false);

export default bockCLI;
