import { get, isPlainObject } from 'lodash';
import { Container } from 'pixi.js';
import { Mixin } from 'ts-mixer';
import { DelayedMixin } from '../delay';
import { SpriteAsset, SpriteAssetWithMeta } from '../loaders';
import { getLogger } from '../logger';
import { TickerMixin } from '../ticker';
import { TweenMixin } from '../tween';
import { KloekSprite, KloekSpriteDefaults, KloekText } from '../ui';
import { Type } from '../util';
import type { PrepareCleanupInterface } from './preparecleanup';
import { isPrepareCleanup } from './preparecleanup';

const Logger = getLogger('mediator > view');

export interface ViewOptions {
  target?: Container;
}

export interface OtherViewOptions extends ViewOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface AddTextOptions {
  styleOverwrite?: Record<string, unknown>;
  add?: boolean;
  register?: boolean;
  isHtml?: boolean;
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

  constructor(_options?: ViewOptions | OtherViewOptions) {
    super();
    this.options = { ..._options };
  }

  addView<T extends View>(_viewClass: Type<T>, _options?: ViewOptions | OtherViewOptions, _add = true, _register = true): T {
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

  addSprite(
    _asset?: SpriteAsset | SpriteAssetWithMeta,
    _defaults?: KloekSpriteDefaults,
    _targetOrAdd: Container | boolean = true,
    _add = true,
    _register = true,
  ): KloekSprite {
    const sprite = _asset ? KloekSprite.create(_asset, _defaults) : new KloekSprite(undefined, _defaults);

    let addToTarget = false;

    if (_targetOrAdd === true) {
      // true? dan toevoegen aan deze view
      sprite.setTarget(this);
      addToTarget = true;
    } else if (_targetOrAdd) {
      // andere target
      sprite.setTarget(_targetOrAdd);

      addToTarget = _add === true;
    }

    if (_register) {
      this.kloeksprites.push(sprite);
    }

    if (addToTarget) {
      // ook toevoegen?
      sprite.addToTarget();

      // als we al klaar zijn, gelijk laten zien
      if (this.isPrepared) {
        sprite.prepareAfterLoad();
      }
    }

    return sprite;
  }

  addText(_text: string | number, _style: string, _targetOrOptions?: Container | AddTextOptions, _options?: AddTextOptions): KloekText {
    // bepaal de opties
    const target = isPlainObject(_targetOrOptions) ? undefined : (_targetOrOptions as Container),
      options = isPlainObject(_targetOrOptions) ? (_targetOrOptions as AddTextOptions) : _options,
      _styleOverwrite = get(options, 'styleOverwrite'),
      _add = get(options, 'add', true),
      _register = get(options, 'register', true),
      _isHtml = get(options, 'isHtml', false);

    const text = KloekText.create(_text, _style, _styleOverwrite, _isHtml);

    if (target) {
      text.setTarget(target);
    } else {
      text.setTarget(this);
    }

    // ook toevoegen?
    if (_add) {
      text.addToTarget();

      // als we al klaar zijn, gelijk laten zien
      if (this.isPrepared) {
        text.prepareAfterLoad();
      }
    }

    if (_register) {
      this.kloektexts.push(text);
    }

    return text;
  }

  // TARGET

  setTarget(_target: Container | undefined): void {
    this.target = _target;
  }

  addToTarget(): void {
    if (this.target) {
      this.target.addChild(this);
    }
  }

  removeFromTarget(): void {
    if (this.target && this.parent) {
      this.target.removeChild(this);
    }
  }

  // INIT
  init(): void {
    Logger.error('init() should be overwritten.');
  }

  // PREPARE / CLEANUP
  prepareAfterLoad(): void {
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

  cleanupBeforeUnload(): void {
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
  activate(): void {
    if (this.isActive) {
      return;
    }
    this.isActive = true;

    this.resumeDelays();
    this.resumeTweens();
    this.resumeTickers();

    for (const view of this.views) view.activate();
  }

  deactivate(): void {
    if (!this.isActive) {
      return;
    }
    this.isActive = false;

    this.pauseDelays();
    this.pauseTweens();
    this.pauseTickers();

    for (const view of this.views) view.deactivate();
  }

  get isView(): boolean {
    return true;
  }
}
