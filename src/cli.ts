import { Command } from "commander";

const bockCLI = new Command();

bockCLI
  .version("1.0.0")
  .requiredOption(
    "-a, --article-root <articleRoot>",
    "Git repo containing your articles"
  )
  .option("-d, --debug", "Show debugging information", false);

export default bockCLI;
