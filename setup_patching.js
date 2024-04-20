inlets = 5;
outlets = 5;
patcher = this.patcher;

const clonePullButton = patcher.getnamed("button");
const primaryWheel = patcher.getnamed("primaryWheel");
const secondaryWheel = patcher.getnamed("secondaryWheel");
const loadingWheelToggle = patcher.getnamed("loadingWheelToggle");
const progressText = patcher.getnamed("progressText");
const infoText = patcher.getnamed("infoText");
const stageText = patcher.getnamed("stageText");
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

function loadbang() {
    start();
}

function setSecondaryWheelValue(value) {
    // switch case
    secondaryWheel.message("set", value);
}

function setPrimaryWheelValue(value) {
    if (value > 100) {

        primaryWheel.message("needlecolor", progressNeedleColor);
    }
    else {
        primaryWheel.message("needlecolor", successNeedleColor);
    }

    clonePullButton.message("text", "");
    primaryWheel.message("set", value);
    progressText.message("set", value + "%");
}

function setButtonText(text) {
    clonePullButton.message("text", text);

    if (text == "Install" || text == "Update") {
        hideProgressText();
        // primaryWheel.message("needlecolor", successNeedleColor);
        // setPrimaryWheelValue(100);
    }

}

function hideProgressText() {
    progressText.message("set", "");
}

function toggleLoadingWheel(state) {
    loadingWheelToggle.message("set", state);
    loadingWheelToggle.message("outputvalue");

    if (state == false) {
        setSecondaryWheelValue(0);
    }
}

function setInfoText(text) {
    infoText.message("set", text);
}


// start();