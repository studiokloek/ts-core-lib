
import { Container, ITextStyle, ObservablePoint, Text, TextStyle } from 'pixi.js';
import { PrepareCleanupInterface } from '../../patterns';
import { Stage } from '../../screen';
import { HTMLText, HTMLTextStyle } from './html-text';
import { getTextStyle, registerTextStyle } from './textstyles';
import { HTMLFontLoadInfo, loadFontsInHTMLText, registerFontsForHTMLText } from './html-text/fonts';

export type KloekHTMLText = HTMLText;

export class KloekText extends Container implements PrepareCleanupInterface {
  protected isPrepared = false;
  protected target: Container | undefined;
  private _value = '';
  private _ready: Promise<void>;
  public readonly element: Text | HTMLText;
  public readonly isHtml: boolean;

  constructor(
    _text: string | number | undefined,
    _style?: TextStyle | Partial<ITextStyle> | string,
    _styleOverwrite?: Partial<ITextStyle>,
    _isHtml = false,
  ) {
    super();

    this.isHtml = _isHtml;

    const style = getTextStyle(_style, _styleOverwrite)

    if (this.isHtml) {
      this.element = new HTMLText('', style);
      this._ready = loadFontsInHTMLText(this.element);
    } else {
      this.element = new Text('', style);
      this._ready = Promise.resolve();
    }

    this.addChild(this.element);

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

  updateStyle(_style?: TextStyle | Partial<ITextStyle> | string, _styleOverwrite?: Partial<ITextStyle>): void {
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
      this.target.addChild(this);
    }
  }

  removeFromTarget(): void {
    if (this.target && this.parent) {
      this.target.removeChild(this);
    }
  }

  // getters
  get width(): number {
    return this.element.width;
  }
  set width(value: number) {
    this.element.width = value;
  }

  get height(): number {
    return this.element.height;
  }
  set height(value: number) {
    this.element.height = value;
  }

  get anchor(): ObservablePoint {
    return this.element.anchor;
  }

  set tint(value: number) {
    this.element.tint = value;
  }
  get tint(): number {
    return this.element.tint;
  }

  get style(): TextStyle | HTMLTextStyle | Partial<ITextStyle> {
    return this.element.style;
  }
  set style(style: TextStyle | HTMLTextStyle | Partial<ITextStyle>) {
    this.element.style = style;
  }

  get textElement(): Text | KloekHTMLText {
    return this.element;
  }

  get ready(): Promise<void> {
    return this._ready;
  }

  // static methods
  static create(
    _text: string | number,
    _style?: TextStyle | Partial<ITextStyle> | string,
    _styleOverwrite?: Partial<ITextStyle>,
    _isHtml = false,
  ): KloekText {
    return new KloekText(_text, _style, _styleOverwrite, _isHtml);
  }

  static registerStyle(_name: string, _baseOrStyle: string | TextStyle | Partial<ITextStyle>, _style?: Partial<ITextStyle>): void {
    registerTextStyle(_name, _baseOrStyle, _style);
  }

  static getRegisteredStyle(_name: string): TextStyle | undefined {
    return getTextStyle(_name);
  }

  static registerFontsForHTMLText(_fonts: HTMLFontLoadInfo[]): void {
    registerFontsForHTMLText(_fonts);
  }
}
