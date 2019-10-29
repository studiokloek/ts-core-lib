import { forIn } from 'lodash-es';
export * from './pubsub';
export * from './keyboard';
// prefix achter event names (handig voor logging)
export function fixEventNames(eventObject, suffix) {
    forIn(eventObject, (value, key) => {
        eventObject[key] = `${suffix}_${value}`.toUpperCase();
    });
}
//# sourceMappingURL=index.js.map