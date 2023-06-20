import { isArrayLikeObject, isEmpty } from 'lodash-es';
import ConcretePubSubJS from 'pubsub-js';
import { Delayed } from '../delay';
import { getLogger } from '../logger';

// directe errors in pubsub in de debug modus
const parameters = new URLSearchParams(location.search);
ConcretePubSubJS.immediateExceptions = parameters.has('debug');

const Logger = getLogger('events > pubsub');

export type PubSubCallback = (data: any) => void;

const table = new Map();
function subscribe(message: string, callback: PubSubCallback): string | undefined {
  if (isEmpty(message)) {
    Logger.error('No message provided for PubSub.subscribe().');
    return;
  }

  if (typeof callback !== 'function') {
    Logger.error(`No valid function provided for PubSub.subscribe(${message}).`);
    return;
  }

  let id = table.get(callback);

  if (id) {
    return id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  id = ConcretePubSubJS.subscribe(message, (_message: any, data: any) => {
    callback(data);
  });

  table.set(callback, id);

  return id;
}

function subscribeOnce(message: string, callback: PubSubCallback): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id = subscribe(message, (data: any) => {
    if (id) {
      unsubscribe(id);
    }

    callback(data);
  });

  return id;
}

function _doUnsubscribe(value: PubSubCallback | string): void {
  if (typeof value === 'function') {
    ConcretePubSubJS.unsubscribe(table.get(value));
    table.delete(value);
  } else {
    ConcretePubSubJS.unsubscribe(value);
  }
}

function unsubscribe(value: PubSubCallback | string | (PubSubCallback | string)[], _async = false): void {
  if (_async) {
    // async to make sure event in this tick still take place
    Delayed.async(() => {
      if (isArrayLikeObject(value)) {
        for (const v of value as []) {
          _doUnsubscribe(v);
        }
      } else {
        _doUnsubscribe(value);
      }
    });
  } else {
    if (isArrayLikeObject(value)) {
      for (const v of value as []) {
        _doUnsubscribe(v);
      }
    } else {
      _doUnsubscribe(value);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publish(message: string, data?: any, report = false): boolean {
  if (isEmpty(message)) {
    Logger.error('No message provided for Pubsub.publish()');
  }

  if (report === true) {
    Logger.debug(`publish() ${message.toUpperCase()} ->`, data);
  } else {
    Logger.verbose(`publish() ${message.toUpperCase()} ->`, data);
  }

  return ConcretePubSubJS.publish(message, data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publishSync(message: string, data?: any, report = false): boolean {
  if (isEmpty(message)) {
    throw new Error('No message provided for Pubsub.publish()');
  }

  if (report === true) {
    Logger.debug(`publish() ${message.toUpperCase()} ->`, data);
  } else {
    Logger.verbose(`publish() ${message.toUpperCase()} ->`, data);
  }

  return ConcretePubSubJS.publishSync(message, data);
}

// MIXIN

export class PubSubMixin {
  private __pubsubSubscriptions: { [key: string]: string } = {};
  protected subscribe(message: string, callback: PubSubCallback): void {
    // bestaat deze al?
    if (this.__pubsubSubscriptions[message]) {
      return;
    }

    // aanmelden
    const id = subscribe(message, callback);

    // bewaren
    if (id) {
      this.__pubsubSubscriptions[message] = id;
    }
  }

  protected unsubscribe(message: string): void {
    const id = this.__pubsubSubscriptions[message];

    if (id) {
      unsubscribe(id);
    }
  }

  protected unsubscribeAll(): void {
    const ids = Object.values(this.__pubsubSubscriptions);

    for (const id of ids) {
      unsubscribe(id);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected publish(message: string, data?: any, report = false): boolean {
    return publish(message, data, report);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected publishSync(message: string, data?: any, report = false): boolean {
    return publishSync(message, data, report);
  }
}

export const PubSub = {
  subscribe,
  subscribeOnce,
  unsubscribe,
  publish,
  publishSync,
};
