import type { ImageResource, Renderer } from '@pixi/core';
import { Texture } from '@pixi/core';
import type { IDestroyOptions } from '@pixi/display';
import { settings } from '@pixi/settings';
import { Sprite } from '@pixi/sprite';
import type { ITextStyle } from '@pixi/text';
import { TextStyle } from '@pixi/text';
import { sign } from '@pixi/utils';
import { ISize, Rectangle } from 'pixi.js';
import { HTMLTextStyle } from './style';

/**
 * Alternatief voor {@link PIXI.Text|Text} met ondersteuning voor multi-stijl HTML-tekst. Er zijn
 * enkele belangrijke verschillen met {@link PIXI.Text|Text}:
 * <br>&bull; HTMLText ondersteunt geen {@link https://caniuse.com/mdn-svg_elements_foreignobject|Internet Explorer}.
 * <br>&bull; Rendering is asynchroon. Bij statisch renderen, luister naar het `update`-event op BaseTexture.
 * <br>&bull; Ondersteunt niet alle stijlopties (bijv. `lineJoin`, `leading`, `textBaseline`, `trim`, `miterLimit`,
 *   `fillGradientStops`, `fillGradientType`)
 * @example
 * import { HTMLText } from 'pixi.js';
 *
 * const text = new HTMLText("Hello <b>World</b>", { fontSize: 20 });
 *
 * text.texture.baseTexture.on('update', () => {
 *   console.log('Text is redrawn!');
 * });
 * @class
 * @memberof PIXI
 * @extends PIXI.Sprite
 * @since 7.2.0
 */
export class HTMLText extends Sprite {
    /**
     * Standaard opties bij het vernietigen.
     * @type {PIXI.IDestroyOptions}
     * @property {boolean} [texture=true] - Of de textuur vernietigd moet worden.
     * @property {boolean} [children=false] - Of de kinderen vernietigd moeten worden.
     * @property {boolean} [baseTexture=true] - Of de basistextuur vernietigd moet worden.
     */
    public static defaultDestroyOptions: IDestroyOptions = {
        texture: true,
        children: false,
        baseTexture: true,
    };

    /** Standaard maximumbreedte, ingesteld bij het aanmaken */
    public static defaultMaxWidth = 2024;

    /** Standaard maximumhoogte, ingesteld bij het aanmaken */
    public static defaultMaxHeight = 2024;

    /** Standaard resolutie; zorg ervoor dat autoResolution of defaultAutoResolution op `false` staat. */
    public static defaultResolution: number | undefined;

    /** Standaard autoResolutie voor alle HTMLText-objecten */
    public static defaultAutoResolution = true;

    /** De maximale breedte in gerenderde pixels van de inhoud; grotere waarden worden afgekapt */
    public maxWidth: number;

    /** De maximale hoogte in gerenderde pixels van de inhoud; grotere waarden worden afgekapt */
    public maxHeight: number;

    private _domElement: HTMLElement;
    private _styleElement: HTMLElement;
    private _svgRoot: SVGSVGElement;
    private _foreignObject: SVGForeignObjectElement;
    private _image: HTMLImageElement;
    private _loadImage: HTMLImageElement;
    private _resolution: number;
    private _text: string | null = null;
    private _style: HTMLTextStyle | null = null;
    private _autoResolution = true;
    private localStyleID = -1;
    private dirty = false;
    private _updateID = 0;

    /** Het HTMLTextStyle-object is eigendom van deze instantie */
    private ownsStyle = false;

