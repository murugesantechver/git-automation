const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");

const owner = "quilotechver";
const repo = "geo-loc-fetch";
const fileName = "file.txt";
const commitMessage = `Updated file.txt at ${new Date().toUTCString()}`;
const filePath = path.join(__dirname, fileName);

const octokit = new Octokit({ auth: process.env.PAT });

const getBaseTreeSha = async () => {
  const response = await octokit.git.getRef({
    owner,
    repo,
    ref: "heads/master",
  });
  return response.data.object.sha;
};

const createTree = async (baseTreeSha, fileContent) => {
  const response = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: [
      {
        path: fileName,
        mode: "100644", // regular file mode
        content: fileContent,
      },
    ],
  });
  return response.data.sha;
};

const createCommit = async (treeSha, parentSha) => {
  const response = await octokit.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: treeSha,
    parents: [parentSha],
  });
  return response.data.sha;
};

const updateMasterBranch = async (commitSha) => {
  await octokit.git.updateRef({
    owner,
    repo,
    ref: "heads/master",
    sha: commitSha,
  });
};

const commitAndPush = async () => {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const baseTreeSha = await getBaseTreeSha();
    const newTreeSha = await createTree(baseTreeSha, fileContent);
    const newCommitSha = await createCommit(newTreeSha, baseTreeSha);

    await updateMasterBranch(newCommitSha);

    console.log("File committed and pushed successfully.");
  } catch (error) {
    console.error("Error committing and pushing file:", error);
  }
};

commitAndPush();
r;
