function pianoroll(){
  var keyframe = canvas.height;
  function renderToCanvas() {
    keyframe -= 3;
    //reset();

    if(keyframe <= 0) {
      keyframe = canvas.height;
      reset();
    } else {
      var colorMap = MIDI.Synesthesia.map();
      pushKeys.forEach(key => {
        var map = colorMap[key];
        circle((key * 12) + 3, keyframe, 3, map.hex);
      });
    }
    requestAnimationFrame(renderToCanvas);
  }
  renderToCanvas();
}