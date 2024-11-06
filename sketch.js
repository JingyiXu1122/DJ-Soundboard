let mySound;
let playStopButton;
let sliderVolume;
let jumpButton;
let dryWetLPSlider;
let ouputVolLPSlider;
let dryWetDCSlider;
let outputVolDCSlider;
let dryWetDSlider;
let outputVolDSlider;
let dryWetRSlider;
let outputVolRSlider;

let playButton;
let stopButton;
let pauseButton;
let skipToStart;
let skipToEnd;
let loop;
let record;
let reverse;
let mic, recorder, soundFileRec;
let state = 0;
let lowpassFilter;
let dynCompressor;
let inputSel;
let inputVal;

let filterSel;
let val;

let distortion;

let reverbFilter;
let reverseFlag = false;

var fft;
var masterVolKnob;
var cutoffFreqKnob;
var distAmountKnob;
var oversampleKnob;
var durKnob;
var decayKnob;
var pointerCursor = false;

var volume;
let spec;
let spec_lin;
let fft2;


let backgroundSound = '/sounds/cetus.mp3';

let bg;

function preload() {
    soundFormats('mp3', 'wav');
    loadFont('Baloo2-SemiBold.otf');
    bg = loadSound(backgroundSound);
}

function setup() {
    textFont("Baloo2-SemiBold");
    createCanvas(1900, 1000);
    background(200);
    noFill();
    fullscreen(true);

    filterSel = createSelect();
    filterSel.size(80);
    filterSel.position(97, 170);
    filterSel.option('low-pass');
    filterSel.option('high-pass');
    filterSel.option('band-pass');
    val = filterSel.value();
    filterSel.changed(filterChange);

    inputSel = createSelect();

    inputVal = inputSel.value();

    lowpassFilter = new p5.Filter();
    lowpassFilter.setType("lowpass");
    dynCompressor = new p5.Compressor();
    distortion = new p5.Distortion();
    reverbFilter = new p5.Reverb();

    bg.disconnect();
    fft2 = new p5.FFT();
    fft2.setInput(bg);
    bg.connect(lowpassFilter);

    lowpassFilter.chain(distortion, dynCompressor, reverbFilter);
    fft = new p5.FFT();
    fft.setInput(lowpassFilter.chain(distortion, dynCompressor, reverbFilter));

    mic = new p5.AudioIn();
    mic.start();
    fft3 = new p5.FFT();
    fft3.setInput(bg);

    mic.connect(lowpassFilter);
    recorder = new p5.SoundRecorder();
    recorder.setInput(lowpassFilter.chain(distortion, dynCompressor, reverbFilter));
    soundFileRec = new p5.SoundFile();

    gui_config();
}

let r, g, b;
let lastColorChangeTime = 0;  // Variable to track the last time the color was changed
let colorChangeInterval = 1000;  // Interval for color change (1000ms = 1 second)

