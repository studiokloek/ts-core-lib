import { HTMLText } from '@pixi/text-html';
import { Container, Text, TextStyle } from 'pixi.js';
import { PrepareCleanupInterface } from '../../patterns';
import { Stage } from '../../screen';
import { getTextStyle, registerTextStyle } from './textstyles';

export class KloekText implements PrepareCleanupInterface {
  protected isPrepared = false;
  protected target: Container | undefined;
  private _value = '';
  public readonly element: Text | HTMLText;
  public readonly isHtml: boolean;

  constructor(
    _text: string | number | undefined,
    _style?: TextStyle | Record<string, unknown> | string,
    _styleOverwrite?: Record<string, unknown>,
    _isHtml = false,
  ) {
    this.isHtml = _isHtml;

    const style = getTextStyle(_style, _styleOverwrite);
    this.element = _isHtml ? new HTMLText('', style) : new Text('', style);

    this.text = _text;
  }

  get text(): string {
    return this._value;
  }

  set text(text: string | number | undefined) {
    this._value = `${text ?? ''}`;
    this.updateTextField();
  }

  private updateTextField(): void {
    if (!this.isPrepared) {
      return;
    }

    this.determineResolution();
    this.element.text = this.text;
  }

  updateStyle(_style?: TextStyle | Record<string, unknown> | string, _styleOverwrite?: Record<string, unknown>): void {
    const style = getTextStyle(_style, _styleOverwrite);
    this.element.style = style ?? new TextStyle();
  }

  prepareAfterLoad(): void {
    if (this.isPrepared) {
      return;
    }
    this.isPrepared = true;
    this.updateTextField();
  }

  cleanupBeforeUnload(): void {
    if (!this.isPrepared) {
      return;
    }
    this.isPrepared = false;

    this.element.resolution = 1;
    this.element.text = '';
  }

  private determineResolution(): void {
    this.element.resolution = Stage.textureResolution;
  }

  // target
  setTarget(_target: Container | undefined): void {
    this.target = _target;
  }

  addToTarget(): void {
    if (this.target) {
      this.target.addChild(this.element);
    }
  }

  removeFromTarget(): void {
    if (this.target && this.element.parent) {
      this.target.removeChild(this.element);
    }
  }

  static create(
    _text: string | number,
    _style?: TextStyle | Record<string, unknown> | string,
    _styleOverwrite?: Record<string, unknown>,
    _isHtml = false,
  ): KloekText {
    return new KloekText(_text, _style, _styleOverwrite, _isHtml);
  }

  static registerStyle(_name: string, _baseOrStyle: string | TextStyle | Record<string, unknown>, _style?: Record<string, unknown>): void {
    registerTextStyle(_name, _baseOrStyle, _style);
  }

  static getRegisteredStyle(_name: string): TextStyle | undefined {
    return getTextStyle(_name);
  }
}
