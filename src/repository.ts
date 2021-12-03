import Git, { Repository } from "nodegit";
import { GitError } from "simple-git";

const REPOSITORY = "/Users/nikhilanand/Downloads/wiki.nikhil.io.articles";

(async () => {
  let repo: Repository;

  try {
    repo = await Git.Repository.open(REPOSITORY);
  } catch (error) {
    console.error(
      "Could not open repository. Either the path is messed up or it's not a Git repository",
    );
  }

  // // Open the repository directory.
  // Git.Repository.open(REPOSITORY)
  //   // Open the master branch.
  //   .then(function (repo) {
  //     return repo.getMasterCommit();
  //   })
  //   // Display information about commits on master.
  //   .then(function (firstCommitOnMaster) {
  //     // Create a new history event emitter.
  //     var history = firstCommitOnMaster.history();

  //     // Create a counter to only show up to 9 entries.
  //     var count = 0;

  //     // Listen for commit events from the history.
  //     history.on("commit", function (commit) {
  //       // Disregard commits past 9.
  //       if (++count >= 9) {
  //         return;
  //       }

  //       // Show the commit sha.
  //       console.log("commit " + commit.sha());

  //       // Store the author object.
  //       var author = commit.author();

  //       // Display author information.
  //       console.log("Author:\t" + author.name() + " <" + author.email() + ">");

  //       // Show the commit date.
  //       console.log("Date:\t" + commit.date());

  //       // Give some space and show the message.
  //       console.log("\n    " + commit.message());
  //     });

  //     // Start emitting events.
  //     history.start();
  //   });

  if (repo) {
    const foo = (await repo.getBranchCommit("master")).author();
    console.log("foo :>> ", foo);
  }
})();