function draw() {
    textFont("Baloo2-SemiBold");

    background(20);

    vol = mic.getLevel() * 10;
    ellipse(random(width * 3), random(height * 3), vol * 1000, vol * 1000);
    ellipse(random(width * 3), random(height * 3), vol * 1000, vol * 1000);
    fill(random(255), random(255), random(255));

    ellipse(random(width * 3), random(height * 3), vol * 1000, vol * 1000);
    fill(random(255), random(255), random(255));

    ellipse(random(width * 3), random(height * 3), vol * 1000, vol * 1000);

    gui_colors();

    labels();

    push();
    noFill();
    stroke(0);
    pop();

    pointerCursor = false;
    update_knobs();

    noFill();
    fill(0, 200, 0);
    rect(1160, 580, 50, -masterVolKnob.knobValue/20);

    x = fft3.waveform();

    noFill();
    fft.smooth(0.9); // A value between 0 and 1, where 1 is the most smoothing

    stroke(225, 255, 1);
    strokeWeight(1);

    lowpassFilter.set(cutoffFreqKnob.knobValue);
    lowpassFilter.res(resKnob.knobValue);

    lowpassFilter.drywet(dryWetLPSlider.value());
    lowpassFilter.amp(ouputVolLPSlider.value());

    let os;
    if (oversampleKnob.knobValue == 0) {
        os = "none";
    }
    else if (oversampleKnob.knobValue == 2) {
        os = "2x";
    }
    else if (oversampleKnob.knobValue == 4) {
        os = "4x"
    }
    distortion.set(distAmountKnob.knobValue, os);
    distortion.drywet(dryWetDSlider.value());
    distortion.amp(outputVolDSlider.value());

    dynCompressor.attack(attackKnob.knobValue);
    dynCompressor.knee(kneeKnob.knobValue);
    dynCompressor.release(releaseKnob.knobValue);
    dynCompressor.ratio(ratioKnob.knobValue);
    dynCompressor.threshold(thresKnob.knobValue);
    dynCompressor.drywet(dryWetDCSlider.value());
    dynCompressor.amp(outputVolDCSlider.value());

    reverbFilter.drywet(dryWetRSlider.value());
    reverbFilter.amp(outputVolRSlider.value());
    dryWetRSlider.changed(cb);


    volume = masterVolKnob.knobValue;
    volume = map(volume, 0, 55, 0, 1);

    bg.setVolume(volume);

    let wave = fft3.waveform();
    let spectrum = fft.analyze();


    // Check if 1 second has passed since the last color change
    if (millis() - lastColorChangeTime > colorChangeInterval) {
        r = random(255);
        g = random(255);
        b = random(255);
        lastColorChangeTime = millis();  // Reset the last color change time
    }

    stroke(r, g, b);  // Set the stroke color to the current values
    noFill();         // Ensure the shape isn't filled


    // Draw the spectrum shape
    beginShape();
    for (let i = 0; i < spectrum.length; i++) {

        vertex(i, map(spectrum[i], -45, 600, height, 150));

    }
    for (let i = spectrum.length - 1; i >= 0; i--) {
        vertex(width - i, map(spectrum[i], -45, 600, height, 150));

    }

    endShape();



    stroke(r, g, b);  // Set the stroke color to the current values
    noFill();         // Ensure the shape isn't filled

    // Draw the circular wave
    let radius = 100; // Radius for the circular wave
    let centerX = width / 3; // Center of the circle
    let centerY = height / 3; // Center of the circle

    noFill();
    beginShape();

    // Iterate through the spectrum and wave data
    for (let i = 0; i < spectrum.length; i++) {

        let angle = map(i, 0, spectrum.length, 0, TWO_PI); // Map index to angle
        let spectrumHeight = map(spectrum[i], 0, 255, -radius, radius); // Scale spectrum height
        let waveHeight = map(wave[i], 0, 1, -radius, radius); // Scale wave height

        // Calculate the position for spectrum
        let xSpectrum = centerX + cos(angle) * (radius + spectrumHeight);
        let ySpectrum = centerY + sin(angle) * (radius + spectrumHeight);

        // Calculate the position for wave
        let xWave = centerX + cos(angle) * (radius + waveHeight);
        let yWave = centerY + sin(angle) * (radius + waveHeight);

        // Set stroke color based on height
        let spectrumColor = map(spectrumHeight, -radius, radius, 0, 255);
        vertex(xSpectrum, ySpectrum); // Draw spectrum vertex
        stroke(r+40, g/3, b*1);  // Set the stroke color to the current values
        let pointSize = map(wave[i], 0, 1, 2, 10); // Map wave amplitude to point size
        strokeWeight(pointSize); // Set the weight for the wave point

        point(xWave, yWave); // Draw wave point
        stroke(r+100, g/3, b*1);  // Set the stroke color to the current values
        point(xWave + xWave, yWave + yWave); // Draw wave point


        stroke(r+80, g/3, b*1);  // Set the stroke color to the current values
        point(xWave + xWave, yWave + yWave); // Draw wave point

    }
    endShape(CLOSE); // Close the shape to connect the end to the start

    // Update and draw all shapes

}