    /**
     * @param {string} [text] - Tekstinhoud
     * @param {PIXI.HTMLTextStyle|PIXI.TextStyle|PIXI.ITextStyle} [style] - Te gebruiken stijlinstelling.
     *        Sterk aanbevolen om een HTMLTextStyle-object te gebruiken. Het doorgeven van een PIXI.TextStyle
     *        converteert de TextStyle naar een HTMLTextStyle en is daarna niet meer gekoppeld.
     */
    constructor(text = '', style: HTMLTextStyle | TextStyle | Partial<ITextStyle> = {}) {
        super(Texture.EMPTY);

        const image = new Image();
        const texture = Texture.from<ImageResource>(image, {
            scaleMode: settings.SCALE_MODE,
            resourceOptions: {
                autoLoad: false,
            },
        });

        texture.orig = new Rectangle();
        texture.trim = new Rectangle();

        this.texture = texture;

        const nssvg = 'http://www.w3.org/2000/svg';
        const nsxhtml = 'http://www.w3.org/1999/xhtml';
        const svgRoot = document.createElementNS(nssvg, 'svg');
        const foreignObject = document.createElementNS(nssvg, 'foreignObject');
        const domElement = document.createElementNS(nsxhtml, 'div');
        const styleElement = document.createElementNS(nsxhtml, 'style');

        // Arbitrary max size
        foreignObject.setAttribute('width', '10000');
        foreignObject.setAttribute('height', '10000');
        foreignObject.style.overflow = 'hidden';
        svgRoot.appendChild(foreignObject);

        this.maxWidth = HTMLText.defaultMaxWidth;
        this.maxHeight = HTMLText.defaultMaxHeight;
        this._domElement = domElement;
        this._styleElement = styleElement;
        this._svgRoot = svgRoot;
        this._foreignObject = foreignObject;
        this._foreignObject.appendChild(styleElement);
        this._foreignObject.appendChild(domElement);
        this._image = image;
        this._loadImage = new Image();
        this._autoResolution = HTMLText.defaultAutoResolution;
        this._resolution = HTMLText.defaultResolution ?? settings.RESOLUTION;
        this.text = text;
        this.style = style;
    }

    /**
     * Berekent de grootte van de uitvoertekst zonder deze daadwerkelijk te tekenen.
     * Dit omvat de `padding` uit het `style`-object.
     * Kan worden gebruikt als snelle controle voor zaken zoals tekst-fitting.
     * @param {object} [overrides] - Overschrijvingen voor de tekst, stijl en resolutie.
     * @param {string} [overrides.text] - De te meten tekst; indien niet opgegeven, wordt de huidige tekst gebruikt.
     * @param {PIXI.HTMLTextStyle} [overrides.style] - De te meten stijl; indien niet opgegeven, wordt de huidige stijl gebruikt.
     * @param {number} [overrides.resolution] - De te gebruiken resolutie; indien niet opgegeven, wordt de huidige resolutie gebruikt.
     * @returns {PIXI.ISize} Breedte en hoogte van de gemeten tekst.
     */
    measureText(overrides?: { text?: string, style?: HTMLTextStyle, resolution?: number }): ISize {
        const { text, style, resolution } = Object.assign({
            text: this._text,
            style: this._style,
            resolution: this._resolution,
        }, overrides);

        Object.assign(this._domElement, {
            innerHTML: text,
            style: style.toCSS(resolution),
        });
        this._styleElement.textContent = style.toGlobalCSS();

        // Measure the contents using the shadow DOM
        document.body.appendChild(this._svgRoot);
        const contentBounds = this._domElement.getBoundingClientRect();

        this._svgRoot.remove();

        const { width, height } = contentBounds;


        const contentWidth = Math.min(this.maxWidth, Math.ceil(width));
        const contentHeight = Math.min(this.maxHeight, Math.ceil(height));

        this._svgRoot.setAttribute('width', contentWidth.toString());
        this._svgRoot.setAttribute('height', contentHeight.toString());

        // Undo the changes to the DOM element
        if (text !== this._text) {
            this._domElement.innerHTML = this._text as string;
        }
        if (style !== this._style) {
            Object.assign(this._domElement, { style: this._style?.toCSS(resolution) });
            this._styleElement.textContent = this._style?.toGlobalCSS() as string;
        }

        return {
            width: contentWidth + (style.padding * 2),
            height: contentHeight + (style.padding * 2),
        };
    }

