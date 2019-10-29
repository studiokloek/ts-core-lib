const currentKeys: { [key: number]: boolean } = {};

document.addEventListener('keydown', event => {
  currentKeys[event.keyCode] = true;
  event.preventDefault();
});

document.addEventListener('keyup', event => {
  currentKeys[event.keyCode] = false;
  event.preventDefault();
});

export const Key = {
  isDown: (key: number) => currentKeys[key] === true,
};

export const KeyCodes = {
  KEY_UP: 38,
  KEY_DOWN: 40,
  KEY_LEFT: 37,
  KEY_RIGHT: 39,
  SPACE: 32,
  SHIFT: 16,
  CTRL: 17,
  ALT: 18,
};
