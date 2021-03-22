import { get } from 'lodash-es';
import { Container } from 'pixi.js';
import { Mixin } from 'ts-mixer';
import { DelayedMixin } from '../delay';
import { getLogger } from '../logger';
import { TickerMixin } from '../ticker';
import { TweenMixin } from '../tween';
import { Type } from '../util';
import { isPrepareCleanup } from './preparecleanup';
import type { PrepareCleanupInterface } from './preparecleanup';

const Logger = getLogger('mediator > view');

export interface ViewOptions {
  target?: Container;
}

export interface ViewInterface extends Container {
  init(): void;
  prepareAfterLoad(): void;
  cleanupBeforeUnload(): void;
  activate(): void;
  deactivate(): void;
  setTarget(_target?: Container): void;
}

export class View extends Mixin(Container, TickerMixin, TweenMixin, DelayedMixin) implements ViewInterface, PrepareCleanupInterface {
  protected options: Record<string, unknown>;
  protected views: ViewInterface[] = [];
  protected target: Container | undefined;
  protected isPrepared = false;
  protected isActive = false;

  public constructor(_options?: {}) {
    super();
    this.options = { ..._options };
  }

  public addView(_viewClass: Type<ViewInterface>, _options?: Record<string, unknown>, _register = true): ViewInterface {
    const view: ViewInterface = new _viewClass(_options);

    const target = get(_options, 'target') as Container;
    if (target) {
      view.setTarget(target);
    } else {
      view.setTarget(this);
    }

    if (_register) {
      this.views.push(view);
    }

    view.init();

    return view;
  }

  // TARGET

  public setTarget(_target: Container | undefined): void {
    this.target = _target;
  }

  public addToTarget(): void {
    if (this.target) {
      this.target.addChild(this);
    }
  }

  public removeFromTarget(): void {
    if (this.target && this.parent) {
      this.target.removeChild(this);
    }
  }

  // INIT
  public init(): void {
    Logger.error('init() should be overwritten.');
  }

  // PREPARE / CLEANUP
  public prepareAfterLoad(): void {
    if (this.isPrepared) {
      return;
    }
    this.isPrepared = true;

    for (const view of this.views) view.prepareAfterLoad();

    for (const child of this.children) {
      // geen view, maar wel preparecleanup type?
      if (!(child as View).isView && isPrepareCleanup(child)) {
        child.prepareAfterLoad();
      }
    }
  }

  public cleanupBeforeUnload(): void {
    if (!this.isPrepared) {
      return;
    }
    this.isPrepared = false;

    this.killTweens();
    this.removeTickers();
    this.killDelays();

    for (const view of this.views) view.cleanupBeforeUnload();

    for (const child of this.children) {
      // geen view, maar wel preparecleanup type?
      if (!(child as View).isView && isPrepareCleanup(child)) {
        child.cleanupBeforeUnload();
      }
    }
  }

  // ACTIVATE & DEACTIVATE
  public activate(): void {
    if (this.isActive) {
      return;
    }
    this.isActive = true;

    this.resumeDelays();
    this.resumeTweens();
    this.resumeTickers();

    for (const view of this.views) view.activate();
  }

  public deactivate(): void {
    if (!this.isActive) {
      return;
    }
    this.isActive = false;

    this.pauseDelays();
    this.pauseTweens();
    this.pauseTickers();

    for (const view of this.views) view.deactivate();
  }

  public get isView(): boolean {
    return true;
  }
}
