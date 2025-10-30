export function squashForLog(_value?: {}): {} {
  if (_value) {
    return JSON.stringify(_value);
  } else {
    return '';
  }
}


export function objectToLog<T extends object>(_obj: T | undefined, _props: (keyof T)[] = [], multiLine = false): string {

  if (_obj === undefined) {
    return 'undefined';
  }

  let entries: [string, unknown][];

  if (_props.length > 0) {
    // volgorde zoals in props array
    entries = _props.filter((key) => key in _obj).map((key) => [key as string, _obj[key]]);
  } else {
    // alfabetisch sorteren als geen props meegegeven zijn
    entries = Object.entries(_obj).sort(([a], [b]) => a.localeCompare(b));
  }

  if (multiLine) {
    return `\n${entries.map(([key, value]) => `${key}: ${value}`).join('\n')}`;
  } else {
    return entries.map(([key, value]) => `${key}[${value}]`).join('  ');
  }
}
