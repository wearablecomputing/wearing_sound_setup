const Max = require('max-api'); // Import Max API
const path = require('node:path');
const simpleGit = require('simple-git'); // Import simple-git library
const fs = require('fs');

const repoFolderName = 'repositories'; // Name of the folder where repositories will be cloned

let directory;
let repoUrls = ['https://github.com/wearablecomputing/wearing_sound', 'https://github.com/wearablecomputing/optical-pleat-sensor'];


// Function to check if repositories already exist in the specified directory
function checkReposExist(dir, repoUrls) {

    setDirectory(dir);
    Max.post('Checking repositories in ' + directory + '...');


    if (!directory) {
        Max.outlet('error', 'Directory is not set. Please set the directory first.');
        return;
    }

    if (!Array.isArray(repoUrls)) {
        repoUrls = [repoUrls];
        Max.post('RepoUrls is not an array')
    }

    // Check each repository URL
    for (const repoUrl of repoUrls) {
        Max.post("In loop")
        const repoName = new URL(repoUrl).pathname.split('/').pop().replace('.git', '');
        const repoDirectory = path.join(directory, repoFolderName, repoName);

        // Check if the repository directory exists
        if (fs.existsSync(repoDirectory)) {
            Max.outlet('info', `Repository ${repoName} already exists in ${repoDirectory}.`);
            Max.outlet('info', 'status', 'pull');
        } else {
            Max.outlet('info', `Repository ${repoName} does not exist and can be cloned.`);
            Max.outlet('info', 'status', 'clone');
        }
    }
}

function setDirectory(dir) {
    directory = dir;
    Max.outlet('success', 'Directory changed to ' + directory);
    Max.post('Directory changed to ' + directory);
}

Max.addHandler('checkRepos', (folderPath) => {
    checkReposExist(folderPath, repoUrls);
});

Max.addHandler('setDir', (dir) => {
    setDirectory(dir);
});

Max.addHandler('setRepos', (...urls) => {
    repoUrls = urls;
    Max.outlet('success', 'Repositories set to ' + repoUrls.join(', '));
});

// This handler will listen for messages from Max
Max.addHandler('clone', async (...urls) => {
    let count = 0;
    if (!directory) {
        Max.outlet('error', 'Directory is not set. Use "setDir [path]" message to set directory.');
        return;
    }

    if (!Array.isArray(repoUrls)) {
        repoUrls = [repoUrls];
    }

    Max.outlet('clone', 'count', repoUrls.length);

    for (const repoUrl of repoUrls) {
        try {
            count++;
            const repoName = new URL(repoUrl).pathname.split('/').pop().replace('.git', '');
            const repoDirectory = path.join(directory, repoFolderName, repoName);
            const stage = `${count}/${repoUrls.length}`;

            Max.outlet('clone', 'status', 'stage', stage);
            Max.outlet('info', 'Cloning repository ' + repoUrl + ' to ' + repoDirectory);
            Max.outlet('clone', 'repo', repoName);

            const git = simpleGit({
                progress({ progress }) {
                    Max.outlet('clone', 'progress', progress);
                },
            });

            // Clone the repository with submodules
            await git.clone(repoUrl, repoDirectory, ['--recurse-submodules']);
            Max.outlet('clone', 'success', 'Repository cloned successfully to ' + repoDirectory + repoName);
            Max.outlet('clone', 'status', 'done');
        } catch (err) {
            Max.outlet('error', 'Failed to clone repository: ' + err.message);
            break;
        }
    }
});

Max.addHandler('pull', async () => {
    let count = 0;
    if (!directory) {
        Max.outlet('error', 'Directory is not set. Use "setDir [path]" message to set directory.');
        return;
    }

    Max.outlet('pull', 'count', repoUrls.length);

    for (const repoUrl of repoUrls) {
        try {
            count++;
            const repoName = new URL(repoUrl).pathname.split('/').pop().replace('.git', '');
            const repoDirectory = path.join(directory, repoFolderName, repoName);

            Max.post('repoDirectory', repoDirectory)
            const stage = `${count}/${repoUrls.length}`;

            Max.outlet('pull', 'status', 'stage', stage);
            Max.outlet('info', 'Pulling repository ' + repoUrl + ' in ' + repoDirectory);
            Max.outlet('pull', 'repo', repoName);

            const git = simpleGit({
                baseDir: repoDirectory,
                progress({ progress }) {
                    Max.outlet('pull', 'progress', progress);
                },
            });

            // Pull the repository and update submodules
            await git.pull();
            // await git.submoduleUpdate(['--init', '--recursive']);
            Max.outlet('pull', 'success', 'Repository pulled and submodules updated successfully in ' + repoDirectory);
            Max.outlet('pull', 'status', 'done');
        }
        catch (err) {
            Max.outlet('error', 'Failed to pull repository: ' + err.message);
        }
    }

    Max.outlet('ready', 'Script is ready to clone repositories. Send "clone [repoUrls]" message to start.');
});
