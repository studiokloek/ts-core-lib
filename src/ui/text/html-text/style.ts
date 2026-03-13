
import { settings } from '@pixi/settings';

import { path, rgb2hex, hex2string } from '@pixi/utils';

import { TextStyle } from '@pixi/text';

import type {
    ITextStyle,
    TextStyleFontStyle,
    TextStyleFontWeight,
    TextStyleLineJoin,
    TextStyleTextBaseline
} from '@pixi/text';

/**
 * HTMLText ondersteunt meer white-space opties.
 * @memberof PIXI
 * @since 7.2.0
 * @see PIXI.IHTMLTextStyle
 */
export type HTMLTextStyleWhiteSpace = 'normal' | 'pre' | 'pre-line' | 'nowrap' | 'pre-wrap';

/**
 * FontFace weergaveopties.
 * @memberof PIXI
 * @since 7.3.0
 */
export type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';

// Subset of ITextStyle
type ITextStyleIgnore = 'whiteSpace'
    | 'fillGradientStops'
    | 'fillGradientType'
    | 'miterLimit'
    | 'textBaseline'
    | 'trim'
    | 'leading'
    | 'lineJoin';

/**
 * Aangepaste versies van ITextStyle.
 * @memberof PIXI
 * @extends PIXI.ITextStyle
 * @since 7.2.0
 */
export interface IHTMLTextStyle extends Omit<ITextStyle, ITextStyleIgnore> {
    /** White-space met uitgebreide opties. */
    whiteSpace: HTMLTextStyleWhiteSpace;
}

export interface IHTMLTextFontOptions extends Pick<IHTMLFont, 'weight' | 'style' | 'family'> {
    /** font-display eigenschap */
    display: FontDisplay;
}

/**
 * Fontinformatie voor HTMLText.
 * @memberof PIXI
 * @since 7.2.0
 */
export interface IHTMLFont {
    /** Door de gebruiker opgegeven URL-verzoek */
    originalUrl: string;
    /** Base64-string voor het lettertype */
    dataSrc: string;
    /** FontFace geïnstalleerd in het document */
    fontFace: FontFace | null;
    /** Blob-gebaseerde URL voor het lettertype */
    src: string;
    /** Familienaam van het lettertype */
    family: string;
    /** Gewicht van het lettertype */
    weight: TextStyleFontWeight;
    /** Stijl van het lettertype */
    style: TextStyleFontStyle;
    /** Weergave-eigenschap van het lettertype */
    display: FontDisplay;
    /** Referentieteller */
    refs: number;
}

/**
 * Intern gebruikt om tekststijlgebruik te beperken en eenvoudig te converteren naar CSS.
 * @class
 * @memberof PIXI
 * @param {PIXI.ITextStyle|PIXI.IHTMLTextStyle} [style] - Te kopiëren stijl.
 * @since 7.2.0
 */
export class HTMLTextStyle extends TextStyle {
    /** De verzameling van geïnstalleerde lettertypen */
    public static availableFonts: Record<string, IHTMLFont> = {};

    /**
     * Lijst met standaardopties, grotendeels gelijk aan TextStyle,
     * met uitzondering van whiteSpace, dat standaard op 'normal' staat.
     */
    public static readonly defaultOptions: IHTMLTextStyle = {
        /** Uitlijning */
        align: 'left',
        /** Woorden afbreken */
        breakWords: false,
        /** Slagschaduw */
        dropShadow: false,
        /** Slagschaduw-alfa */
        dropShadowAlpha: 1,
        /**
         * Slagschaduwhoek
         * @type {number}
         * @default Math.PI / 6
         */
        dropShadowAngle: Math.PI / 6,
        /** Slagschaduw-vervaging */
        dropShadowBlur: 0,
        /** Slagschaduwkleur */
        dropShadowColor: 'black',
        /** Slagschaduwafstand */
        dropShadowDistance: 5,
        /** Vulkleur */
        fill: 'black',
        /** Lettertype-familie */
        fontFamily: 'Arial',
        /** Lettergrootte */
        fontSize: 26,
        /** Lettertypestijl */
        fontStyle: 'normal',
        /** Lettertypevariant */
        fontVariant: 'normal',
        /** Lettertypegewicht */
        fontWeight: 'normal',
        /** Letterafstand */
        letterSpacing: 0,
        /** Regelafstand */
        lineHeight: 0,
        /** Opvulling */
        padding: 0,
        /** Omtreklijn */
        stroke: 'black',
        /** Omtreklijndikte */
        strokeThickness: 0,
        /** Witruimte */
        whiteSpace: 'normal',
        /** Woordafbreking */
        wordWrap: false,
        /** Breedte voor woordafbreking */
        wordWrapWidth: 100,
    };

    /** Voor het gebruik van aangepaste lettertypen */
    private _fonts: IHTMLFont[] = [];

    /** Lijst met interne stijlregels */
    private _overrides: string[] = [];

    /** Globale regels of stylesheet, handig voor het aanmaken van renderregels */
    private _stylesheet = '';

    /** Lettertypewijzigingen intern bijhouden */
    private fontsDirty = false;

