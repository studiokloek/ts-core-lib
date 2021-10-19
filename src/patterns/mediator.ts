import { get } from 'lodash';
import { View } from '../patterns';
import { Container } from 'pixi.js';
import { Mixin } from 'ts-mixer';
import { Delayed, DelayedMixin } from '../delay';
import { PubSubMixin } from '../events';
import { getLogger } from '../logger';
import { TickerMixin } from '../ticker';
import { Type } from '../util';
import { ViewInterface, ViewOptions } from './view';

const Logger = getLogger('mediator');

export interface MediatorInterface {
  prepareAfterLoad(): void;
  cleanupBeforeUnload(): void;
  init(): Promise<void>;
  activate(): void;
  deactivate(): void;
}

export class Mediator extends Mixin(PubSubMixin, TickerMixin, DelayedMixin) implements MediatorInterface {
  protected isActive = false;
  protected isPrepared = false;
  protected isMediator = true;
  protected mediators: MediatorInterface[] = [];
  protected views: ViewInterface[] = [];

  public constructor() {
    super();
  }

  public async init(): Promise<void> {
    Logger.warn('init() method not implemented.');
  }

  // MEDIATORS & VIEWS
  protected async addMediator<T extends Mediator>(_mediatorClass: Type<T>, _options?: {}, _register = true): Promise<T> {
    const mediator: T = new _mediatorClass(_options);

    if (_register) {
      this.mediators.push(mediator);
    }

    await mediator.init();

    await Delayed.wait(0.01);

    return mediator;
  }

  protected addView<T extends View>(_viewClass: Type<T>, _options?: ViewOptions, _add = true, _register = true): T {
    const view: T = new _viewClass(_options);

    const target = get(_options, 'target') as Container;
    if (target) {
      view.setTarget(target);

      // ook toevoegen?
      if (_add) {
        view.addToTarget();
      }
    }

    if (_register) {
      this.views.push(view);
    }

    view.init();

    return view;
  }

  // PREPARE & CLEANUP

  public prepareAfterLoad(): void {
    if (this.isPrepared) return;
    this.isPrepared = true;

    for (const mediator of this.mediators) mediator.prepareAfterLoad();
    for (const view of this.views) view.prepareAfterLoad();
  }

  public cleanupBeforeUnload(): void {
    if (!this.isPrepared) return;
    this.isPrepared = false;

    this.removeTickers();
    this.killDelays();

    for (const mediator of this.mediators) mediator.cleanupBeforeUnload();
    for (const view of this.views) view.cleanupBeforeUnload();
  }

  // ACTIVATE & DEACTIVATE
  public activate(): void {
    // Logger.debug(`Activating mediator...`);

    if (this.isActive) {
      return;
    }

    this.isActive = true;

    this.resumeDelays();
    this.resumeTickers();

    for (const mediator of this.mediators) mediator.activate();
    for (const view of this.views) view.activate();
  }

  public deactivate(): void {
    // Logger.debug(`Deactivating mediator...`);
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    this.pauseDelays();
    this.pauseTickers();

    for (const mediator of this.mediators) mediator.deactivate();
    for (const view of this.views) view.deactivate();
  }
}
