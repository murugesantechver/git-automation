const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");

const repoDetails = require("./repo.config").repoConfig;

const owner = repoDetails.gitHubOwner;
const repo = repoDetails.currentRepo;
const branch = repoDetails.branch;

const fileName = "file.txt";
const filePath = path.join(__dirname, fileName);

const octokit = new Octokit({ auth: process.env.PAT });

const getBaseTreeSha = async () => {
  const response = await octokit.git.getRef({
    owner,
    repo,
    ref: branch,
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
        mode: "100644",
        content: fileContent,
      },
    ],
  });
  return response.data.sha;
};

const createCommit = async (treeSha, parentSha, commitMessage) => {
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
    ref: branch,
    sha: commitSha,
  });
};

const commitAndPush = async () => {
  try {
    const commitMessage = `Updated file.txt at ${new Date().toUTCString()}`;

    const fileContent = fs.readFileSync(filePath, "utf8");
    const baseTreeSha = await getBaseTreeSha();
    const newTreeSha = await createTree(baseTreeSha, fileContent);
    const newCommitSha = await createCommit(
      newTreeSha,
      baseTreeSha,
      commitMessage
    );

    await updateMasterBranch(newCommitSha);

    console.log("File committed and pushed successfully.");
  } catch (error) {
    console.error("Error committing and pushing file:", error);
  }
};

const pullAndUpdate = async (branch) => {
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path: fileName,
      ref: branch,
    });

    const fileContent = Buffer.from(
      fileData.content,
      fileData.encoding
    ).toString("utf8");

    fs.writeFileSync(filePath, fileContent);

    console.log(
      `File ${fileName} pulled and updated successfully from branch ${branch}.`
    );
  } catch (error) {
    console.error(
      `Error pulling and updating file from branch ${branch}:`,
      error
    );
  }
};

const createNewBranchFromMaster = async (newBranch) => {
  try {
    const {
      data: {
        object: { sha: masterSha },
      },
    } = await octokit.git.getRef({
      owner,
      repo,
      ref: branch,
    });

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${newBranch}`,
      sha: masterSha,
    });

    console.log(`New branch ${newBranch} created successfully from master.`);
  } catch (error) {
    console.error(`Error creating new branch ${newBranch} from master:`, error);
  }
};

commitAndPush();
//pullAndUpdate(branch);
//createNewBranchFromMaster("new-feature-branch");
