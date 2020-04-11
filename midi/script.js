var canvas, ctx;

var fps = 0;
var frame = 0;
var startTime, endTime;

var colorElements = [];
var midiDevices = {
  inputs: {},
  outputs: {}
};
var selectedMidiDevices = {
  input: "Select...",
  output: "Select..."
}

var notes = "000000";
var nps = 0;
var pushKeys = [];

window.addEventListener("DOMContentLoaded", () => {
  keyRenderer();
  canvasRenderer();
  pianoroll();
  init();
  winInit();
  midiapi();
});

function init() {
  MIDI.loader = new sketch.ui.Timer();
  MIDI.loadPlugin({
    soundfontUrl: "./src/soundfont/",
    instrument: "artn",
    onprogress: (state, progress) => {
      MIDI.loader.setValue(progress * 100);
      console.log(state, progress);
    }
  });

  player = MIDI.Player;
  startTime = new Date().getTime();
  
  var colorMap = MIDI.Synesthesia.map();
  player.addListener(function(data) {
    var pianoKey = data.note - 21;
    var d = colorElements[pianoKey];
    if (d) {
      if (data.message === 144) {
        noteOn(data.note, data.velocity);
      } else {
        noteOff(data.note);
      }
    }
  });
  
  setInterval(() => {
    document.getElementById('nps').innerText = nps;
    nps = 0;
  }, 1000);
  
  gameLoop();
}

/*midiapi*/
function midiapi() {
  function requestSuccess(data) {
    console.log("success!!!", data);
    
    var inputIterator = data.inputs.values();
    for (var input = inputIterator.next(); !input.done; input = inputIterator.next()) {
      var value = input.value;
      midiDevices.inputs[value.name] = value;
      //value.addEventListener("midimessage", inputEvent, false);
    }
    
    var outputIterator = data.outputs.values();
    for (var output = outputIterator.next(); !output.done; output = outputIterator.next()) {
      var value = output.value;
      midiDevices.outputs[value.name] = value;
      value.addEventListener("midimessage", outputEvent, false);
    }
    setTimeout(() =>  {
      addMidiIOInWindow();
    }, 500);
  }

  function requestError(error) {
    console.error("error!!!", error);
    var options = document.getElementById('options');
    options.innerHTML = "<p>input: midiIO failed to load, or midi is not supported by this browser.<br>output: midiIO failed to load, or midi is not supported by this browser.</p>";
  }

  function requestMIDI() {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(requestSuccess, requestError);
    } else {
      requestError();
    }
  }
  requestMIDI();
}

function inputEvent(e) {
  //if(!e.target.enabled) return;
  var channel = e.data[0] & 0xf;
  var cmd = e.data[0] >> 4;
  var note_number = e.data[1];
  var vel = e.data[2];
  //console.log(channel, cmd, note_number, vel);
  if(cmd == 8 || (cmd == 9 && vel == 0)) {
    //console.log(e.data);
    noteOff(parseInt(e.data[1], 10));
  } else if(cmd == 9) {
    noteOn(parseInt(e.data[1], 10), parseInt(e.data[2], 10));
  }
}

function outputEvent(e) {

}
/*midiapi*/

/*player*/
function play() {
  player.BPM = null;
  
  player.loadFile("https://cdn.glitch.com/6e48be83-f015-4672-aa74-f2bca00c422a%2Fnon%20wowowwoo.mid", () => {
    player.timeWarp = 1;
    player.loadInstruments();
    player.start();
  });
}

function stop() {
  player.stop();
}
/*player*/

/*rendering*/
function keyRenderer() {
  keys();
  keyEvent();
}

function canvasRenderer(){
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = 1050;
  canvas.height = 200;
}

/*window.addEventListener( 'resize', function() {
  canvas.width = 1040;
  canvas.height = 200;
}, false );*/
/*rendering*/

