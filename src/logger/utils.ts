export function squashForLog(_value?: {}): {} {
  if (_value) {
    return JSON.stringify(_value);
  } else {
    return '';
  }
}