// Function to draw random shapes and add them to the shapes array
function drawRandomShapes() {
    let shapeX = random(width); // Random x position
    let shapeY = map(random(255), -45, 255, height, 250); // Y position at the same level
    let shapeType = int(random(3)); // Randomly select from 3 types (0: ellipse, 1: rect, 2: line)

    // Create a shape object with position, type, and initial random speed
    let shape = {
        x: shapeX,
        y: shapeY,
        type: shapeType,
        speedX: random(-2, 2), // Random horizontal speed
        speedY: random(-2, 2)  // Random vertical speed
    };

    shapes.push(shape); // Add the shape to the shapes array
}



// Handle file input (remains unchanged)
function handleFile(file) {
    console.log(file);
}

function cb() {
    reverbFilter.set(durKnob.knobValue, decayKnob.knobValue, reverseFlag);
}

function update_knobs() {
    masterVolKnob.update();
    cutoffFreqKnob.update();
    resKnob.update();
    attackKnob.update();
    kneeKnob.update();
    releaseKnob.update();
    ratioKnob.update();
    thresKnob.update();
    distAmountKnob.update();
    oversampleKnob.update();
    durKnob.update();
    decayKnob.update();
}

function gui_colors() {
    // Draw the red rectangle with lighter color and subtle white border
    fill(255, 102, 102, 100); // Lighter red
    stroke(200); // Subtle white border (light gray)
    strokeWeight(2); // Set border thickness
    rect(60, 70, 150, 260, 20); // Added rounded corners

    // Draw the blue rectangle with lighter color and subtle white border
    fill(102, 178, 255, 100); // Lighter blue
    stroke(200); // Subtle white border (light gray)
    rect(250, 70, 242, 340, 20); // Added rounded corners

    // Draw the purple rectangle with lighter color and subtle white border
    fill(170, 102, 170, 100); // Lighter purple
    stroke(200); // Subtle white border (light gray)
    rect(250, 420, 242, 270, 20); // Added rounded corners

    // Draw the greenish rectangle with lighter color and subtle white border
    fill(170, 255, 102, 100); // Lighter greenish
    stroke(200); // Subtle white border (light gray)
    rect(60, 360, 150, 330, 20); // Added rounded corners


}

function labels() {
    textFont("Baloo2-SemiBold");

    fill(0);
    textSize(14);
    text('Filters', 115, 87);
    text('Dynamic Compressor', 300, 87);
    text('Waveshaper Distortion', 300, 440);
    text('Master Volume', 1150, 295);
    textSize(55);

    text('Rotate the Discs!', 1220, 195);
    textSize(14);

    text('Reverb', 110, 380);
    textSize(10);
    text('Cut off Freq', 66, 157);
    text('Resonance', 155, 157);
    text('Dry/Wet', 73, 315);
    text('Output vol', 160, 315);
    text('Attack', 265, 157);
    text('Knee', 358, 157);
    text('Release', 442, 157);
    text('Ratio', 314, 240);
    text('Threshold', 394, 240);
    text('Dry/Wet', 309, 400);
    text('Output vol', 396, 400);
    text('Distortion Amount', 287, 514);
    text('Oversample', 394, 514);
    text('Dry/Wet', 309, 680);
    text('Output vol', 396, 680);
    text('Duration', 71, 447);
    text('Decay', 165, 447);
    text('Dry/Wet', 75, 680);
    text('Output vol', 158, 680);

}

