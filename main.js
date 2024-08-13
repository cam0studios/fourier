// editable vars
var waves = [
	{ freq: 1, amp: 1, phase: 0 },
	{ freq: 1, amp: 0, phase: 0 },
	{ freq: 1, amp: 0, phase: 0 },
];
var duration = 1;
var numSamples = 500;
var points = [];
var testFrequency = 1;
var lineGraphSize = 250;
var lineCol = "rgba(240,240,240,0.9)";
var backgroundCol = "rgb(25,25,25)";
var waveCols = ["rgb(220,70,100)", "rgb(100,220,100)", "rgb(100,200,255)"];
var waveNames = ["Wave A", "Wave B", "Wave C"];
// setup vars
var circleGraphSize = innerHeight - lineGraphSize;
var frequencyEditor = document.getElementById("frequencies");
frequencyEditor.innerHTML = waves.map((wave, i) => `<div class="frequency" id="wave${i}" style="--color: ${waveCols[i]};--current-color: ${waves[i].amp > 0 ? waveCols[i] : "rgb(100,100,100)"};"><div><p data-var="waves${i}freq">Frequency: <span>${formatNumber(wave.freq, 2)}</span></p><p data-var="waves${i}amp">Amplitude: <span>${formatNumber(wave.amp, 2)}</span></p><p data-var="waves${i}phase">Phase &nbsp;&nbsp; : <span>${formatNumber(wave.phase, 2)}</span></p></div><p>${waveNames[i]}</p></div>`).join("");
var testFrequencySize = document.getElementById("testFrequency").offsetWidth;
var frequencyEditorSize = document.getElementById("frequencies").offsetWidth;
document.body.style.setProperty("--line-graph-height", lineGraphSize + "px");
document.body.style.setProperty("--circle-graph-size", circleGraphSize + "px");
document.body.style.setProperty("--bg-col", backgroundCol);
document.body.style.setProperty("--test-frequency-size", testFrequencySize + "px");
document.body.style.setProperty("--frequency-editor-size", frequencyEditorSize + "px");

const lineGraphSketch = new p5(renderLineGraph);
const circleGraphSketch = new p5(renderCircleGraph);
const editablesSketch = new p5(editables);

// sample points
samplePoints();

function editables(sketch) {
	sketch.setup = () => {
		document.querySelectorAll("[data-var]").forEach((element) => {
			element.setAttribute("data-mdown", "no");
			element.addEventListener("mousedown", (ev) => {
				element.setAttribute("data-mdown", "yes");
				element.requestPointerLock();
				ev.preventDefault();
			});
			document.addEventListener("mousemove", (ev) => {
				if (element.getAttribute("data-mdown") == "yes") {
					if (element.getAttribute("data-no-dec")) {
						element.querySelector("span").innerHTML = formatNumber(editVar(element, { change: ev.movementX * 0.5, min: 50, rounds: [{ n: 50, amt: 5 }, { n: 10, amt: 3 }] }));
					} else {
						element.querySelector("span").innerHTML = formatNumber(editVar(element, { change: ev.movementX * 0.002, min: 0, rounds: [{ n: 0.5, amt: 0.02 }, { n: 0.1, amt: 0.01 }] }), 2);
					}
					if (element.getAttribute("data-var").startsWith("waves")) {
						let parent = element.parentElement.parentElement;
						let wave = waves[parent.getAttribute("id").split("wave")[1]];
						if (wave.amp > 0) parent.style.setProperty("--current-color", parent.style.getPropertyValue("--color"));
						else parent.style.setProperty("--current-color", "rgb(100,100,100)");
					}
				}
			});
			document.addEventListener("mouseup", (ev) => {
				element.setAttribute("data-mdown", "no");
				document.exitPointerLock();
			});
			document.addEventListener("click", (ev) => {
				element.setAttribute("data-mdown", "no");
				setTimeout(() => {
					document.exitPointerLock();
				}, 100);
			});
		});
	}
}

