import process from "process";
import chalk from "chalk";
import express from "express";
import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";

import { makeEntity } from "./helpers";

const server = (articleRoot: string, port: number = 3000) => {
  const app = express();

  app.get("/api", async (_, res) => {
    res.send({
      message: "Hello!",
    });
  });

  app.get(/\/api\/articles\/(.*)/, async (req, res) => {
    // const g = await git.log({ file: "Varnish.md" });

    res.send({
      //   g,
      ...(await makeEntity(
        articleRoot,
        `${req.params[0].replace("_", " ")}`
      )),
    });
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
};

export default server;