function gui_config() {

    masterVolKnob = new MakeKnob("images/disc3.png", 400, 1460, 410, 0, 5100, 50, 0);
    cutoffFreqKnob = new MakeKnob("images/disc3.png", 50, 90, 120, 10, 22050, 100, 0);
    resKnob = new MakeKnob("images/disc3.png", 50, 180, 120, 0.001, 1000, 0, 0);

    attackKnob = new MakeKnob("images/disc1.png", 50, 280, 120, 0, 1, 0.003, 0);
    kneeKnob = new MakeKnob("images/disc2.png", 50, 370, 120, 0, 40, 30, 0);
    releaseKnob = new MakeKnob("images/disc2.png", 50, 460, 120, 0, 1, 0.25, 0);
    ratioKnob = new MakeKnob("images/disc1.png", 50, 326, 200, 1, 20, 12, 0);
    thresKnob = new MakeKnob("images/disc3.png", 50, 416, 200, -100, 0, -24, 0);

    distAmountKnob = new MakeKnob("images/disc1.png", 50, 326, 475, 0, 1, 0, 0);
    oversampleKnob = new MakeKnob("images/disc2.png", 50, 419, 475, 0, 4, 0, 3);

    durKnob = new MakeKnob("images/disc1.png", 50, 90, 410, 0, 10, 0, 0);
    decayKnob = new MakeKnob("images/disc2.png", 50, 180, 410, 0, 100, 0, 0);

    masterVolKnob.moveRange = 128;
    cutoffFreqKnob.moveRange = 128;
    resKnob.moveRange = 128;
    attackKnob.moveRange = 128;
    kneeKnob.moveRange = 128;
    releaseKnob.moveRange = 128;
    ratioKnob.moveRange = 128;
    thresKnob.moveRange = 128;
    distAmountKnob.moveRange = 128;
    oversampleKnob.moveRange = 4;
    durKnob.moveRange = 128;
    decayKnob.moveRange = 128;

    // Create buttons with rounded corners
    playButton = createButton('PLAY');
    playButton.size(70, 50);
    playButton.position(70, 10);
    playButton.style('border-radius: 15px;'); // Rounded corners
    playButton.mousePressed(playSound);

    stopButton = createButton('STOP');
    stopButton.size(70, 50);
    stopButton.position(145, 10);
    stopButton.style('border-radius: 15px;'); // Rounded corners
    stopButton.mousePressed(stopSound);

    pauseButton = createButton('PAUSE');
    pauseButton.size(70, 50);
    pauseButton.position(220, 10);
    pauseButton.style('border-radius: 15px;'); // Rounded corners
    pauseButton.mousePressed(pauseSound);

    loop = createButton('LOOP BG');
    loop.size(70, 50);
    loop.position(448, 10);
    loop.style('border-radius: 15px;'); // Rounded corners
    loop.mousePressed(loopSound);

    // Create sliders with rounded corners
    dryWetLPSlider = createSlider(0, 1, 0.5, 0.1);
    dryWetLPSlider.position(25, 225);
    dryWetLPSlider.style("transform", "rotate(270deg)");
    dryWetLPSlider.style('border-radius: 5px; height: 10px;'); // Rounded corners

    ouputVolLPSlider = createSlider(0, 1, 0.5, 0.1);
    ouputVolLPSlider.position(115, 225);
    ouputVolLPSlider.style("transform", "rotate(270deg)");
    ouputVolLPSlider.style('border-radius: 5px; height: 10px;'); // Rounded corners

    dryWetDCSlider = createSlider(0, 1, 0, 0.1);
    dryWetDCSlider.position(259, 310);
    dryWetDCSlider.style("transform", "rotate(270deg)");
    dryWetDCSlider.style('border-radius: 5px; height: 10px;'); // Rounded corners

    outputVolDCSlider = createSlider(0, 1, 0.5, 0.1);
    outputVolDCSlider.position(350, 310);
    outputVolDCSlider.style("transform", "rotate(270deg)");
    outputVolDCSlider.style('border-radius: 5px; height: 10px;'); // Rounded corners

    dryWetDSlider = createSlider(0, 1, 0, 0);
    dryWetDSlider.position(259, 590);
    dryWetDSlider.style("transform", "rotate(270deg)");
    dryWetDSlider.style('border-radius: 5px; height: 10px;'); // Rounded corners

    outputVolDSlider = createSlider(0, 1, 0.5, 0.1);
    outputVolDSlider.position(350, 590);
    outputVolDSlider.style("transform", "rotate(270deg)");
    outputVolDSlider.style('border-radius: 5px; height: 10px;'); // Rounded corners

    dryWetRSlider = createSlider(0, 1, 0, 0);
    dryWetRSlider.position(25, 590);
    dryWetRSlider.style("transform", "rotate(270deg)");
    dryWetRSlider.style('border-radius: 5px; height: 10px;'); // Rounded corners

    outputVolRSlider = createSlider(0, 1, 0, 0);
    outputVolRSlider.position(115, 590);
    outputVolRSlider.style("transform", "rotate(270deg)");
    outputVolRSlider.style('border-radius: 5px; height: 10px;'); // Rounded corners

    // Create the RECORD button with rounded corners and custom color
    record = createButton('RECORD');
    record.size(70, 50);
    record.position(524, 10);
    let c = color(255, 0, 0, 0.7 * 255); // Set color with alpha
    record.style('background-color', c.toString()); // Apply background color
    record.style('border-radius: 15px;'); // Rounded corners
    record.mousePressed(recordSound);

    reverse = createButton('REVERSE');
    reverse.size(80, 20);
    reverse.position(95, 480);
    reverse.mousePressed(reverbReverse);
}

