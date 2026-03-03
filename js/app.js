var xmldata = [];
var dishNames = [];
var dishAngles = [];
var dishStatuses = [];
var dishDownloads = [];
var dishUploads = [];
var currentDish = -1;
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function parseXML(xml, device){
    var nodes = xml.childNodes
    if(nodes.length == 0){
        return false
    }
    for(var i = 0; i < nodes.length; i++){
        var node = nodes[i];
        switch( node.nodeName){
            case "dsn": 
                parseXML(node, device);
            break;
            case "dish":
                currentDish++;
                dishNames[currentDish] = node.getAttribute("name");
                dishAngles[currentDish] = node.getAttribute("azimuthAngle");
                dishStatuses[currentDish] = 1;
                dishUploads[currentDish] = false;
                dishDownloads[currentDish] = false;
                //console.log("found dish " + node.getAttribute("name") + " as dish " + currentDish);
                parseXML(node, device);
            break;
            case "upSignal":
                //console.log("signal is " + node.getAttribute("active"))
                if(node.getAttribute("active") === 'true' && (!dishUploads[currentDish] === true)){
                    dishStatuses[currentDish] += 1;
                    dishUploads[currentDish] = true;
                    //console.log("dish " + dishNames[currentDish] + " status set to " + dishStatuses[currentDish]);
                }
            break;
            case "downSignal":
                //console.log("signal is " + node.getAttribute("active"))
                if(node.getAttribute("active") === 'true' && (!dishDownloads[currentDish] === true)){
                    dishStatuses[currentDish] += 2;
                    dishDownloads[currentDish] = true;
                    //console.log("dish " + dishNames[currentDish] + " status set to " + dishStatuses[currentDish]);
                }
            break;
            default:
            break;
        }
    }
}

async function setup() {
    // Create AudioContext
    const WAContext = window.AudioContext || window.webkitAudioContext;
    const context = new WAContext();

    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);

    document.body.onclick = () => {
        context.resume();
    }

    const antennaPatchURL = "export/midipatch.export.json";
    const synthPatchURL = "export/poli-container.export.json";

    if (!window.RNBO) {
        // Load RNBO script dynamically
        // Note that you can skip this by knowing the RNBO version of your patch
        // beforehand and just include it using a <script> tag
        await loadRNBOScript("1.4.2");
    }
    // Fetch the exported patcher
    const response = await fetch(antennaPatchURL);
    const antennaPatcher = await response.json();
    const antennaPatcher2 = antennaPatcher;

    //console.log(antennaPatcher);

    // Create the device
        // Create the device
    const antenna1 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna2 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna3 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna4 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna5 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna6 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna7 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna8 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna9 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna10 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna11 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna12 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna13 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antenna14 = await RNBO.createDevice({ context, patcher: antennaPatcher });
    const antennas = [antenna1, antenna2, antenna3, antenna4, antenna5, antenna6, antenna7, antenna8,
                     antenna9, antenna10, antenna11, antenna12, antenna13, antenna14];
    
    
    const synthResponse = await fetch(synthPatchURL);
    const synthPatcher = await synthResponse.json();
    const synth = await RNBO.createDevice({ context, patcher: synthPatcher });

    synth.node.connect(outputNode);

//    document.getElementById("patcher-title").innerText = (patcher.desc.meta.filename || "Unnamed Patcher") + " (v" + patcher.desc.meta.rnboversion + ")";

    //makeSliders(device);

    FetchData(antennas);

//    handleMidi(antenna1);

    HandleFetches(antennas,antenna1);
    antennas.forEach((a,index) => {
        a.midiEvent.subscribe((ev) => {
            //console.log("midi");
            synth.scheduleEvent(ev);
        });
    })

    const event1 = new RNBO.MessageEvent(RNBO.TimeNow, "in1", [ 1 ]);
    antennas.forEach((a,index) => {
        a.scheduleEvent(event1);
    })

}

