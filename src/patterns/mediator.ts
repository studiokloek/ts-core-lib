import { Mixin } from 'ts-mixer';
import { ViewInterface, ViewOptions } from './view';
import { getLogger } from '../logger';
import { PubSubMixin } from '../events';
import { TickerMixin } from '../ticker';
import { DelayedMixin, Delayed } from '../delay';
import { Type } from '../util';

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
  protected async addMediator(_mediatorClass: Type<MediatorInterface>, _options?: {}, _register = true): Promise<MediatorInterface> {
    const mediator: MediatorInterface = new _mediatorClass(_options);

    if (_register) {
      this.mediators.push(mediator);
    }

    await mediator.init();

    await Delayed.wait(0.01);

    return mediator;
  }

  protected addView(_viewClass: Type<ViewInterface>, _options?: {}, _register = true): ViewInterface {
    const view: ViewInterface = new _viewClass(_options);

    if (_options) {
      const target = (_options as ViewOptions).target;
      if (target) {
        view.setTarget(target);
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

    this.mediators.forEach(mediator => mediator.prepareAfterLoad());
    this.views.forEach(view => view.prepareAfterLoad());
  }

  public cleanupBeforeUnload(): void {
    if (!this.isPrepared) return;
    this.isPrepared = false;

    this.removeTickers();
    this.killDelays();

    this.mediators.forEach(mediator => mediator.cleanupBeforeUnload());
    this.views.forEach(view => view.cleanupBeforeUnload());
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

    this.mediators.forEach(mediator => mediator.activate());
    this.views.forEach(view => view.activate());
  }

  public deactivate(): void {
    // Logger.debug(`Deactivating mediator...`);
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    this.pauseDelays();
    this.pauseTickers();

    this.mediators.forEach(mediator => mediator.deactivate());
    this.views.forEach(view => view.deactivate());
  }
}