/*noteevent*/
function noteOn(note, vel) {
  MIDI.noteOn(0, note, vel);
  var colorMap = MIDI.Synesthesia.map();
  var pianoKey = note - 21;
  var d = colorElements[pianoKey];
  var map = colorMap[pianoKey];
  if(d) {
    d.style.height = "105px";
    if(colorMap[note - 21]) d.style.backgroundColor = map.hex;
    d.style.animation = "";
    pushKeys.push(pianoKey);
    var ret = (notes++).toString().padStart(6, '0');
    document.getElementById('notes').innerText = ret;
    nps = nps += 1;
    
    (selectedMidiDevices.output === "Select...") ? "" : midiDevices.outputs[selectedMidiDevices.output].send(['0x90', "0x" + ('00' + Number(note).toString(16)).substr(-2), vel]);
    setTimeout(() => {
      //d.style.height = "100px";
      //d.style.backgroundColor = "#fff";
      d.style.animation = "reset 400ms both";
    }, 20);
    setTimeout(() => {
      
    }, 10);
  }
}

function noteOff(note) {
  MIDI.noteOff(0, note);
  pushKeys = pushKeys.filter(key => key !== note - 21);
  (selectedMidiDevices.output === "Select...") ? "" : midiDevices.outputs[selectedMidiDevices.output].send(['0x80', "0x" + ('00' + Number(note).toString(16)).substr(-2), '127']);
}
/*noteevent*/

/*keyevent*/
function keyEvent() {
  var BaseOctave = 2;
  var nowNote = [];
  var Note = function(note, octave) {
    this.note = note;
    this.octave = octave || 1;
  };
  var n = function(a, b) { return {note: new Note(a, b), held: false}; };
  var keymap = {
    //keyboard_str
    "1": n("Ab", BaseOctave + 1),//G#
    "a": n("Ab", BaseOctave),//G#
    "q": n("A", BaseOctave + 1),//A,
    "z": n("A", BaseOctave),//A,
    "2": n("Bb", BaseOctave + 1),//A#
    "s": n("Bb", BaseOctave),//A#
    "w": n("B", BaseOctave + 1),//B
    "x": n("B", BaseOctave),//B
    "e": n("C", BaseOctave + 2),//C
    "c": n("C", BaseOctave + 1),//C
    "4": n("Db", BaseOctave + 2),//C#
    "f": n("Db", BaseOctave + 1),//C#
    "r": n("D", BaseOctave + 2),//D
    "v": n("D", BaseOctave + 1),//D
    "5": n("Eb", BaseOctave + 2),//D#
    "g": n("Eb", BaseOctave + 1),//D#
    "t": n("E", BaseOctave + 2),//E
    "b": n("E", BaseOctave + 1),//E
    "y": n("F", BaseOctave + 2),//F
    "n": n("F", BaseOctave + 1),//F
    "7": n("Gb", BaseOctave + 2),//F#
    "j": n("Gb", BaseOctave + 1),//F#
    "u": n("G", BaseOctave + 2),//G
    "m": n("G", BaseOctave + 1),//G
    "8": n("Ab", BaseOctave + 2),//G#
    "k": n("Ab", BaseOctave + 1),//G#
    "i": n("A", BaseOctave + 2),//A
    ",": n("A", BaseOctave + 1),//A
    "9": n("Bb", BaseOctave + 2),//A#
    "l": n("Bb", BaseOctave + 1),//A#
    "o": n("B", BaseOctave + 2),//B
    ".": n("B", BaseOctave + 1),//B
    "/": n("C", BaseOctave + 2),//C
    "p": n("C", BaseOctave + 3),//C
    "@": n("D", BaseOctave + 3),//D
    "-": n("Db", BaseOctave + 3),//C#
    "^": n("Eb", BaseOctave + 3),//C#
    //keyboard_str
  };
  
  const handler = {
    on(e) {
      if(e.key) {
        var binding = keymap[e.key];
        if(binding && !binding.held) {
          binding.held = true;
          var note = e.target.innerText;
          noteOn(MIDI.keyToNote[note], 127);
          return;
        }
      } else {
        e.preventDefault();
        var note = e.target.innerText;
        noteOn(MIDI.keyToNote[note], 127);
        nowNote.push({note: note});
      }
    },
    off(e) {
      if(e.key) {
        var binding = keymap[e.key];
        if(binding && binding.held) {
          binding.held = false;
          var note = e.target.innerText;
          noteOff(MIDI.keyToNote[note]);
          return;
        }
        var note = e.target.innerText;
        noteOff(MIDI.keyToNote[note]);
        return;
      }
      e.preventDefault();
      var note = e.target.innerText;
      nowNote.forEach(nn => {
        noteOff(MIDI.keyToNote[nn.note]);
      });
      nowNote = [];
    }
  };
  
  $("#keys").mousedown(handler.on).on("touchstart", handler.on).on("touchend", handler.off);
  $(document).keypress(handler.on).on("keyup", handler.off);
  $(document.body).mouseup(handler.off).on("touchstop", handler.off);
  $(document).mouseup(handler.off).on("touchstop", handler.off);
}
/*keyevent*/