function loadRNBOScript(version) {
    return new Promise((resolve, reject) => {
        if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
            throw new Error("Patcher exported with a Debug Version!\nPlease specify the correct RNBO version to use in the code.");
        }
        const el = document.createElement("script");
        el.src = "https://c74-public.nyc3.digitaloceanspaces.com/rnbo/" + encodeURIComponent(version) + "/rnbo.min.js";
        el.onload = resolve;
        el.onerror = function(err) {
            console.log(err);
            reject(new Error("Failed to load rnbo.js v" + version));
        };
        document.body.append(el);
    });
}

function makeSliders(device) {
    let pdiv = document.getElementById("rnbo-parameter-sliders");
    let noParamLabel = document.getElementById("no-param-label");
    if (noParamLabel && device.numParameters > 0) pdiv.removeChild(noParamLabel);

    // This will allow us to ignore parameter update events while dragging the slider.
    let isDraggingSlider = false;
    let uiElements = {};

    device.parameters.forEach(param => {
        // Subpatchers also have params. If we want to expose top-level
        // params only, the best way to determine if a parameter is top level
        // or not is to exclude parameters with a '/' in them.
        // You can uncomment the following line if you don't want to include subpatcher params
        
        //if (param.id.includes("/")) return;

        // Create a label, an input slider and a value display
        let label = document.createElement("label");
        let slider = document.createElement("input");
        let text = document.createElement("input");
        let sliderContainer = document.createElement("div");
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(text);

        // Add a name for the label
        label.setAttribute("name", param.name);
        label.setAttribute("for", param.name);
        label.setAttribute("class", "param-label");
        label.textContent = `${param.name}: `;

        // Make each slider reflect its parameter
        slider.setAttribute("type", "range");
        slider.setAttribute("class", "param-slider");
        slider.setAttribute("id", param.id);
        console.log(param.id)
        slider.setAttribute("name", param.name);
        slider.setAttribute("min", param.min);
        slider.setAttribute("max", param.max);
        if (param.steps > 1) {
            slider.setAttribute("step", (param.max - param.min) / (param.steps - 1));
        } else {
            slider.setAttribute("step", (param.max - param.min) / 1000.0);
        }
        slider.setAttribute("value", param.value);

        // Make a settable text input display for the value
        text.setAttribute("value", param.value.toFixed(1));
        text.setAttribute("type", "text");

        // Make each slider control its parameter
        slider.addEventListener("pointerdown", () => {
            isDraggingSlider = true;
        });
        slider.addEventListener("pointerup", () => {
            isDraggingSlider = false;
            slider.value = param.value;
            text.value = param.value.toFixed(1);
        });
        slider.addEventListener("input", () => {
            let value = Number.parseFloat(slider.value);
            param.value = value;
        });

        // Make the text box input control the parameter value as well
        text.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
                let newValue = Number.parseFloat(text.value);
                if (isNaN(newValue)) {
                    text.value = param.value;
                } else {
                    newValue = Math.min(newValue, param.max);
                    newValue = Math.max(newValue, param.min);
                    text.value = newValue;
                    param.value = newValue;
                }
            }
        });

        // Store the slider and text by name so we can access them later
        uiElements[param.id] = { slider, text };

        // Add the slider element
        pdiv.appendChild(sliderContainer);
    });

    // Listen to parameter changes from the device
    device.parameterChangeEvent.subscribe(param => {
        if (!isDraggingSlider)
            uiElements[param.id].slider.value = param.value;
        uiElements[param.id].text.value = param.value.toFixed(1);
    });
}

