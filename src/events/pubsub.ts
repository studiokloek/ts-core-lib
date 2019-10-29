import { isArrayLikeObject, isEmpty } from 'lodash-es';
import ConcretePubSubJS from 'pubsub-js';
import { CoreDebug } from '../debug';
import { Delayed } from '../delay';
import { getLogger } from '../logger';

// directe errors in pubsub in de debug modus
ConcretePubSubJS.immediateExceptions = CoreDebug.isEnabled();

const Logger = getLogger('core > pubsub');

const table = new Map();
function subscribe(message: string, func: Function): string | undefined {
  if (isEmpty(message)) {
    Logger.error('No message provided for PubSub.subscribe().');
    return;
  }

  if (typeof func !== 'function') {
    Logger.error(`No valid function provided for PubSub.subscribe(${message}).`);
    return;
  }

  let id = table.get(func);

  if (id) {
    return id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  id = ConcretePubSubJS.subscribe(message, (_message: any, data: any) => {
    func(data);
  });

  table.set(func, id);

  return id;
}

function subscribeOnce(message: string, func: Function): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id = subscribe(message, (data: any) => {
    if (id) {
      unsubscribe(id);
    }

    func(data);
  });

  return id;
}

function _doUnsubscribe(value: Function | string): void {
  if (typeof value === 'function') {
    ConcretePubSubJS.unsubscribe(table.get(value));
    table.delete(value);
  } else {
    ConcretePubSubJS.unsubscribe(value);
  }
}

function unsubscribe(value: Function | string | (Function | string)[]): void {
  // async to make sure event in this tick still take place
  Delayed.async(() => {
    if (isArrayLikeObject(value)) {
      (value as []).forEach((v: Function | string) => {
        unsubscribe(v);
      });
    } else {
      _doUnsubscribe(value);
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publish(message: string, data?: any, report: boolean = false): boolean {
  if (isEmpty(message)) {
    Logger.error('No message provided for Pubsub.publish()');
  }

  if (report === true) {
    Logger.debug(`publish() ${message.toUpperCase()} ->`, data);
  }

  return ConcretePubSubJS.publish(message, data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publishSync(message: string, data?: any, report: boolean = false): boolean {
  if (isEmpty(message)) {
    throw new Error('No message provided for Pubsub.publish()');
  }

  if (report === true) {
    Logger.debug(`publish() ${message.toUpperCase()} ->`, data);
  }

  return ConcretePubSubJS.publishSync(message, data);
}

// MIXIN

export class PubSubMixin {
  private __pubsubSubscriptions: { [key: string]: string } = {};
  protected subscribe(message: string, func: Function): void {
    // bestaat deze al?
    if (this.__pubsubSubscriptions[message]) {
      return;
    }

    // aanmelden
    const id = subscribe(message, func);

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
  protected publish(message: string, data?: any, report: boolean = false): boolean {
    return publish(message, data, report);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected publishSync(message: string, data?: any, report: boolean = false): boolean {
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
