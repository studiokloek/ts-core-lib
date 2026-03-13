import { TextStyleFontStyle, TextStyleFontWeight } from "pixi.js";
import { HTMLText } from "./text";

/**
 * Beschrijft een lettertypeasset die geladen en geregistreerd moet worden voor gebruik in `HTMLText` elementen.
 * Geef de URL van het lettertypebestand op samen met de CSS font family naam, het gewicht en de stijl.
 */
export interface HTMLFontLoadInfo {
    url: string;
    family: string;
    weight: TextStyleFontWeight;
    style: TextStyleFontStyle;
}


const FontsList: HTMLFontLoadInfo[] = [];

/**
 * Registreert een of meer lettertypen globaal zodat ze automatisch worden geladen in elke `HTMLText`-instantie.
 * Roep dit aan voordat er `KloekText`-elementen met HTML-modus worden aangemaakt.
 */
export function registerFontsForHTMLText(_fonts: HTMLFontLoadInfo[]): void {
    FontsList.push(..._fonts);
}

/**
 * Laadt alle globaal geregistreerde lettertypen in de stijl van de opgegeven `HTMLText`-instantie.
 * Wordt intern aangeroepen door `KloekText` bij het aanmaken van een HTML-tekstelement.
 */
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