function makeInportForm(device) {
    const idiv = document.getElementById("rnbo-inports");
    const inportSelect = document.getElementById("inport-select");
    const inportText = document.getElementById("inport-text");
    const inportForm = document.getElementById("inport-form");
    let inportTag = null;
    
    // Device messages correspond to inlets/outlets or inports/outports
    // You can filter for one or the other using the "type" of the message
    const messages = device.messages;
    const inports = messages.filter(message => message.type === RNBO.MessagePortType.Inport);

    if (inports.length === 0) {
        idiv.removeChild(document.getElementById("inport-form"));
        return;
    } else {
        idiv.removeChild(document.getElementById("no-inports-label"));
        inports.forEach(inport => {
            const option = document.createElement("option");
            option.innerText = inport.tag;
            inportSelect.appendChild(option);
        });
        inportSelect.onchange = () => inportTag = inportSelect.value;
        inportTag = inportSelect.value;

        inportForm.onsubmit = (ev) => {
            // Do this or else the page will reload
            ev.preventDefault();

            // Turn the text into a list of numbers (RNBO messages must be numbers, not text)
            const values = inportText.value.split(/\s+/).map(s => parseFloat(s));
            
            // Send the message event to the RNBO device
            let messageEvent = new RNBO.MessageEvent(RNBO.TimeNow, inportTag, values);
            device.scheduleEvent(messageEvent);
        }
    }
}

function attachOutports(device) {
    const outports = device.outports;
    if (outports.length < 1) {
        document.getElementById("rnbo-console").removeChild(document.getElementById("rnbo-console-div"));
        return;
    }

    document.getElementById("rnbo-console").removeChild(document.getElementById("no-outports-label"));
    device.messageEvent.subscribe((ev) => {

        // Ignore message events that don't belong to an outport
        if (outports.findIndex(elt => elt.tag === ev.tag) < 0) return;

        // Message events have a tag as well as a payload
        //console.log(`${ev.tag}: ${ev.payload}`);

        document.getElementById("rnbo-console-readout").innerText = `${ev.tag}: ${ev.payload}`;
    });
}

function loadPresets(device, patcher) {
    let presets = patcher.presets || [];
    if (presets.length < 1) {
        document.getElementById("rnbo-presets").removeChild(document.getElementById("preset-select"));
        return;
    }

    document.getElementById("rnbo-presets").removeChild(document.getElementById("no-presets-label"));
    let presetSelect = document.getElementById("preset-select");
    presets.forEach((preset, index) => {
        const option = document.createElement("option");
        option.innerText = preset.name;
        option.value = index;
        presetSelect.appendChild(option);
    });
    presetSelect.onchange = () => device.setPreset(presets[presetSelect.value].preset);
}

function FetchData(device) {
    const antennas = device;
    var currentAntenna;

		var request = new XMLHttpRequest ();
		request.open("GET", "https://eyes.nasa.gov/dsn/data/dsn.xml", true);
		request.onreadystatechange = function ()
		{
			if (request.readyState == 4 && (request.status == 200 || request.status == 0))
			{
                var xml = $.parseXML(request.responseText);
                currentDish = -1;
				parseXML(xml, device);
                //console.log(dishStatuses);
                for(var dishes = 0; dishes <= currentDish; dishes++){
                    currentAntenna = antennas[dishes];
                    var setting = "AntennaAngle";
                    var param = currentAntenna.parametersById.get(setting);
                    param.value = dishAngles[dishes];
                    setting = "AntennaNumber";
                    param = currentAntenna.parametersById.get(setting);
                    param.value = dishes+1;
                    setting = "AntennaStatus";
                    param = currentAntenna.parametersById.get(setting);
                    param.value = dishStatuses[dishes];
                }
			}
		}
		request.send();
}

async function handleMidi(device) {
// ev is of type MIDIEvent

const smplr = await import('https://unpkg.com/smplr/dist/index.mjs');
const SoundFont = smplr.SoundFont
const context = new AudioContext();
const instrument = new Soundfont(context, { instrument: "lead_3_calliope" });
device.midiEvent.subscribe((ev) => {
    // Handle the outgoing MIDIEvent
    let type = ev.data[0];

    // Test for note on
    if (type >> 4 === 9) {
        if(ev.data[2] > 0){
            let pitch = ev.data[1];
            let velocity = ev.data[2];
            //console.log(`Received MIDI note on with pitch ${pitch} and velocity ${velocity}`);
            instrument.start({ note: pitch, velocity: velocity, duration:0.2 });
        }
    }
});
}

