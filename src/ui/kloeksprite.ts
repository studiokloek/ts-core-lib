/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Container, Sprite, Texture } from 'pixi.js';
import { Mixin } from 'ts-mixer';
import type { SpriteAsset, SpriteAssetWithMeta } from '../loaders';
import { isSpriteAsset, isSpriteAssetWithMeta } from '../loaders';
import { getLogger } from '../logger';
import { PrepareCleanupInterface } from '../patterns';
import { TweenMixin } from '../tween';

const Logger = getLogger('ui > kloeksprite');

export interface KloekSpriteDefaults {
  x?: number;
  y?: number;
  scale?: number | { x: number; y: number };
  alpha?: number;
  rotation?: number;
  anchor?: number | { x: number; y: number };
  tint?: number;
  visible?: boolean;
  zIndex?: number;
}

export class KloekSprite extends Mixin(Sprite, TweenMixin) implements PrepareCleanupInterface {
  protected _isFilled = false;
  protected isPrepared = false;
  protected textureId?: string;
  protected asset?: SpriteAsset | SpriteAssetWithMeta;
  protected target: Container | undefined;
  protected defaults?: KloekSpriteDefaults;
  protected currentDefaults?: KloekSpriteDefaults;
  protected previousDefaults: KloekSpriteDefaults = {};

  public constructor(_asset?: SpriteAsset, _defaults?: KloekSpriteDefaults) {
    super();

    this.setAsset(_asset);

    if (_defaults) {
      this.setDefaults(_defaults);
    }
  }

  public setAsset(_asset?: SpriteAsset | SpriteAssetWithMeta): void {
    this.asset = _asset;

    if (this.asset) {
      this.textureId = typeof this.asset === 'string' ? this.asset : this.asset.id;
    }

    if (this._isFilled) {
      this.fillTexture();
    }

    this.setDefaults(this.defaults, true);
  }

  public getAsset(): SpriteAsset | SpriteAssetWithMeta | undefined {
    return this.asset;
  }

  public prepareAfterLoad(): void {
    if (this.isPrepared) {
      return;
    }
    this.isPrepared = true;

    this.fillTexture();
    this.applyDefaults();
  }

  public cleanupBeforeUnload(): void {
    if (!this.isPrepared) {
      return;
    }
    this.isPrepared = false;

    this.killTweens();
    this.emptyTexture();
  }

  protected fillTexture(): void {
    this._isFilled = true;

    // geen id? dan lege texture
    if (!this.textureId) {
      this.texture = Texture.EMPTY;
      return;
    }

    let texture;
    try {
      texture = Texture.from(this.textureId);
    } catch {
      Logger.error(`Texture not found with id ${this.textureId}`);
    }

    this.texture = texture ?? Texture.EMPTY;
  }

  protected emptyTexture(): void {
    this._isFilled = false;
    this.texture = Texture.EMPTY;
  }

