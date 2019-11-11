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
    get: function() {
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

window.addEventListener('keydown', event => {
  currentKeys[event.key] = true;
  event.preventDefault();
});

window.addEventListener('keyup', event => {
  currentKeys[event.key] = false;
  event.preventDefault();
});

export const Keyboard = {
  isDown: (key: string) => currentKeys[key] === true,

  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  SPACE: ' ',
  ENTER: 'Enter',
};
