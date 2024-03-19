const Max = require('max-api');
const path = require('node:path');
const simpleGit = require('simple-git');
const fs = require('fs').promises;

let repos = [];
const configPath = './config.json';
const repoFolder = 'repositories';
let directory = null;

async function checkRepos() {
    if (!directory) {
        Max.outlet('error', 'Directory is not set. Please set the directory first.');
        return;
    }

    const missingRepos = [];
    const fullPath = path.join(directory, repoFolder);

    for (const { repoUrl } of repos) {
        const repoName = new URL(repoUrl).pathname.split('/').pop().replace('.git', '');
        const repoPath = path.join(fullPath, repoName);

        try {
            await fs.access(path.join(repoPath, '.git'));
            Max.post(`Repository ${repoName} exists.`);
        } catch (error) {
            missingRepos.push(repoName);
            Max.post(`Repository ${repoName} does not exist.`);
        }
    }

    if (missingRepos.length > 0) {
        Max.outlet('missingRepos', JSON.stringify(missingRepos));
        Max.post(`Missing repositories: ${missingRepos.join(', ')}. Consider cloning.`);
        Max.outlet('info', 'status', 'clone')
    } else {
        Max.post('All specified repositories exist.');
        Max.outlet('info', 'All repositories are present. Consider pulling updates with the "pull" command.');
        Max.outlet('info', 'status', 'pull')
    }
}


async function readAndSetReposFromJson() {
    try {
        const data = await fs.readFile(configPath, 'utf8');
        repos = JSON.parse(data).map(({ repoUrl, branch }) => ({ repoUrl, branch }));
        Max.post(`Repositories set from JSON: ${JSON.stringify(repos)}`);
    } catch (error) {
        Max.post(`Error reading JSON: ${error.message}`);
    }
}

readAndSetReposFromJson();

function setDirectory(dir) {
    directory = dir;
    Max.post(`Directory changed to ${directory}`);
}

async function cloneRepository(repoUrl, branch, repoDirectory) {
    await fs.mkdir(repoDirectory, { recursive: true });

    const git = simpleGit({
        progress({ method, stage, progress }) {
            if (stage == "receiving") {

                Max.outlet('clone', 'progress', progress);
            }
        },
    });

    Max.post("RepoDirectory: " + repoDirectory)

    try {
        // create folder
        await git.clone(repoUrl, repoDirectory, ['--recurse-submodules']);
        if (branch && branch !== 'main') {
            await git.cwd(repoDirectory);
            await git.checkout(branch);
        }
        Max.post(`Repository ${repoUrl} cloned successfully to ${repoDirectory}.`);
    } catch (error) {
        throw new Error(`Cloning failed for ${repoUrl}: ${error.message}`);
    }
}

async function cloneRepositories() {
    if (!directory) {
        Max.outlet('error', 'Directory is not set. Use "setDir [path]" to set directory.');
        return;
    }

    Max.post(`Starting cloning process for repositories to ${directory}/${repoFolder}`);
    for (const { repoUrl, branch } of repos) {
        const repoName = new URL(repoUrl).pathname.split('/').pop().replace('.git', '');
        const repoDirectory = path.join(directory, repoFolder, repoName);

        try {
            await cloneRepository(repoUrl, branch, repoDirectory);
        } catch (error) {
            Max.outlet('error', error.message);
        }
    }
    Max.post('Cloning process completed.');
}

async function pullRepository(repoUrl, branch, repoDirectory) {
    const git = simpleGit(repoDirectory);

    try {
        await git.pull('origin', branch);
        Max.post(`Repository ${repoUrl} pulled successfully in ${repoDirectory}.`);
    } catch (error) {
        throw new Error(`Pulling failed for ${repoUrl}: ${error.message}`);
    }
}

async function pullRepositories() {
    if (!directory) {
        Max.outlet('error', 'Directory is not set. Use "setDir [path]" to set directory.');
        return;
    }

    Max.post(`Starting pull process for repositories in ${directory}/${repoFolder}`);
    for (const { repoUrl, branch } of repos) {
        const repoName = new URL(repoUrl).pathname.split('/').pop().replace('.git', '');
        const repoDirectory = path.join(directory, repoFolder, repoName);

        try {
            await pullRepository(repoUrl, branch, repoDirectory);
        } catch (error) {
            Max.outlet('error', error.message);
        }
    }
    Max.post('Pull process completed.');
}

// Max handlers
Max.addHandler('setDir', (dir) => {
    setDirectory(dir);
});

Max.addHandler('setReposFromJson', async () => {
    await readAndSetReposFromJson();
});

Max.addHandler('clone', async () => {
    await cloneRepositories();
});

Max.addHandler('pull', async () => {
    await pullRepositories();
});

Max.addHandler('checkRepos', async () => {
    await checkRepos();
});