  public destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }): void {
    this.cleanupBeforeUnload();
    this.removeFromTarget();
    this.target = undefined;
    super.destroy(options);
  }

  public setDefaults(defaults?: KloekSpriteDefaults, apply = false): void {
    this.defaults = defaults;

    // is en het een asset met meta?
    const asset = this.asset as SpriteAssetWithMeta;
    if (isSpriteAssetWithMeta(asset)) {
      // defaults meegegeven? dan deze gebruiken
      if (defaults !== undefined) {
        // check if anchor is set
        let anchor = { x: 0, y: 0 };
        if (defaults.anchor !== undefined) {
          anchor = typeof defaults.anchor === 'number' ? { x: defaults.anchor, y: defaults.anchor } : defaults.anchor;
        }
        // scale
        let scale = { x: 1, y: 1 };
        if (defaults.scale !== undefined) {
          scale = typeof defaults.scale === 'number' ? { x: defaults.scale, y: defaults.scale } : defaults.scale;
        }

        defaults = {
          ...defaults,
          anchor,
          x: defaults.x ?? (asset.x + asset.width * anchor.x) * scale.x,
          y: defaults.y ?? (asset.y + asset.height * anchor.y) * scale.y,
          zIndex: defaults.zIndex ?? asset.zIndex,
          alpha: defaults.alpha,
        };
      } else {
        // niet dan alleen de standaard meta
        defaults = {
          x: asset.x,
          y: asset.y,
          zIndex: asset.zIndex,
        };
      }
    }

    this.currentDefaults = defaults;

    if (apply) {
      this.applyDefaults();
    }
  }

  protected savePropertiesBeforeDefaults(): void {
    if (!this.currentDefaults) {
      return;
    }

    if (this.currentDefaults.x !== undefined) {
      this.previousDefaults.x = this.x;
    }

    if (this.currentDefaults.y !== undefined) {
      this.previousDefaults.y = this.y;
    }

    if (this.currentDefaults.anchor !== undefined) {
      this.previousDefaults.anchor = { x: this.anchor.x, y: this.anchor.y };
    }

    if (this.currentDefaults.scale !== undefined) {
      this.previousDefaults.scale = { x: this.scale.x, y: this.scale.y };
    }

    if (this.currentDefaults.rotation !== undefined) {
      this.previousDefaults.rotation = this.rotation;
    }

    if (this.currentDefaults.tint !== undefined) {
      this.previousDefaults.tint = this.tint;
    }

    if (this.currentDefaults.alpha !== undefined) {
      this.previousDefaults.alpha = this.alpha;
    }

    if (this.currentDefaults.visible !== undefined) {
      this.previousDefaults.visible = this.visible;
    }

    if (this.currentDefaults.zIndex !== undefined) {
      this.previousDefaults.zIndex = this.zIndex;
    }
  }

  public applyDefaults(): void {
    if (!this.currentDefaults) {
      return;
    }

    if (this.currentDefaults.x !== undefined) {
      this.x = this.currentDefaults.x;
    } else if (this.previousDefaults.x !== undefined) {
      this.x = this.previousDefaults.x;
    }

    if (this.currentDefaults.y !== undefined) {
      this.y = this.currentDefaults.y;
    } else if (this.previousDefaults.y !== undefined) {
      this.y = this.previousDefaults.y;
    }

    if (this.currentDefaults.anchor !== undefined) {
      if (typeof this.currentDefaults.anchor === 'number') {
        this.anchor.set(this.currentDefaults.anchor);
      } else {
        this.anchor.set(this.currentDefaults.anchor.x, this.currentDefaults.anchor.y);
      }
    } else if (this.previousDefaults.anchor !== undefined) {
      if (typeof this.previousDefaults.anchor === 'number') {
        this.anchor.set(this.previousDefaults.anchor);
      } else {
        this.anchor.set(this.previousDefaults.anchor.x, this.previousDefaults.anchor.y);
      }
    }

    if (this.currentDefaults.scale !== undefined) {
      if (typeof this.currentDefaults.scale === 'number') {
        this.scale.set(this.currentDefaults.scale);
      } else {
        this.scale.set(this.currentDefaults.scale.x, this.currentDefaults.scale.y);
      }
    } else if (this.previousDefaults.scale !== undefined) {
      if (typeof this.previousDefaults.scale === 'number') {
        this.scale.set(this.previousDefaults.scale);
      } else {
        this.scale.set(this.previousDefaults.scale.x, this.previousDefaults.scale.y);
      }
    }

    if (this.currentDefaults.rotation !== undefined) {
      this.rotation = this.currentDefaults.rotation * (Math.PI / 180);
    } else if (this.previousDefaults.rotation !== undefined) {
      this.rotation = this.previousDefaults.rotation;
    }

    if (this.currentDefaults.alpha !== undefined) {
      this.alpha = this.currentDefaults.alpha;
    } else if (this.previousDefaults.alpha !== undefined) {
      this.alpha = this.previousDefaults.alpha;
    }

    if (this.currentDefaults.visible !== undefined) {
      this.visible = this.currentDefaults.visible;
    } else if (this.previousDefaults.visible !== undefined) {
      this.visible = this.previousDefaults.visible;
    }

    if (this.currentDefaults.zIndex !== undefined) {
      this.zIndex = this.currentDefaults.zIndex;
    } else if (this.previousDefaults.zIndex !== undefined) {
      this.zIndex = this.previousDefaults.zIndex;
    }

    if (this.currentDefaults.tint !== undefined) {
      this.tint = this.currentDefaults.tint;
    } else if (this.previousDefaults.tint !== undefined) {
      this.tint = this.previousDefaults.tint;
    }
  }

  // STATICS

  public static create(_asset: SpriteAsset | SpriteAssetWithMeta, defaultsOrAutoPrepare?: KloekSpriteDefaults | boolean, autoPrepare = false): KloekSprite {
    // defaults meegegeven?
    let defaults: KloekSpriteDefaults | undefined;

    if (typeof defaultsOrAutoPrepare === 'boolean') {
      autoPrepare = defaultsOrAutoPrepare;
    } else {
      defaults = defaultsOrAutoPrepare as KloekSpriteDefaults;
    }

    const sprite = new KloekSprite();

    if (!isSpriteAsset(_asset)) {
      Logger.warn('No valid sprite asset provided...');
    } else {
      sprite.setAsset(_asset);
    }

    if (defaults) {
      sprite.setDefaults(defaults, true);
    }

    if (autoPrepare) {
      sprite.prepareAfterLoad();
    }

    return sprite;
  }

  // GET & SET
  // @ts-ignore
  public get width(): number {
    if (this.texture && this.texture !== Texture.EMPTY) {
      return super.width;
    } else if (this.asset) {
      return this.asset.width * this.scale.x;
    } else {
      return 0;
    }
  }

  public set width(value: number) {
    super.width = value;
  }

  // @ts-ignore
  public get height(): number {
    if (this.texture && this.texture !== Texture.EMPTY) {
      return super.height;
    } else if (this.asset) {
      return this.asset.height * this.scale.y;
    } else {
      return 0;
    }
  }

  public set height(value: number) {
    super.height = value;
  }

  public get isFilled(): boolean {
    return this._isFilled;
  }

  public set size(value: number) {
    let maxSide = 0;
    if (this.texture && this.texture !== Texture.EMPTY) {
      maxSide = Math.max(this.texture.width, this.texture.height);
    } else if (this.asset) {
      maxSide = Math.max(this.asset.width, this.asset.height);
    }

    const scale = value / maxSide;
    this.scale.set(scale);
  }

  // target
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
}