    /**
     * Converteert een TextStyle naar HTMLTextStyle.
     * @param originalStyle
     * @example
     * import {TextStyle } from 'pixi.js';
     * import {HTMLTextStyle} from '@pixi/text-html';
     * const style = new TextStyle();
     * const htmlStyle = HTMLTextStyle.from(style);
     */
    static from(originalStyle: TextStyle | Partial<IHTMLTextStyle>): HTMLTextStyle {
        return new HTMLTextStyle(Object.keys(HTMLTextStyle.defaultOptions)
            .reduce((obj, prop) => ({ ...obj, [prop]: originalStyle[prop as keyof IHTMLTextStyle] }), {})
        );
    }

    /** Verwijdert de huidige lettertypen */
    public cleanFonts(): void {
        if (this._fonts.length > 0) {
            this._fonts.forEach((font) => {
                URL.revokeObjectURL(font.src);
                font.refs--;
                if (font.refs === 0) {
                    if (font.fontFace) {
                        document.fonts.delete(font.fontFace);
                    }
                    delete HTMLTextStyle.availableFonts[font.originalUrl];
                }
            });
            this.fontFamily = 'Arial';
            this._fonts.length = 0;
            this.styleID++;
            this.fontsDirty = true;
        }
    }

    /**
     * Vanwege de manier waarop HTMLText rendert, moeten lettertypen worden geïmporteerd.
     * @param url
     * @param options
     */
    public loadFont(url: string, options: Partial<IHTMLTextFontOptions> = {}): Promise<void> {
        const { availableFonts } = HTMLTextStyle;

        // Font is already installed
        if (availableFonts[url]) {
            const font = availableFonts[url];

            this._fonts.push(font);
            font.refs++;
            this.styleID++;
            this.fontsDirty = true;

            return Promise.resolve();
        }

        return settings.ADAPTER.fetch(url)
            .then((response) => response.blob())
            .then(async (blob) => new Promise<[string, string]>((resolve, reject) => {
                const src = URL.createObjectURL(blob);
                const reader = new FileReader();

                reader.onload = () => resolve([src, reader.result as string]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            }))
            .then(async ([src, dataSrc]) => {
                const font: IHTMLFont = Object.assign({
                    family: path.basename(url, path.extname(url)),
                    weight: 'normal',
                    style: 'normal',
                    display: 'auto',
                    src,
                    dataSrc,
                    refs: 1,
                    originalUrl: url,
                    fontFace: null,
                }, options);

                availableFonts[url] = font;
                this._fonts.push(font);
                this.styleID++;

                // Load it into the current DOM so we can properly measure it!
                const fontFace = new FontFace(font.family, `url(${font.src})`, {
                    weight: font.weight,
                    style: font.style,
                    display: font.display,
                });

                // Keep this reference so we can remove it later from document
                font.fontFace = fontFace;

                await fontFace.load();
                document.fonts.add(fontFace);
                await document.fonts.ready;

                this.styleID++;
                this.fontsDirty = true;
            });
    }

    /**
     * Voegt een stijloverschrijving toe; dit kan elke CSS-eigenschap zijn
     * en overschrijft alle ingebouwde stijlen. Dit is de eigenschap en de
     * waarde als een string (bijv. `color: red`).
     * Dit overschrijft elke andere interne stijl.
     * @param {string} value - CSS-stijl(en) om toe te voegen.
     * @example
     * style.addOverride('background-color: red');
     */
    public addOverride(...value: string[]): void {
        const toAdd = value.filter((v) => !this._overrides.includes(v));

        if (toAdd.length > 0) {
            this._overrides.push(...toAdd);
            this.styleID++;
        }
    }

    /**
     * Verwijdert alle overschrijvingen die overeenkomen met de waarde.
     * @param {string} value - CSS-stijl om te verwijderen.
     * @example
     * style.removeOverride('background-color: red');
     */
    public removeOverride(...value: string[]): void {
        const toRemove = value.filter((v) => this._overrides.includes(v));

        if (toRemove.length > 0) {
            this._overrides = this._overrides.filter((v) => !toRemove.includes(v));
            this.styleID++;
        }
    }

    /**
     * Converteert intern alle stijleigenschappen naar CSS-equivalenten.
     * @param scale
     * @returns De CSS-stijlstring, voor het instellen van de `style`-eigenschap van het root-HTMLElement.
     */
    public toCSS(scale: number): string {
        return [
            `transform: scale(${scale})`,
            `transform-origin: top left`,
            'display: inline-block',
            `color: ${this.normalizeColor(this.fill)}`,
            `font-size: ${(this.fontSize as number)}px`,
            `font-family: ${this.fontFamily}`,
            `font-weight: ${this.fontWeight}`,
            `font-style: ${this.fontStyle}`,
            `font-variant: ${this.fontVariant}`,
            `letter-spacing: ${this.letterSpacing}px`,
            `text-align: ${this.align}`,
            `padding: ${this.padding}px`,
            `white-space: ${this.whiteSpace}`,
            ...this.lineHeight ? [`line-height: ${this.lineHeight}px`] : [],
            ...this.wordWrap ? [
                `word-wrap: ${this.breakWords ? 'break-all' : 'break-word'}`,
                `max-width: ${this.wordWrapWidth}px`
            ] : [],
            ...this.strokeThickness ? [
                `-webkit-text-stroke-width: ${this.strokeThickness}px`,
                `-webkit-text-stroke-color: ${this.normalizeColor(this.stroke)}`,
                `text-stroke-width: ${this.strokeThickness}px`,
                `text-stroke-color: ${this.normalizeColor(this.stroke)}`,
                'paint-order: stroke',
            ] : [],
            ...this.dropShadow ? [this.dropShadowToCSS()] : [],
            ...this._overrides,
        ].join(';');
    }

    /** Geeft de CSS @font-face regels terug voor de geladen lettertypen, indien beschikbaar. */
    public toGlobalCSS(): string {
        return this._fonts.reduce((result, font) => (
            `${result}
            @font-face {
                font-family: "${font.family}";
                src: url('${font.dataSrc}');
                font-weight: ${font.weight};
                font-style: ${font.style};
                font-display: ${font.display};
            }`
        ), this._stylesheet);
    }

    /** Interne inhoud van het stylesheet, handig voor het aanmaken van renderregels */
    public get stylesheet(): string {
        return this._stylesheet;
    }
    public set stylesheet(value: string) {
        if (this._stylesheet !== value) {
            this._stylesheet = value;
            this.styleID++;
        }
    }

    /**
     * Converteert numerieke kleuren naar hex-strings.
     * @param color
     */
    private normalizeColor(color: any): string {
        if (Array.isArray(color)) {
            color = rgb2hex(color);
        }

        if (typeof color === 'number') {
            return hex2string(color);
        }

        return color;
    }

    /** Converteert de interne slagschaduw-instellingen naar CSS text-shadow */
    private dropShadowToCSS(): string {
        let color = this.normalizeColor(this.dropShadowColor);
        const alpha = this.dropShadowAlpha;
        const x = Math.round(Math.cos(this.dropShadowAngle) * this.dropShadowDistance);
        const y = Math.round(Math.sin(this.dropShadowAngle) * this.dropShadowDistance);

        // Append alpha to color
        if (color.startsWith('#') && alpha < 1) {
            color += (alpha * 255 | 0).toString(16).padStart(2, '0');
        }

        const position = `${x}px ${y}px`;

        if (this.dropShadowBlur > 0) {
            return `text-shadow: ${position} ${this.dropShadowBlur}px ${color}`;
        }

        return `text-shadow: ${position} ${color}`;
    }

    /** Stelt alle eigenschappen terug op de standaardwaarden gespecificeerd in TextStyle.prototype._default */
    public reset(): void {
        Object.assign(this, HTMLTextStyle.defaultOptions);
    }

    /**
     * Wordt aangeroepen nadat de afbeelding is geladen maar vóór het tekenen op het canvas.
     * Voornamelijk gebruikt om Safari's fontlaad-bug op te vangen.
     * @ignore
     */
    public onBeforeDraw() {
        const { fontsDirty: prevFontsDirty } = this;

        this.fontsDirty = false;

        // Safari has a known bug where embedded fonts are not available
        // immediately after the image loads, to compensate we wait an
        // arbitrary amount of time
        // @see https://bugs.webkit.org/show_bug.cgi?id=219770
        if (this.isSafari && this._fonts.length > 0 && prevFontsDirty) {
            return new Promise<void>((resolve) => setTimeout(resolve, 100));
        }

        return Promise.resolve();
    }

    /**
     * Bewijs dat Safari het nieuwe IE is
     * @ignore
     */
    private get isSafari(): boolean {
        const { userAgent } = settings.ADAPTER.getNavigator();

        return (/^((?!chrome|android).)*safari/i).test(userAgent);
    }

    override set fillGradientStops(_value: number[]) {
        console.warn('[HTMLTextStyle] fillGradientStops is not supported by HTMLText');
    }
    override get fillGradientStops() {
        return super.fillGradientStops;
    }

    override set fillGradientType(_value: number) {
        console.warn('[HTMLTextStyle] fillGradientType is not supported by HTMLText');
    }
    override get fillGradientType() {
        return super.fillGradientType;
    }

    override set miterLimit(_value: number) {
        console.warn('[HTMLTextStyle] miterLimit is not supported by HTMLText');
    }
    override get miterLimit() {
        return super.miterLimit;
    }

    override set trim(_value: boolean) {
        console.warn('[HTMLTextStyle] trim is not supported by HTMLText');
    }
    override get trim() {
        return super.trim;
    }

    override set textBaseline(_value: TextStyleTextBaseline) {
        console.warn('[HTMLTextStyle] textBaseline is not supported by HTMLText');
    }
    override get textBaseline() {
        return super.textBaseline;
    }

    override set leading(_value: number) {
        console.warn('[HTMLTextStyle] leading is not supported by HTMLText');
    }
    override get leading() {
        return super.leading;
    }

    override set lineJoin(_value: TextStyleLineJoin) {
        console.warn('[HTMLTextStyle] lineJoin is not supported by HTMLText');
    }
    override get lineJoin() {
        return super.lineJoin;
    }
}
