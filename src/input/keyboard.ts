// FIX IE & EDGE
function fixKey(): void {
  const event = KeyboardEvent.prototype,
    desc = Object.getOwnPropertyDescriptor(event, 'key');

  if (!desc) {
    return;
  }

  const keys: { [key: string]: string } = {
    Win: 'Meta',
    Scroll: 'ScrollLock',
    Spacebar: ' ',

    Down: 'ArrowDown',
    Left: 'ArrowLeft',
    Right: 'ArrowRight',
    Up: 'ArrowUp',

    Del: 'Delete',
    Apps: 'ContextMenu',
    Esc: 'Escape',

    Multiply: '*',
    Add: '+',
    Subtract: '-',
    Decimal: '.',
    Divide: '/',
  };

  Object.defineProperty(event, 'key', {
    get: function () {
      if (!desc || !desc.get) {
        return;
      }

      const key = desc.get.call(this);

      return keys.hasOwnProperty(key) ? keys[key] : key;
    },
  });
}
fixKey();

const currentKeys: { [key: string]: boolean } = {};

window.addEventListener('keydown', (event) => {
  currentKeys[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (event) => {
  currentKeys[event.key.toLowerCase()] = false;
});

window.addEventListener('blur', () => {
  for (const key in currentKeys) {
    currentKeys[key] = false;
  }
});

export const Keyboard = {
  isDown: (key: string) => currentKeys[key] === true,

  UP: 'arrowup',
  DOWN: 'arrowdown',
  LEFT: 'arrowleft',
  RIGHT: 'arrowright',
  SPACE: ' ',
  ENTER: 'enter',
  META: 'meta',
  SHIFT: 'shift',
  ALT: 'alt',
  CTRL: 'ctrl',
};
