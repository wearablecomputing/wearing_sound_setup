const Max = require('max-api'); // Import Max API
const path = require('node:path');
const simpleGit = require('simple-git'); // Import simple-git library
const fs = require('fs');

const repoFolderName = 'repositories'; // Name of the folder where repositories will be cloned

let directory;
let repos = {}; // Changed from repoUrls array to repos dictionary

// Function to read a json file and set repos from the json
function readJsonFile(file) {
    let json = JSON.parse(fs.readFileSync(file, 'utf8'));
    json.forEach(item => {
        repos[item.repoUrl] = item.branch; // Store repoUrl as key and branch as value
    });
    Max.post('Repos: ' + JSON.stringify(repos));
}

readJsonFile('config.json');

// Function to check if repositories already exist in the specified directory
function checkReposExist(dir) {
    setDirectory(dir);
    Max.post('Checking repositories in ' + directory + '...');

    if (!directory) {
        Max.outlet('error', 'Directory is not set. Please set the directory first.');
        return;
    }

    Object.keys(repos).forEach(repoUrl => { // Iterate over dictionary keys (repoUrls)
        Max.post("In loop");
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
    });
}

function setDirectory(dir) {
    directory = dir;
    Max.outlet('success', 'Directory changed to ' + directory);
    Max.post('Directory changed to ' + directory);
}

Max.addHandler('checkRepos', (folderPath) => {
    Max.post('Checking repositories in ' + folderPath + '...');
    checkReposExist(folderPath);
});

Max.addHandler('setDirectory', (dir) => {
    setDirectory(dir);
});


// Function to clone repositories
function cloneRepos(dir) {
    Max.post('Cloning repositories in ' + directory + '...');


    if (!directory) {
        Max.outlet('error', 'Directory is not set. Please set the directory first.');
        return;
    }

    Object.keys(repos).forEach(repoUrl => { // Iterate over dictionary keys (repoUrls)
        const repoName = new URL(repoUrl).pathname.split('/').pop().replace('.git', '');
        const repoDirectory = path.join(directory, repoFolderName, repoName);

        // Check if the repository directory exists
        if (fs.existsSync(repoDirectory)) {
            Max.outlet('info', `Repository ${repoName} already exists in ${repoDirectory}.`);
            Max.outlet('info', 'status', 'pull');
            git
        } else {
            git.clone(repoUrl, repoDirectory, (err, data) => {
                if (err) {
                    Max.outlet('error', `Error cloning repository ${repoName}: ${err}`);
                } else {
                    git.checkoutLocalBranch(repos[repoUrl], (err, data) => {
                        if (err) {
                            Max.outlet('error', `Error checking out branch ${repos[repoUrl]}: ${err}`);
                        } else {
                            Max.outlet('success', `Branch ${repoName} checked out successfully.`);
                        }
                    });
                    Max.outlet('success', `Repository ${repoName} cloned successfully.`);
                }
            });
            Max.outlet('info', `Repository ${repoName} does not exist and can be cloned.`);
            Max.outlet('info', 'status', 'clone');
        }
    });
}

Max.addHandler('clone', (folderPath) => {
    cloneRepos(folderPath);
});

// Function to pull repositories
function pullRepos(dir) {
    Max.post('Pulling repositories in ' + directory + '...');

    if (!directory) {
        Max.outlet('error', 'Directory is not set. Please set the directory first.');
        return;
    }

    Object.keys(repos).forEach(repoUrl => { // Iterate over dictionary keys (repoUrls)
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
    });
}

Max.addHandler('pull', (folderPath) => {
    pullRepos(folderPath);
});