function renderLineGraph(sketch) {
	let size = lineGraphSize - 100;
	let mode = 0;
	let modePos = 0;
	let modes = 2;
	let hover = 0;
	sketch.setup = () => {
		sketch.createCanvas(innerWidth, lineGraphSize);
		sketch.textFont("monospace");
		sketch.textSize(15);

		document.getElementById("defaultCanvas0").addEventListener("click", (ev) => {
			if (new p5.Vector(ev.clientX, ev.clientY).sub(new p5.Vector(innerWidth - 50, size / 2 + 50)).mag() < 20) {
				mode++;
				if (mode > modes - 1) mode = 0;
			}
		});
	}
	sketch.draw = () => {
		// background
		sketch.background(0);
		sketch.fill(backgroundCol);
		sketch.noStroke();
		sketch.rect(50, 50, innerWidth - 150, size);
		let labels = [];

		if (mode == 0) {
			// center line
			for (let x = 0; x < innerWidth - 150; x += 10) {
				sketch.stroke(100);
				sketch.strokeWeight(1);
				sketch.line(50 + x, 50 + size / 2, 55 + x, 50 + size / 2);
			}

			// points
			points.forEach((y, x) => {
				sketch.stroke(lineCol);
				sketch.strokeWeight(4);
				sketch.point(x / (numSamples - 1) / duration * (innerWidth - 150) + 50, size / 2 + 50 - y * (size - 4) / 2);
			});
		} else if (mode == 1) {
			// lines
			for (let r = 0; r <= 15; r++) {
				let dst = calcCenterOfMass(r).mag() * (size - 2);
				labels.push(dst >= 10);
				if (dst >= 5) {
					sketch.stroke(100);
					sketch.strokeWeight(1);
					let x = r / 15 * (innerWidth - 150) + 50;
					sketch.line(x, size + 50, x, size + 50 - dst);
					sketch.noStroke();
					sketch.fill(100);
					sketch.textAlign("center", "bottom");
					sketch.text(formatNumber(dst / (size - 2), 2), x, size + 35 - dst);
				}
			}

			// points
			let numCOMSamples = numSamples;
			sketch.strokeWeight(4);
			let lastPoint;
			for (let r = 0; r <= 15; r += 15 / numCOMSamples) {
				let center = calcCenterOfMass(r);
				let x = r / 15 * (innerWidth - 150) + 50;
				let point = new p5.Vector(x, size + 50 - center.mag() * (size - 2));
				if (r > 0) {
					sketch.stroke(lineCol);
					sketch.line(lastPoint.x, lastPoint.y, point.x, point.y);
				}
				lastPoint = point.copy();
			}
		}

		// masking
		sketch.noFill();
		sketch.stroke(0);
		let weight = 50;
		sketch.strokeWeight(weight);
		sketch.rect(50 - weight / 2, 50 - weight / 2, innerWidth - 150 + weight, size + weight);

		// border
		sketch.stroke(50);
		weight = 5;
		sketch.strokeWeight(weight);
		sketch.rect(50 - weight / 2, 50 - weight / 2, innerWidth - 150 + weight, size + weight);

		if (mode == 0) {
			// labels
			sketch.fill(100);
			sketch.noStroke();
			sketch.textAlign("right", "center");
			sketch.text("+1", 40, 50);
			sketch.text("0", 40, 50 + size / 2);
			sketch.text("-1", 40, 50 + size);

			sketch.textAlign("center", "top");
			for (let x = 0; x <= 1; x += 0.25) {
				sketch.text(Math.round(x * duration * 100) / 100, 50 + x * (innerWidth - 150), size + 60);
			}
		} else if (mode = 1) {
			sketch.noStroke();
			sketch.textAlign("center", "top");
			for (let x = 0; x <= 15; x += 1) {
				sketch.fill(75 + labels[x] * 75);
				sketch.text(x, 50 + x / 15 * (innerWidth - 150), size + 60);
			}
		}

		//switcher
		if (new p5.Vector(sketch.mouseX, sketch.mouseY).sub(new p5.Vector(innerWidth - 50, size / 2 + 50)).mag() < 20) {
			hover += (1 - hover) * 0.25;
		} else {
			hover -= hover * 0.25;
		}
		sketch.fill(hover * 15);
		sketch.noStroke();
		sketch.ellipse(innerWidth - 50, size / 2 + 50, 40, 40);

		sketch.noFill();
		sketch.stroke(35);
		sketch.strokeWeight(10);
		sketch.line(innerWidth - 50, size / 2 + 40, innerWidth - 50, size / 2 + 60);
		sketch.stroke(100);
		sketch.strokeWeight(10 + hover * 1);
		sketch.point(innerWidth - 50, size / 2 + 40 + modePos * 20 + hover * (modePos - 0.5) * 5);
		modePos += (mode / (modes - 1) - modePos) * 0.5;

		// frame rate
		// sketch.textAlign("right", "top");
		// sketch.text(Math.round(sketch.frameRate()), innerWidth - 10, 10);
	}
	window.addEventListener("resize", () => {
		sketch.resizeCanvas(innerWidth, lineGraphSize);
	});
}


