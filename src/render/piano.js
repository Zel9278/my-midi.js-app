function keys() {
  var keys = document.getElementById('keys');
  
  for(var n = 0; n < 88; n++) {
    var d = document.createElement("div");
    d.innerHTML = MIDI.noteToKey[n + 21];
    d.style.display = 'inline-block';
    d.style.backgroundColor = "#fff";
    d.style.fontSize = "5px";
    d.style.borderRadius = "0 0 15% 15%"
    d.style.border = "solid 1px #a1a1a1";
    d.style.width = "10px";
    d.style.height = "100px";
    colorElements.push(d);
    keys.appendChild(d);
  }
}