function HandleFetches(antennas, device){
    device.messageEvent.subscribe((ev) => {
        if(ev.tag === "out1"){
            FetchData(antennas);
            var circledata = []
            d3.selectAll("#circles").remove();
            for(var i = 0; i <= currentDish; i++){
                circledata.push({id:dishNames[i],angle:dishAngles[i],visible:dishStatuses[i]>1})
            }
            const width = 300;
            const height = Math.min(500, width / 2);

            var g = svg.append("g");
            
            g.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
            .attr("id","circles")
            .selectAll("circle")
                .data(circledata)
                .enter()
                .append("circle")
                    .attr("cx", (d) => Math.sin(Math.PI*d.angle/180)*57)
                    .attr("cy", (d) => Math.cos(Math.PI*d.angle/180)*57)
                    .attr("r", 5)
                    .attr("visibility",(d) => d.visible === true? "visible" : "hidden")
                    .attr("fill", "black");

            g.selectAll("text")
                .data(circledata)
                .enter()
                .append("text")
                    .attr("x", (d) => Math.sin(Math.PI*d.angle/180)*57)
                    .attr("y", (d) => Math.cos(Math.PI*d.angle/180)*57-10)
                    .attr("visibility",(d) => d.visible === true? "visible" : "hidden")
                    .text((d) => d.id)
                    .attr("font-size",5)
                    .attr("text-anchor","middle")
                    .attr("fill","blue")
                    .attr("stroke","aqua")
                    .attr("stroke-width",0.1);

            d3.select("#arc1")
            .datum({startAngle:0, endAngle: 0.1})
            .transition()
                .ease(d3.easeLinear)
                .duration(2000)
                .attrTween("d", arcTween(tau+0.1));
        }
    }
    )
}


setup();


//d3
console.log(d3);
  const width = 300;
  const height = Math.min(500, width / 2);
  const outerRadius = height / 2 - 10;
  const innerRadius = outerRadius * 0.75;

   // https://tauday.com/tau-manifesto
  const tau = 2 * Math.PI;

  // Create the SVG container, and apply a transform such that the origin is the
  // center of the canvas. This way, we don’t need to position arcs individually.
  const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height]);
  const g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


  
  // An arc function with all values bound except the endAngle. So, to compute an
  // SVG path string for a given angle, we pass an object with an endAngle
  // property to the arc function, and it will return the corresponding string.
  const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)

  // Add the background arc, from 0 to 100% (tau).
  g.append("rect")
  .attr("x",-width/2)
  .attr("y",-height/2)
  .attr("width",width)
  .attr("height",height)
  .attr("fill","black");

  const background = g.append("path")
        .datum({startAngle: 0,endAngle:tau})
        .style("fill", "#ddd")
        .attr("d", arc);
  
  // Add the foreground arc in orange, currently showing 12.7%.
  const foreground = g.append("path")
        .attr("id","arc1")
        .datum({startAngle: 0,endAngle: 0.1})
        .style("fill", "orange")
        .attr("d", arc);

    viz.append(svg.node());
    // Every so often, start a transition to a new random angle. The attrTween
  // definition is encapsulated in a separate function (a closure) below.
  // Stop the interval when this block of code updates
  //invalidation.then(() => interval.stop());

  // Returns a tween for a transition’s "d" attribute, transitioning any selected
  // arcs from their current angle to the specified new angle.
  function arcTween(newAngle) {
    return function(d) {
      const interpolate = d3.interpolate(d.endAngle, newAngle);
      return function(t) {
      
        d.endAngle = interpolate(t);
        d.startAngle = d.endAngle-0.1;
        return arc(d);
      };
    };
  }