/*canvas*/
function reset() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function circle(x, y, radius, color) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
/*canvas*/

/*debug*/
function gameLoop(){
  frame ++;
  document.getElementById('FPS').innerText = fps;
  endTime = new Date().getTime();
  if(endTime - startTime >= 1000){
    fps = frame;
    frame = 0;
    startTime = new Date().getTime();
  }
  requestAnimationFrame(gameLoop);
}
/*debug*/

/*window*/
function winInit() {
  var onMove = false;
  var onSmartPhone = false;
  var move_start_x, move_start_y;
  
  /*border*/
  var border_top = document.createElement("div");
  border_top.style.position = "absolute";
  border_top.style.top = "0";
  border_top.style.width = "100%";
  border_top.style.height = "1px";
  border_top.style.background = "#a1a1a1";

  var border_left = document.createElement("div");
  border_left.style.position = "absolute";
  border_left.style.left = "0";
  border_left.style.width = "1px";
  border_left.style.height = "100%";
  border_left.style.background = "#a1a1a1";

  var border_right = document.createElement("div");
  border_right.style.position = "absolute";
  border_right.style.right = "0";
  border_right.style.width = "1px";
  border_right.style.height = "100%";
  border_right.style.background = "#a1a1a1";

  var border_bottom = document.createElement("div");
  border_bottom.style.position = "absolute";
  border_bottom.style.bottom = "0"
  border_bottom.style.width = "100%";
  border_bottom.style.height = "1px";
  border_bottom.style.background = "#a1a1a1";
  
  border_top.setAttribute("id", "border_top");
  border_left.setAttribute("id", "border_left");
  border_right.setAttribute("id", "border_right");
  border_bottom.setAttribute("id", "border_bottom");
  /*border*/
  
  var mw = document.createElement("div");
  mw.setAttribute("id", "window");
  document.body.appendChild(mw);
  
  var option = document.getElementById("window");
  option.style.position = "absolute";
  option.style.left = "20px";
  option.style.top = "20px";
  option.style.width = "280px";
  option.style.height = "150px";
  //option.style.border = "solid 1px #a1a1a1";
  //option.style.boxSizing = "border-box";
  option.style.background = "#ffffff50";
  
  option.appendChild(border_top);
  option.appendChild(border_left);
  option.appendChild(border_right);
  var tb = document.createElement("div");
  var title = document.createTextNode("optionWindow");
  
  tb.style.cursor = "move";
  tb.style.background =  "#ffff00";
  tb.setAttribute("id", "titleBar");
  tb.appendChild(title);
  option.appendChild(tb);
  
  var options = document.createElement("div");
  options.setAttribute("id", "options");
  options.style.width = "100%";
  options.style.height = "88%";
  options.style.overflow = "auto";
	option.appendChild(options);
  
  var titleBar = document.getElementById("titleBar");
  
  option.appendChild(border_bottom);

  option.addEventListener('mousedown', onWindowDown, false);
  option.addEventListener('mouseup', onWindowUp, false);
  option.addEventListener('touchstart', onWindowDown, false);
  option.addEventListener('touchend', onWindowUp, false);
  option.addEventListener('touchcancel', onWindowUp, false);
  option.addEventListener("mousemove", onWindowMove,false);
  document.body.addEventListener("touchmove", onWindowMove,false);
  
  function onWindowDown(e) {
    if(e.target === titleBar) {
      onMove = true;
      if(e.changedTouches  != null) {
        onSmartPhone = true;
        var touch = e.changedTouches[0];
        move_start_x = touch.clientX - parseInt(option.style.left.replace("px","")); 
        move_start_y = touch.clientY - parseInt(option.style.top.replace("px","")); 
      } else {
        onSmartPhone = false;
        move_start_x = e.clientX - parseInt(option.style.left.replace("px","")); 
        move_start_y = e.clientY - parseInt(option.style.top.replace("px","")); 
      }
    }
  }

  function onWindowUp(e) {
    onMove = false;
  }

  function onWindowMove(e) {
    if(onMove) {
      e.preventDefault();
      if(onSmartPhone) {
        var touch = e.changedTouches[0];
        option.style.left = (touch.clientX - move_start_x) + "px"; 
        option.style.top = (touch.clientY -  move_start_y) + "px";
      } else {
        option.style.left = (e.clientX - move_start_x) + "px"; 
        option.style.top = (e.clientY -  move_start_y) + "px";
      }
    }
  }
}