    /**
     * Vernieuwt de tekst handmatig.
     * @public
     * @param {boolean} respectDirty - Of het bijwerken van de tekst
     *        moet worden afgebroken als de tekst niet gewijzigd is.
     */
    async updateText(respectDirty = true): Promise<void> {
        const { style, _image: image, _loadImage: loadImage } = this;

        // check if style has changed..
        if (this.localStyleID !== style.styleID) {
            this.dirty = true;
            this.localStyleID = style.styleID;
        }

        if (!this.dirty && respectDirty) {
            return;
        }

        const { width, height } = this.measureText();

        // Make sure canvas is at least 1x1 so it drawable
        // for sub-pixel sizes, round up to avoid clipping
        // we update both images, to make sure bounds are correct synchronously
        image.width = loadImage.width = Math.ceil((Math.max(1, width)));
        image.height = loadImage.height = Math.ceil((Math.max(1, height)));

        this._updateID++;

        const updateID = this._updateID;

        await new Promise<void>((resolve) => {
            loadImage.onload = async () => {
                if (updateID < this._updateID) {
                    resolve();

                    return;
                }

                // Fake waiting for the image to load
                await style.onBeforeDraw();

                // Swap image and loadImage, we do this to avoid
                // flashes between updateText calls, usually when
                // the onload time is longer than updateText time
                image.src = loadImage.src;
                loadImage.onload = null;
                loadImage.src = '';

                // Force update the texture
                this.updateTexture();
                resolve();
            };
            const svgURL = new XMLSerializer().serializeToString(this._svgRoot);

            loadImage.src = `data:image/svg+xml;charset=utf8,${encodeURIComponent(svgURL)}`;
        });
    }

    /** Het onbewerkte afbeeldingselement dat intern wordt gerenderd. */
    public get source(): HTMLImageElement {
        return this._image;
    }

    /**
     * Werkt de textuurresource bij.
     * @private
     */
    updateTexture() {
        const { style, texture, _image: image, resolution } = this;
        const { padding } = style;
        const { baseTexture } = texture;

        texture.trim.width = texture._frame.width = image.width / resolution;
        texture.trim.height = texture._frame.height = image.height / resolution;
        texture.trim.x = -padding;
        texture.trim.y = -padding;

        texture.orig.width = texture._frame.width - (padding * 2);
        texture.orig.height = texture._frame.height - (padding * 2);

        // call sprite onTextureUpdate to update scale if _width or _height were set
        this._onTextureUpdate();

        baseTexture.setRealSize(image.width, image.height, resolution);

        this.dirty = false;
    }

    /**
     * Rendert het object met de WebGL-renderer.
     * @param {PIXI.Renderer} renderer - De renderer
     * @private
     */
    _render(renderer: Renderer) {
        if (this._autoResolution && this._resolution !== renderer.resolution) {
            this._resolution = renderer.resolution;
            this.dirty = true;
        }

        this.updateText(true);

        super._render(renderer);
    }

    /**
     * Rendert het object met de Canvas-renderer.
     * @private
     * @param {PIXI.CanvasRenderer} renderer - De renderer
     */
    _renderCanvas(renderer: Renderer) {
        if (this._autoResolution && this._resolution !== renderer.resolution) {
            this._resolution = renderer.resolution;
            this.dirty = true;
        }

        this.updateText(true);

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        super._renderCanvas(renderer);
    }

    /**
     * Geeft de lokale grenzen terug.
     * @param {PIXI.Rectangle} rect - Invoerrechthoek.
     * @returns {PIXI.Rectangle} Lokale grenzen
     */
    getLocalBounds(rect: Rectangle) {
        this.updateText(true);

        return super.getLocalBounds(rect);
    }

    _calculateBounds() {
        this.updateText(true);
        this.calculateVertices();
        // if we have already done this on THIS frame.
        (this as any)._bounds.addQuad(this.vertexData);
    }

    /**
     * Verwerkt gewijzigde stijlwijzigingen
     * @private
     */
    _onStyleChange() {
        this.dirty = true;
    }

