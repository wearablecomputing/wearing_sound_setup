const Max = require('max-api');
const path = require('node:path');
const simpleGit = require('simple-git');
const fs = require('fs');
const fsPromises = fs.promises;
const fetch = require('node-fetch');
const decompress = require('decompress');
const os = require('os');
const { get } = require('node:http');

let repos = [];
let releases = [];
let missingRepos = [];

let packagePath = "";


const folderName = 'Wearing_Sound'
const configPath = './config.json';
const repoFolder = 'repositories';
const releaseFolder = 'releases'


let directory = null;

async function getPackagesFolder() {
    homeDir = os.homedir().toString();
    packagePath = path.join(homeDir, 'Documents', 'Max 8', 'Packages');
    directory = packagePath;
    Max.outlet('path', packagePath);
    Max.post("Set default path");

}

getPackagesFolder();

function setButtonText(text) {
    Max.outlet('js', 'setButtonText', text);
}

async function checkRepos() {
    if (!directory) {
        Max.outlet('error', 'Directory is not set. Please set the directory first.');
        return;
    }

    const fullPath = path.join(directory, folderName, repoFolder);

    for (const { repoUrl } of repos) {
        const repoName = new URL(repoUrl).pathname.split('/').pop().replace('.git', '');
        const repoPath = path.join(fullPath, repoName);

        try {
            await fsPromises.access(path.join(repoPath, '.git'));
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
        Max.outlet('js', 'setButtonText', "Install");
    } else {
        Max.post('All specified repositories exist.');
        Max.outlet('info', 'All repositories are present. Consider pulling updates with the "pull" command.');
        Max.outlet('info', 'status', 'pull')
        Max.outlet('js', 'setButtonText', 'Update');
    }
}


async function readAndSetReposFromJson() {
    try {
        // repos = [];
        // releases = [];
        // missingRepos = [];

        const data = await fsPromises.readFile(configPath, 'utf8');
        const jsonData = JSON.parse(data);
        repos = jsonData.repos.map(({ repoUrl, branch }) => ({ repoUrl, branch }));
        releases = jsonData.releases;
        Max.post(`Repositories set from JSON: ${JSON.stringify(repos)}`);
        Max.post(`Releases set from JSON: ${JSON.stringify(releases)}`);

        // log all repos and releases
        for (const repo of repos) {
            Max.post(`Repo: ${repo.repoUrl} Branch: ${repo.branch}`);
        }
        for (const release of releases) {
            Max.post(`Release: ${release}`);
        }
    } catch (error) {
        Max.post(`Error reading JSON: ${error.message}`);
    }
}

readAndSetReposFromJson();

function setDirectory(dir) {
    directory = dir;
    Max.post(`Directory changed to ${directory}`);
    readAndSetReposFromJson();
    checkRepos();
}

async function checkIfReleaseDownloaded(repoName) {
    const releasesPath = path.join(directory, folderName, 'releases', repoName);
    try {
        await fsPromises.access(releasesPath);
        return true; // The release exists
    } catch (error) {
        return false; // The release does not exist
    }
}

// Modified to check and download missing releases
async function checkAndDownloadReleases() {
    for (const repoUrl of releases) {
        Max.post("repoUrl: " + repoUrl)
        // repoUrl looks like this https://github.com/wearablecomputing/flash/
        const repo = new URL(repoUrl).pathname.replace('.git', '').split('/');
        const repoName = repo[2]
        const organization = repo[1]

        Max.post('org: ' + organization + ' name: ' + repoName);

        Max.post("Repo name: " + repoName);
        const isDownloaded = await checkIfReleaseDownloaded(repoName);
        if (!isDownloaded) {
            await downloadLatestRelease(repoUrl);
        } else {
            Max.post(`Release for ${repoName} already downloaded.`);
        }
    }
}

async function downloadLatestRelease(repoUrl) {
    const repo = new URL(repoUrl).pathname.replace('.git', '').split('/');
    const repoName = repo[2];
    const organization = repo[1];

    const apiURL = `https://api.github.com/repos/${organization}/${repoName}/releases/latest`;
    Max.post(apiURL);

    const response = await fetch(apiURL);
    const releaseData = await response.json();

    if (response.status !== 200) {
        Max.post(`Failed to fetch release info for ${repoName}: ${response.statusText}`);
        return;
    }

    Max.outlet('js', 'setInfoText', `Downloading release for ${repoName}`);

    // Determine the platform
    const platform = process.platform.includes('win32') ? 'Windows' : 'macOS';

    // Try to find a platform-specific asset; if none, use the first asset in the array
    let platformAsset = releaseData.assets.find(asset => asset.name.includes(platform)) || releaseData.assets[0];

    if (!platformAsset) {
        Max.post(`No assets found for the latest release of ${repoName}. Attempting to download source code zip.`);
        platformAsset = {
            browser_download_url: releaseData.zipball_url,
            name: `${repoName}-${releaseData.tag_name}.zip`
        };
    }

    Max.post(`Found asset or source zip: ${platformAsset.name}`);

    const downloadedReleasesPath = path.join(directory, folderName, 'releases', repoName);
    await fsPromises.mkdir(downloadedReleasesPath, { recursive: true });

    const response2 = await fetch(platformAsset.browser_download_url);
    if (!response2.ok) {
        Max.post(`Failed to download the asset: ${response2.statusText}`);
        Max.outlet('js', 'setInfoText', `Failed to download release for ${repoName}`);
        return;
    }

    const contentLength = response2.headers.get('Content-Length');
    let receivedLength = 0; // This will accumulate the number of bytes received

    const assetFileName = platformAsset.name;
    const releasePath = path.join(downloadedReleasesPath, assetFileName);
    const fileStream = fs.createWriteStream(releasePath);

    response2.body.on('data', (chunk) => {
        receivedLength += chunk.length;

        // convert to percent
        const progress = Math.round((receivedLength / contentLength) * 100);
        Max.outlet('js', 'setPrimaryWheelValue', progress);
    });

    return new Promise((resolve, reject) => {
        response2.body.pipe(fileStream);
        response2.body.on('error', (err) => {
            reject(err);
        });
        fileStream.on('finish', () => {
            // unzip the file
            decompress(releasePath, downloadedReleasesPath).then(() => {
                Max.post(`Downloaded and extracted release for ${repoName} from ${platformAsset.browser_download_url}.`);
                resolve();
            }).catch((err) => {
                reject(err);
            });
            // delete zip
            fs.unlinkSync(releasePath);
            Max.post(`Downloaded release for ${repoName} from ${platformAsset.browser_download_url}.`);
            Max.outlet('js', 'setInfoText', `Downloaded release for ${repoName}`);
            resolve();
        });
    });
}



async function cloneRepository(repoUrl, branch, repoDirectory) {
    await fsPromises.mkdir(repoDirectory, { recursive: true });

    Max.post("Cloning...");
    Max.outlet('js', 'setInfoText', `Cloning ${repoUrl}...`);
    const git = simpleGit({
        progress({ method, stage, progress }) {
            if (stage == "receiving") {

                Max.outlet('clone', 'progress', progress);
                Max.outlet('js', 'setPrimaryWheelValue', progress);
            }
        },
    });

    try {
        // create folder
        Max.post("Attempting to clone: " + repoUrl + " to " + repoDirectory);
        await git.clone(repoUrl, repoDirectory);
        if (branch && branch !== 'main') {
            await git.cwd(repoDirectory);
            await git.checkout(branch);
        }
        Max.post(`Repository ${repoUrl} cloned successfully to ${repoDirectory}.`);
        Max.outlet('js', 'setInfoText', `Repository ${repoUrl} cloned successfully to ${repoDirectory}.`);
    } catch (error) {
        throw new Error(`Cloning failed for ${repoUrl}: ${error.message}`);
    }
}

async function cloneRepositories() {
    if (!directory) {
        Max.outlet('error', 'Directory is not set. Use "setDir [path]" to set directory.');
        return;
    }
    // Max.post("Missing Repos: " + missingRepos.length)

    // add folder to max search path
    Max.post(`Adding ${directory}/${repoFolder} to Max search path.`);
    Max.outlet('path', directory);


    Max.post(`Starting cloning process for repositories to ${directory}/${repoFolder}`);
    setButtonText("");
    Max.outlet('js', 'toggleLoadingWheel', true);
    for (const { repoUrl, branch } of repos) {

        const repoName = new URL(repoUrl).pathname.split('/').pop().replace('.git', '');
        const repoDirectory = path.join(directory, folderName, repoFolder, repoName);
        Max.post("RepoUrl: " + repoUrl)
        Max.post("RepoName: " + repoName)
        Max.post("RepoDirectory: " + repoDirectory)
        Max.post("Branch: " + branch)

        try {
            await cloneRepository(repoUrl, branch, repoDirectory);
            Max.post('Cloning process completed.');
        } catch (error) {
            Max.outlet('error', error.message);
        }
    }

    await checkAndDownloadReleases();

    Max.outlet('js', 'toggleLoadingWheel', false);
    Max.outlet('js', 'setPrimaryWheelValue', 100);
    // wait for 1 second
    await new Promise(resolve => setTimeout(resolve, 1500));
    Max.outlet('js', 'setPrimaryWheelValue', 0);
    Max.outlet('js', 'setInfoText', 'Success!');
    setButtonText("Update");
}

async function pullRepository(repoUrl, branch, repoDirectory) {
    Max.post("Pulling repository: " + repoUrl + " to " + repoDirectory);

    // Ensure the repository directory exists or create it
    if (!fs.existsSync(repoDirectory)) {
        Max.post(`Directory does not exist, creating: ${repoDirectory}`);
        fs.mkdirSync(repoDirectory, { recursive: true });  // recursive true allows creating nested directories as needed
    }

    const git = simpleGit(repoDirectory);

    try {
        // Initialize the repository if .git directory does not exist
        if (!fs.existsSync(path.join(repoDirectory, '.git'))) {
            await git.init();
            await git.addRemote('origin', repoUrl);
        }

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
        const repoDirectory = path.join(directory, folderName, repoFolder, repoName);

        try {
            await pullRepository(repoUrl, branch, repoDirectory);
        } catch (error) {
            Max.outlet('error', error.message);
        }
    }
    Max.post('Pull process completed.');
    Max.outlet('js', 'toggleLoadingWheel', false);
    Max.outlet('js', 'setPrimaryWheelValue', 100);

    // wait for 1 second
    await new Promise(resolve => setTimeout(resolve, 1500));
    Max.outlet('js', 'setPrimaryWheelValue', 0);
    setButtonText("Update");
}

// Max handlers
Max.addHandler('setDir', (dir) => {
    setDirectory(dir);
});

Max.addHandler('setReposFromJson', async () => {
    await readAndSetReposFromJson();
});

Max.addHandler('Install', async () => {
    await cloneRepositories();
});

Max.addHandler('Update', async () => {
    await pullRepositories();
});

Max.addHandler('checkRepos', async () => {
    await checkRepos();
});

Max.addHandler('checkAndDownloadReleases', async () => {
    await checkAndDownloadReleases();
});

Max.addHandler('getHomedir', () => {
    getPackagesFolder();
});