function addMidiIOInWindow() {
  var options = document.getElementById('options');
  var midiIO = document.createElement("div");
  midiIO.setAttribute("id", "midiIO");
  
  //midiIN
  var miText = document.createElement("p");
  miText.innerText = "input: ";
  var midiInSelect = document.createElement("select");
  midiInSelect.setAttribute("id", "midiInSelect");
  midiIO.appendChild(miText);
  midiIO.appendChild(midiInSelect);
  options.appendChild(midiIO);
  var ist = document.createElement("option");
  ist.text = "Select...";
  midiInSelect.appendChild(ist);
  Object.keys(midiDevices.inputs).forEach(_in => {
    var mn = midiDevices.inputs[_in].name;
    var mis = document.getElementById('midiInSelect');
    var _input = document.createElement("option");
    _input.value = mn;
    _input.text = mn;
    mis.appendChild(_input);
  });
  
  //midiOUT
  var moText = document.createElement("p");
  moText.innerText = "output: ";
  var midiOutSelect = document.createElement("select");
  midiOutSelect.setAttribute("id", "midiOutSelect");
  midiIO.appendChild(moText);
  midiIO.appendChild(midiOutSelect);
  options.appendChild(midiIO);
  var ost = document.createElement("option");
  ost.text = "Select...";
  midiOutSelect.appendChild(ost);
  Object.keys(midiDevices.outputs).forEach(_out => {
    var mn = midiDevices.outputs[_out].name;
    var mos = document.getElementById('midiOutSelect');
    var _output = document.createElement("option");
    _output.value = mn;
    _output.text = mn;
    mos.appendChild(_output);
  });
  
  midiOutSelect.addEventListener("change", (e) => {
    (selectedMidiDevices.output === "Select...") ? "" : midiDevices.outputs[selectedMidiDevices.output].close();
    selectedMidiDevices.output = e.target.value;
  });
  midiInSelect.addEventListener("change", (e) => {
    (selectedMidiDevices.input === "Select...") ? "" : midiDevices.inputs[selectedMidiDevices.input].close();
    (selectedMidiDevices.input === "Select...") ? "" : midiDevices.inputs[selectedMidiDevices.input].removeEventListener("midimessage", inputEvent, false);
    pushKeys = [];
    selectedMidiDevices.input = e.target.value;
    (selectedMidiDevices.input === "Select...") ? "" : midiDevices.inputs[selectedMidiDevices.input].addEventListener("midimessage", inputEvent, false);
  });
}
/*window*/