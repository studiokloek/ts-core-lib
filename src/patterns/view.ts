import { get } from 'lodash-es';
import { Container } from 'pixi.js-legacy';
import { Mixin } from 'ts-mixer';
import { isPrepareCleanup, PrepareCleanupInterface } from './preparecleanup';
import { getLogger } from '../logger';
import { TickerMixin } from '../ticker';
import { TweenMixin } from '../tween';
import { DelayedMixin } from '../delay';
import { Type } from '../util';

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
  protected options: {};
  protected views: ViewInterface[] = [];
  protected target: Container | undefined;
  protected isPrepared = false;
  protected isActive = false;

  public constructor(_options?: {}) {
    super();
    this.options = { ..._options };
  }

  public addView(_viewClass: Type<ViewInterface>, _options?: {}, _register = true): ViewInterface {
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

    this.views.forEach(view => view.prepareAfterLoad());

    // prepare sprites
    // for (let key of Object.keys(this)) {
    //   if (key.indexOf('_') === 0) {
    //     continue;
    //   }

    //   const value = get(this, key);
    //   if (value && isPrepareCleanup(value) && !(value instanceof View)) {
    //     value.prepareAfterLoad();
    //   }
    // }

    for (const child of this.children) {
      // geen geregistreerde view, maar wel preparecleanup type?

      if (!this.views.includes(child as View) && isPrepareCleanup(child)) {
        child.prepareAfterLoad();
      }
    }
  }

  public cleanupBeforeUnload(): void {
    if (!this.isPrepared) {
      return;
    }
    this.isPrepared = false;

    this.views.forEach(view => view.cleanupBeforeUnload());

    // clean sprites
    // for (let key of Object.keys(this)) {
    //   if (key.indexOf('_') === 0) {
    //     continue;
    //   }

    //   const value = get(this, key);
    //   if (value && isPrepareCleanup(value) && !(value instanceof View)) {
    //     value.cleanupBeforeUnload();
    //   }
    // }

    for (const child of this.children) {
      // geen geregistreerde view, maar wel preparecleanup type?
      if (!this.views.includes(child as View) && isPrepareCleanup(child)) {
        child.cleanupBeforeUnload();
      }
    }

    this.killTweens();
    this.removeTickers();
    this.killDelays();
  }

  // ACTIVATE & DEACTIVATE
  public activate(): void {
    if (this.isActive) {
      return;
    }
    this.isActive = true;

    this.views.forEach(view => view.activate());

    this.resumeDelays();
    this.resumeTweens();
    this.resumeTickers();
  }

  public deactivate(): void {
    if (!this.isActive) {
      return;
    }
    this.isActive = false;

    this.views.forEach(view => view.deactivate());

    this.pauseDelays();
    this.pauseTweens();
    this.pauseTickers();
  }
}
