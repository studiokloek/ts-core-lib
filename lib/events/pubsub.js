import { isArrayLikeObject, isEmpty } from 'lodash-es';
import ConcretePubSubJS from 'pubsub-js';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { Delayed } from '@studiokloek/kloek-ts-core/ticker';
import { CoreDebug } from '@studiokloek/kloek-ts-core/core-debug';
// directe errors in pubsub in de debug modus
ConcretePubSubJS.immediateExceptions = CoreDebug.isEnabled();
const Logger = getLogger('core > pubsub');
const table = new Map();
function subscribe(message, func) {
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
    id = ConcretePubSubJS.subscribe(message, (_message, data) => {
        func(data);
    });
    table.set(func, id);
    return id;
}
function subscribeOnce(message, func) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = subscribe(message, (data) => {
        if (id) {
            unsubscribe(id);
        }
        func(data);
    });
    return id;
}
function _doUnsubscribe(value) {
    if (typeof value === 'function') {
        ConcretePubSubJS.unsubscribe(table.get(value));
        table.delete(value);
    }
    else {
        ConcretePubSubJS.unsubscribe(value);
    }
}
function unsubscribe(value) {
    // async to make sure event in this tick still take place
    Delayed.async(() => {
        if (isArrayLikeObject(value)) {
            value.forEach((v) => {
                unsubscribe(v);
            });
        }
        else {
            _doUnsubscribe(value);
        }
    });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publish(message, data, report = false) {
    if (isEmpty(message)) {
        Logger.error('No message provided for Pubsub.publish()');
    }
    if (report === true) {
        Logger.debug(`publish() ${message.toUpperCase()} ->`, data);
    }
    return ConcretePubSubJS.publish(message, data);
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function publishSync(message, data, report = false) {
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
    constructor() {
        this.__pubsubSubscriptions = {};
    }
    subscribe(message, func) {
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
    unsubscribe(message) {
        const id = this.__pubsubSubscriptions[message];
        if (id) {
            unsubscribe(id);
        }
    }
    unsubscribeAll() {
        const ids = Object.values(this.__pubsubSubscriptions);
        for (const id of ids) {
            unsubscribe(id);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publish(message, data, report = false) {
        return publish(message, data, report);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    publishSync(message, data, report = false) {
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
//# sourceMappingURL=pubsub.js.map