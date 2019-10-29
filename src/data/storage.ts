import { getLogger } from 'logger';
import { Plugins } from '@capacitor/core';
import { getValueFromJSON } from './util';

const { Storage } = Plugins;

const Logger = getLogger('core > data > localstorage');

class ConcreteStorage {
  public constructor() {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async set(key?: string, value?: any): Promise<void> {
    if (!key) {
      Logger.error('set', 'No valid key provided');
      return;
    }

    // er kan alleen een string opgeslagen worden
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }

    await Storage.set({ key, value });

    Logger.debug('set', `${key}`, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async get(key?: string): Promise<any> {
    if (!key) {
      Logger.error('get', 'No valid key provided');
      return;
    }

    const returnValue = await Storage.get({ key });

    let value;

    if (returnValue && returnValue.value) {
      value = getValueFromJSON(returnValue.value);
    }

    Logger.debug('get', `${key}`, value);

    return value;
  }

  public async remove(key?: string): Promise<void> {
    if (!key) {
      Logger.error('remove', 'No valid key provided');
      return;
    }

    await Storage.remove({ key });

    Logger.debug('remove', `${key}`);
  }

  public async keys(): Promise<string[]> {
    const returnValue = await Storage.keys();

    if (returnValue && returnValue.keys) {
      return returnValue.keys;
    } else {
      return [];
    }
  }

  public async clear(): Promise<void> {
    await Storage.clear();
    Logger.debug('cleared all storage!');
  }
}

export const LocalStorage = new ConcreteStorage();
