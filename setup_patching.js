inlets = 5;
outlets = 5;
patcher = this.patcher;

post("Script loaded successfully.\n");

// Utility function to safely get object references with retry mechanism
function getNamedObject(name, retryDelay, maxRetries) {
    var obj = patcher.getnamed(name);
    if (!obj && maxRetries > 0) {
        post("Warning: Object '" + name + "' not found. Retrying in " + retryDelay + " seconds...\n");
        var retryTask = new Task(retryGetNamedObject, this, name, retryDelay, maxRetries);
        retryTask.schedule(retryDelay * 1000); // Schedule the task in milliseconds
    } else if (!obj) {
        post("Error: Object '" + name + "' not found after retries.\n");
    } else {
        post("Object '" + name + "' successfully retrieved.\n");
        return obj;
    }
    return null;
}

function retryGetNamedObject(name, retryDelay, maxRetries) {
    getNamedObject(name, retryDelay, maxRetries - 1);
}

const clonePullButton = getNamedObject("button", .5, 3); // Retry every .5 seconds, up to 3 times
const primaryWheel = getNamedObject("primaryWheel", .5, 3);
const secondaryWheel = getNamedObject("secondaryWheel", .5, 3);
const loadingWheelToggle = getNamedObject("loadingWheelToggle", .5, 3);
const progressText = getNamedObject("progressText", .5, 2);
const infoText = getNamedObject("infoText", .5, 2);
const stageText = getNamedObject("stageText", .5, 2);

const successNeedleColor = [0.5, 1., 0.5, 1.];
const failureNeedleColor = [1., 0.5, 0.5, 1.];
const progressNeedleColor = [0.42, 0.79, 0.85, 1.];

var wheelToggleState = false;

function start() {
    setPrimaryWheelValue(0);
    setSecondaryWheelValue(0);
    hideProgressText();
    setButtonText("Install");
}

function setSecondaryWheelValue(value) {
    if (secondaryWheel) {
        secondaryWheel.message("set", value);
    }
    else {
        post("Secondary wheel not found.\n");
    }
}

function setPrimaryWheelValue(value) {
    if (primaryWheel) {
        if (value > 100) {
            primaryWheel.message("needlecolor", progressNeedleColor);
        } else {
            primaryWheel.message("needlecolor", successNeedleColor);
        }
        primaryWheel.message("set", value);
    }
    if (progressText) {
        progressText.message("set", value + "%");
    }
    if (clonePullButton) {
        clonePullButton.message("text", "");
    }
}

function setButtonText(text) {
    if (clonePullButton) {
        clonePullButton.message("text", text);
    }
    if (text == "Install" || text == "Update") {
        hideProgressText();
    }
}

function hideProgressText() {
    if (progressText) {
        progressText.message("set", "");
    }
}

function toggleLoadingWheel(state) {
    if (loadingWheelToggle) {
        loadingWheelToggle.message("set", state);
        loadingWheelToggle.message("outputvalue");
    }
    if (!state && secondaryWheel) {
        setSecondaryWheelValue(0);
    }
}

function setInfoText(text) {
    if (infoText) {
        infoText.message("set", text);
    }
}

start();
