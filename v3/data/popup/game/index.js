const args = new URLSearchParams(location.search);
document.body.dataset.mode = args.get('mode');

let speed = 1;

window.onmessage = async e => {
  const {prefs} = e.data;

  const ab = await fetch('game.wasm').then(r => r.arrayBuffer());
  const {instance} = await WebAssembly.instantiate(ab, {Math});
  console.log(instance, ab);

  const canvasData = new Uint8Array(instance.exports.mem.buffer, 0x5000, 90000);
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('2d');
  const imageData = context.createImageData(300, 75);
  const u8 = new Uint8Array(instance.exports.mem.buffer, 0, 4);
  const onkey = (down, event) => {
    let bit;
    switch (event.code) {
    case 'Digit1':
    case 'Numpad1':
      document.body.dataset.speed = speed = 1;
      return;
    case 'Digit2':
    case 'Numpad2':
      document.body.dataset.speed = speed = 2;
      return;
    case 'Digit3':
    case 'Numpad3':
      document.body.dataset.speed = speed = 3;
      return;
    case 'KeyP':
      if (event.type === 'keydown') {
        paused = !paused;
        document.body.dataset.paused = paused;
        if (paused === false) {
          update();
        }
      }
      return;
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
    event.preventDefault();
    event.stopPropagation();
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
    event.stopPropagation();
  };
  canvas.addEventListener('touchstart', ontouch.bind(null, 1), false);
  canvas.addEventListener('touchend', ontouch.bind(null, 0), false);

  let paused = false;
  const update = () => {
    if (paused) {
      return;
    }
    instance.exports.run();

    if (prefs.mode === 'color') {
      canvasData.forEach((v, n) => {
        if (v === 173) { // cactus
          canvasData[n - 3] = 47;
          canvasData[n - 2] = 177;
          canvasData[n - 1] = 134;
        }
        if (v === 174) { // bird
          canvasData[n - 3] = 59;
          canvasData[n - 2] = 92;
          canvasData[n - 1] = 101;
        }
        if (v === 37) { // cloud
          canvasData[n - 3] = 38;
          canvasData[n - 2] = 103;
          canvasData[n - 1] = 207;
          canvasData[n] = 120;
        }
        if (v === 175) { // number
          canvasData[n - 3] = 38;
          canvasData[n - 2] = 103;
          canvasData[n - 1] = 207;
        }
        if (v === 170) { // ground
          canvasData[n - 3] = 135;
          canvasData[n - 2] = 101;
          canvasData[n - 1] = 71;
        }
        if (v === 176) { // game over
          canvasData[n - 3] = 218;
          canvasData[n - 2] = 22;
          canvasData[n - 1] = 19;
        }
      });
    }

    imageData.data.set(canvasData);
    context.putImageData(imageData, 0, 0);

    if (speed === 1) {
      requestAnimationFrame(update);
    }
    else if (speed === 2) {
      requestAnimationFrame(() => {
        requestAnimationFrame(update);
      });
    }
    else if (speed === 3) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(update);
        });
      });
    }
  };
  update();
  window.focus();
};

document.getElementById('expand').onclick = () => {
  const a = document.createElement('a');
  a.href = '?mode=window';
  a.target = '_blank';
  a.click();
};
