inlets = 5;
outlets = 5;
patcher = this.patcher;

clonePullButton = patcher.getnamed("button");

primaryWheel = patcher.getnamed("primaryWheel");
secondaryWheel = patcher.getnamed("secondaryWheel");
loadingWheelToggle = patcher.getnamed("loadingWheelToggle");
progressText = patcher.getnamed("progressText");
stageText = patcher.getnamed("stageText");

successNeedleColor = [0.5, 1., 0.5, 1.];
failureNeedleColor = [1., 0.5, 0.5, 1.];
progressNeedleColor = [0.42, 0.79, 0.85, 1.];

clonePullButton.message("text", "lol");

function start() {
    setPrimaryWheelValue(0);
    setSecondaryWheel(0);
    progressText.message("set");
    setButtonText("Install");
}

function setSecondaryWheel(state) {
    // switch case
    switch (state) {
        case 0:
            secondaryWheel.message("set", 0);
            break;
        case 1:
            secondaryWheel.message("set", 100);
            break;
    }
}

function setPrimaryWheelValue(value) {
    primaryWheel.message("needlecolor", progressNeedleColor);
    clonePullButton.message("text", "");
    primaryWheel.message("set", value);
    progressText.message("set", value + "%");
}

function setButtonText(text) {
    clonePullButton.message("text", text);
}




start();