    /**
     * Vernietigt dit Text-object. Gebruik het niet meer na aanroepen.
     * @param {boolean|object} options - Zelfde als Sprite-vernietigopties.
     */
    destroy(options?: boolean | IDestroyOptions | undefined) {
        if (typeof options === 'boolean') {
            options = { children: options };
        }

        options = Object.assign({}, HTMLText.defaultDestroyOptions, options);

        super.destroy(options);

        const forceClear: any = null;

        // Remove any loaded fonts if we created the HTMLTextStyle
        if (this.ownsStyle) {
            this._style?.cleanFonts();
        }
        this._style = forceClear;
        this._svgRoot?.remove();
        this._svgRoot = forceClear;
        this._domElement?.remove();
        this._domElement = forceClear;
        this._foreignObject?.remove();
        this._foreignObject = forceClear;
        this._styleElement?.remove();
        this._styleElement = forceClear;

        this._loadImage.src = '';
        this._loadImage.onload = null;
        this._loadImage = forceClear;
        this._image.src = '';
        this._image = forceClear;
    }

    /**
     * Geeft de breedte in pixels terug.
     * @member {number}
     */
    get width() {
        this.updateText(true);

        return Math.abs(this.scale.x) * this._image.width / this.resolution;
    }

    set width(value) // eslint-disable-line require-jsdoc
    {
        this.updateText(true);

        const s = sign(this.scale.x) || 1;

        this.scale.x = s * value / this._image.width / this.resolution;
        this._width = value;
    }

    /**
     * Geeft de hoogte in pixels terug.
     * @member {number}
     */
    get height() {
        this.updateText(true);

        return Math.abs(this.scale.y) * this._image.height / this.resolution;
    }

    set height(value) // eslint-disable-line require-jsdoc
    {
        this.updateText(true);

        const s = sign(this.scale.y) || 1;

        this.scale.y = s * value / this._image.height / this.resolution;
        this._height = value;
    }

    /** De basisstijl voor het renderen van de tekst. */
    get style(): HTMLTextStyle {
        return this._style as HTMLTextStyle;
    }

    set style(style: HTMLTextStyle | TextStyle | Partial<ITextStyle>) // eslint-disable-line require-jsdoc
    {
        // Don't do anything if we're re-assigning
        if (this._style === style) {
            return;
        }

        style = style || {};

        if (style instanceof HTMLTextStyle) {
            this.ownsStyle = false;
            this._style = style;
        }
        // Clone TextStyle
        else if (style instanceof TextStyle) {
            console.warn('[HTMLText] Cloning TextStyle, if this is not what you want, use HTMLTextStyle');

            this.ownsStyle = true;
            this._style = HTMLTextStyle.from(style);
        }
        else {
            this.ownsStyle = true;
            this._style = new HTMLTextStyle(style);
        }

        this.localStyleID = -1;
        this.dirty = true;
    }

    /**
     * Inhoud van de tekst. Dit kan HTML-tekst zijn inclusief tags.
     * @example
     * const text = new HTMLText('This is a <em>styled</em> text!');
     * @member {string}
     */
    get text() {
        return this._text;
    }

    set text(text) // eslint-disable-line require-jsdoc
    {
        text = String(text === '' || text === null || text === undefined ? ' ' : text);
        text = this.sanitiseText(text);

        if (this._text === text) {
            return;
        }
        this._text = text;
        this.dirty = true;
    }

    /**
     * De resolutie / apparaatpixelverhouding van het canvas.
     * Standaard ingesteld om automatisch overeen te komen met de rendererresolutie, maar kan handmatig worden overschreven.
     * @member {number}
     * @default 1
     */
    get resolution(): number {
        return this._resolution;
    }

    set resolution(value: number) // eslint-disable-line require-jsdoc
    {
        this._autoResolution = false;

        if (this._resolution === value) {
            return;
        }

        this._resolution = value;
        this.dirty = true;
    }

    /**
     * Zuivert tekst — vervangt `<br>` door `<br/>`, `&nbsp;` door `&#160;`.
     * @param text
     * @see https://www.sitepoint.com/community/t/xhtml-1-0-transitional-xml-parsing-error-entity-nbsp-not-defined/3392/3
     */
    private sanitiseText(text: string): string {
        return text
            .replace(/<br>/gi, '<br/>')
            .replace(/<hr>/gi, '<hr/>')
            .replace(/&nbsp;/gi, '&#160;');
    }
}