function reverbReverse() {
    reverseFlag = !reverseFlag;
    reverbFilter.set(durKnob.knobValue, decayKnob.knobValue, reverseFlag);
}

function filterChange() {
    val = filterSel.value();
    if (val == 'low-pass') {
        lowpassFilter.setType("lowpass");
    }
    else if (val == 'high-pass') {
        lowpassFilter.setType("highpass");
    }
    else if (val == 'bandpass') {
        lowpassFilter.setType("bandpass");
    }
}

function recordSound() {
    if (state === 0) {
        // Start recording from the microphone
        mic.start();
        recorder.setInput(mic, lowpassFilter.chain(distortion, dynCompressor, reverbFilter));
        fft.setInput(mic, lowpassFilter.chain(distortion, dynCompressor, reverbFilter));
        recorder.record(soundFileRec);

        // Show a non-blocking toast notification for recording started
        Swal.fire({
            toast: true,
            position: 'top-end',
            title: 'Recording...',
            text: 'The mic input is being recorded! Click button again to stop!',
            icon: 'info',
            showConfirmButton: false,
            timer: 5000 // Display for 5 seconds
        });

        state = 1; // Set state to indicate recording mode

    } else if (state === 1) {
        // Stop the recording
        recorder.stop();
        save(soundFileRec, 'rec_sound.wav');

        // Show success toast for recording stopped and saved
        Swal.fire({
            toast: true,
            position: 'top-end',
            title: 'Recording Stopped',
            text: 'Your recording has been saved as rec_sound.wav!',
            icon: 'success',
            showConfirmButton: false,
            timer: 3000 // Display for 3 seconds
        });

        state = 0; // Reset the state to allow new recording
    }
}


function loopSound() {
    bg.loop();
}

function playSound() {

    if (bg.isPlaying()) {

    } else {
        bg.play();
    }
}

function stopSound() {
    bg.stop();


}

function pauseSound() {
    bg.pause();

}


function mousePressed() {
    masterVolKnob.active();
    cutoffFreqKnob.active();
    resKnob.active();
    attackKnob.active();
    kneeKnob.active();
    releaseKnob.active();
    ratioKnob.active();
    thresKnob.active();
    distAmountKnob.active();
    oversampleKnob.active();
    durKnob.active();
    decayKnob.active();
}

function mouseReleased() {
    masterVolKnob.inactive();
    cutoffFreqKnob.inactive();
    resKnob.inactive();
    attackKnob.inactive();
    kneeKnob.inactive();
    releaseKnob.inactive();
    ratioKnob.inactive();
    thresKnob.inactive();
    distAmountKnob.inactive();
    oversampleKnob.inactive();
    durKnob.inactive();
    decayKnob.inactive();
}