function renderCircleGraph(sketch) {
	let size;
	sketch.setup = () => {
		size = circleGraphSize;
		let canvas = sketch.createCanvas(size, size);
		canvas.parent("circleGraphContainer");
		sketch.textFont("monospace");
		sketch.textSize(15);
	}
	sketch.draw = () => {
		// background
		sketch.background(0);
		sketch.fill(backgroundCol);
		sketch.noStroke();
		sketch.ellipse(size / 2, size / 2, size - 100, size - 100);

		// center lines
		sketch.noFill();
		sketch.stroke(100);
		sketch.strokeWeight(1);
		for (let i = -size / 2 + 50; i <= size / 2 - 55; i += 10) {
			let amtLeft = (size / 2) % 10;
			sketch.line(i + size / 2 + amtLeft / 2, size / 2, i + size / 2 + 5 + amtLeft / 2, size / 2);
			sketch.line(size / 2, i + size / 2 + amtLeft / 2, size / 2, i + size / 2 + 5 + amtLeft / 2);
		}

		// border
		sketch.noFill();
		sketch.stroke(50);
		let weight = 10;
		sketch.strokeWeight(10);
		sketch.ellipse(size / 2, size / 2, size - 100 + weight, size - 100 + weight);

		// points
		points.forEach((y, x) => {
			sketch.stroke(lineCol);
			sketch.strokeWeight(7);
			let p = new p5.Vector(y, 0);
			p.rotate(x / (numSamples - 1) * Math.PI * 2 * testFrequency);
			p.mult(size / 2 - 50 - 7 / 2);
			sketch.point(p.x + size / 2, p.y + size / 2);
		});
		let center = calcCenterOfMass();
		center.mult(size / 2 - 50);

		// center of mass
		sketch.fill(0);
		sketch.stroke(255);
		sketch.strokeWeight(3);
		sketch.ellipse(center.x + size / 2, center.y + size / 2, 20, 20);
		sketch.fill(0, 1);
		sketch.noStroke();
		sketch.ellipse(center.x + size / 2, center.y + size / 2, 25, 25);

		// masking
		sketch.noFill();
		sketch.stroke(0);
		weight = 105;
		sketch.strokeWeight(weight);
		sketch.ellipse(size / 2, size / 2, size + weight, size + weight);

		// frame rate
		// sketch.fill(100);
		// sketch.noStroke();
		// sketch.textAlign("right", "top");
		// sketch.text(Math.round(sketch.frameRate()), size - 10, 10);
	}
}

function formatNumber(num, places = 0) {
	num = Math.round(num * 10 ** places) / 10 ** places;
	let sign = num < 0;
	num = Math.abs(num);
	let whole = Math.floor(num);
	let dec = num - whole;
	if (places > 0) {
		dec *= 10 ** places;
		dec = Math.floor(dec);
		if (dec > 0) {
			dec += "";
			if (dec.length < places) {
				dec = "0".repeat(places - dec.length) + dec;
			}
		} else {
			dec = "0".repeat(places);
		}
		dec = "." + dec;
	} else {
		dec = "";
	}
	return (sign ? "-" : "") + whole + dec;
}

function calcCenterOfMass(test = testFrequency) {
	let center = new p5.Vector(0, 0);
	points.forEach((y, x) => {
		let p = new p5.Vector(y, 0);
		p.rotate(x / (numSamples - 1) * Math.PI * 2 * test);
		center.add(p);
	});
	center.div(points.length);
	return center;
}

function editVar(element, opts = {}) {
	let edit;
	let data = element.getAttribute("data-var");
	if (data.startsWith("waves")) {
		data = data.split("waves")[1];
		let editI = parseInt(data);
		data = data.split(editI)[1];
		edit = waves[editI][data];
		if ("change" in opts) edit += opts.change;
		if ("min" in opts && edit < opts.min) edit = opts.min;
		if ("max" in opts && edit > opts.max) edit = opts.max;
		if ("rounds" in opts) opts.rounds.forEach((rnd) => {
			if (Math.round(edit / rnd.n) * rnd.n == Math.round(edit / rnd.amt) * rnd.amt) edit = Math.round(edit / rnd.n) * rnd.n;
		});
		waves[editI][data] = edit;
	} else {
		edit = window[data];
		if ("change" in opts) edit += opts.change;
		if ("min" in opts && edit < opts.min) edit = opts.min;
		if ("max" in opts && edit > opts.max) edit = opts.max;
		if ("rounds" in opts) opts.rounds.forEach((rnd) => {
			if (Math.round(edit / rnd.n) * rnd.n == Math.round(edit / rnd.amt) * rnd.amt) edit = Math.round(edit / rnd.n) * rnd.n;
		});
		window[data] = edit;
	}
	samplePoints();
	return edit;
}

function samplePoints() {
	points = [];
	for (let i = 0; i < numSamples * duration; i++) {
		let num = 0;
		waves.forEach(wave => {
			num += Math.cos(wave.phase + (i * Math.PI * 2 * wave.freq / (numSamples - 1))) * wave.amp;
		});
		points.push(num);
	}
}