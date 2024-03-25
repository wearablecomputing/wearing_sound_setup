inlets = 5;
outlets = 5;
patcher = this.patcher;

const clonePullButton = patcher.getnamed("button");
const primaryWheel = patcher.getnamed("primaryWheel");
const secondaryWheel = patcher.getnamed("secondaryWheel");
const loadingWheelToggle = patcher.getnamed("loadingWheelToggle");
const progressText = patcher.getnamed("progressText");
const stageText = patcher.getnamed("stageText");
const successNeedleColor = [0.5, 1., 0.5, 1.];
const failureNeedleColor = [1., 0.5, 0.5, 1.];
const progressNeedleColor = [0.42, 0.79, 0.85, 1.];

var wheelToggleState = false;

clonePullButton.message("text", "lol");

function start() {
    setPrimaryWheelValue(0);
    setSecondaryWheelValue(0);
    progressText.message("set");
    setButtonText("Install");
}

function setSecondaryWheelValue(value) {
    // switch case
    secondaryWheel.message("set", value);
}

function setPrimaryWheelValue(value) {
    primaryWheel.message("needlecolor", progressNeedleColor);
    clonePullButton.message("text", "");
    primaryWheel.message("set", value);
    progressText.message("set", value + "%");
}

function setButtonText(text) {
    clonePullButton.message("text", text);

    if(text !== ""){
        progressText = "";
    }
}

function toggleLoadingWheel(state) {
    loadingWheelToggle.message("set", state);
    loadingWheelToggle.message("outputvalue");

    if(state == false){
        setSecondaryWheelValue(0);
    }
}






start();