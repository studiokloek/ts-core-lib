import { TextStyleFontStyle, TextStyleFontWeight } from "pixi.js";
import { HTMLText } from "./text";

export interface HTMLFontLoadInfo {
    url: string;
    family: string;
    weight: TextStyleFontWeight;
    style: TextStyleFontStyle;
}


const FontsList: HTMLFontLoadInfo[] = [];

export function registerFontsForHTMLText(_fonts: HTMLFontLoadInfo[]): void {
    FontsList.push(..._fonts);
}

export async function loadFontsInHTMLText(_field: HTMLText): Promise<void> {
    await Promise.all(
        FontsList.map(async (font) => {
            await _field.style.loadFont(font.url, {
                family: font.family,
                weight: font.weight,
                style: font.style,
            });
        })
    );
}