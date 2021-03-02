fetch('dino.wasm').then(response => response.arrayBuffer()).then(bytes => WebAssembly.instantiate(bytes, {Math})).then(({instance}) => {
  const canvasData = new Uint8Array(instance.exports.mem.buffer, 0x5000, 90000);
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d');
  const imageData = context.createImageData(300, 75);
  const u8 = new Uint8Array(instance.exports.mem.buffer, 0, 4);
  const onkey = (down, event) => {
    let bit;
    switch (event.code) {
    case 'ArrowUp': bit = 1; break;
    case 'KeyW': bit = 1; break;
    case 'Space': bit = 1; break;
    case 'ArrowDown': bit = 2; break;
    case 'KeyS': bit = 2; break;
    default: return;
    }
    if (down) {
      u8[0] |= bit;
    }
    else {
      u8[0] &= ~bit;
    }
  };
  document.addEventListener('keydown', onkey.bind(null, 1), false);
  document.addEventListener('keyup', onkey.bind(null, 0), false);

  const touches = {};
  const ontouch = (down, event) => {
    for (const touch of event.changedTouches) {
      if (down) {
        let bit;
        if (touch.clientX < event.target.clientWidth * 0.5) {
          bit = 2; // down
        }
        else {
          bit = 1; // up
        }
        u8[0] |= bit;
        touches[touch.identifier] = bit;
      }
      else {
        u8[0] &= ~touches[touch.identifier];
        delete touches[touch.identifier];
      }
    }
    event.preventDefault();
  };
  canvas.addEventListener('touchstart', ontouch.bind(null, 1), false);
  canvas.addEventListener('touchend', ontouch.bind(null, 0), false);

  const update = () => {
    instance.exports.run();
    imageData.data.set(canvasData);
    context.putImageData(imageData, 0, 0);
    requestAnimationFrame(update);
  };
  update();
});
