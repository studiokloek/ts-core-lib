import { get, isPlainObject } from 'lodash-es';
import { Container } from 'pixi.js';
import { Mixin } from 'ts-mixer';
import { DelayedMixin } from '../delay';
import { getLogger } from '../logger';
import { TickerMixin } from '../ticker';
import { TweenMixin } from '../tween';
import { Type } from '../util';
import { isPrepareCleanup } from './preparecleanup';
import type { PrepareCleanupInterface } from './preparecleanup';
import { KloekSprite, KloekText, KloekSpriteDefaults } from '../ui';
import { SpriteAsset, SpriteAssetWithMeta } from '../loaders';

const Logger = getLogger('mediator > view');

export interface ViewOptions {
  target?: Container;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
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
  protected options: ViewOptions;
  protected views: ViewInterface[] = [];
  protected kloeksprites: KloekSprite[] = [];
  protected kloektexts: KloekText[] = [];
  protected target: Container | undefined;
  protected isPrepared = false;
  protected isActive = false;

  public constructor(_options?: ViewOptions) {
    super();
    this.options = { ..._options };
  }

  public addView<T extends View>(_viewClass: Type<T>, _options?: ViewOptions, _add = true, _register = true): T {
    const view: T = new _viewClass(_options);

    const target = get(_options, 'target') as Container;
    if (target) {
      view.setTarget(target);
    } else {
      view.setTarget(this);
    }

    // ook toevoegen?
    if (_add) {
      view.addToTarget();
    }

    if (_register) {
      this.views.push(view);
    }

    view.init();

    return view;
  }

  public addSprite(
    _asset: SpriteAsset | SpriteAssetWithMeta,
    _defaults?: KloekSpriteDefaults,
    _targetOrAdd: Container | boolean = true,
    _add = true,
    _register = true,
  ): KloekSprite {
    const sprite = KloekSprite.create(_asset, _defaults);

    if (_targetOrAdd === true) {
      // true? dan toevoegen aan deze view
      sprite.setTarget(this);
      sprite.addToTarget();
    } else if (_targetOrAdd) {
      // andere target
      sprite.setTarget(_targetOrAdd);

      // ook toevoegen?
      if (_add) {
        sprite.addToTarget();
      }
    }

    if (_register) {
      this.kloeksprites.push(sprite);
    }

    return sprite;
  }

  public addText(
    _text: string,
    _style: string,
    _styleOverwriteOrTargetOrAdd: Record<string, unknown> | Container | boolean = true,
    _targetOrAdd: Container | boolean = true,
    _add = true,
    _register = true,
  ): KloekText {
    const styleOverwrite = isPlainObject(_styleOverwriteOrTargetOrAdd) ? (_styleOverwriteOrTargetOrAdd as Record<string, unknown>) : undefined,
      text = KloekText.create(_text, _style, styleOverwrite);

    if (_styleOverwriteOrTargetOrAdd && !styleOverwrite && typeof _styleOverwriteOrTargetOrAdd !== 'boolean') {
      text.setTarget(_styleOverwriteOrTargetOrAdd as Container);
    } else if (_targetOrAdd && typeof _targetOrAdd !== 'boolean') {
      text.setTarget(_targetOrAdd);
    } else {
      text.setTarget(this);
    }

    // ook toevoegen?
    if (_styleOverwriteOrTargetOrAdd !== false && _targetOrAdd !== false && _add !== false) {
      text.addToTarget();
    }

    if (_register) {
      this.kloektexts.push(text);
    }

    return text;
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
    for (const sprite of this.kloeksprites) sprite.prepareAfterLoad();
    for (const text of this.kloektexts) text.prepareAfterLoad();

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
    for (const sprite of this.kloeksprites) sprite.cleanupBeforeUnload();
    for (const text of this.kloektexts) text.cleanupBeforeUnload();

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
