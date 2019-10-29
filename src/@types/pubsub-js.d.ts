declare namespace PubSub {
  interface Base extends Publish, Subscribe, Unsubscribe, Clear {
    version: string;
    name: string;
    immediateExceptions: boolean;
  }

  interface Publish {
    publish(message: string, data: any): boolean;

    publish(message: string, data: any, sync: boolean, immediateExceptions: Function): boolean;

    publishSync(message: string, data: any): boolean;
  }

  interface Subscribe {
    subscribe(message: string, func: Function): string;
    subscribeOnce(message: string, func: Function): Base;
  }

  interface Unsubscribe {
    unsubscribe(value: Function | string): boolean;
  }

  interface Clear {
    clearAllSubscriptions(): void;
    clearSubscriptions(topic: string): void;
  }
}

declare var ConcretePubSubJS: PubSub.Base;

declare module 'pubsub-js' {
  export = ConcretePubSubJS;
}
