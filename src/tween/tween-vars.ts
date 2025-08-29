import { ceil, get, isNumber, set } from "lodash";
import type { DisplayObject } from "pixi.js";
import { Logger } from "../logger";
import { BeamEase } from "./ease";
import type { ReducedTweenVars } from "./types";
import { cleanVarsForNoTween, removeNaN } from "./utils";

let reducedMotionIsEnabled = false;

export function setReducedMotion(value: boolean) {
    reducedMotionIsEnabled = value === true;
}

function getPixiVars(_target: GSAPTweenTarget, _properties: GSAPTweenVars, _settings?: GSAPTweenVars): GSAPTweenVars {
    let variables: GSAPTweenVars;

    if (_settings) {
        // is the target a PixiJS object?
        if ((_target as DisplayObject).worldTransform !== undefined) {
            // warn if props contain wrong values
            if (get(_properties, 'delay') || get(_properties, 'ease') || get(_properties, 'onComplete')) {
                Logger.warn('Can not mix tween settings (delay/ease/onComplete/etc) into PIXI properties.');
            }

            // fix rotation
            const rotation = get(_properties, 'rotation');
            if (typeof rotation === 'number') {
                set(_properties, 'rotation', rotation * (180 / Math.PI));
            }

            variables = { pixi: _properties as GSAPTweenVars['pixi'], ..._settings };
        } else {
            variables = { ..._properties, ..._settings };
        }
    } else {
        variables = { ..._properties };
    }

    return variables;
}

export function getTweenVars(
    _target: GSAPTweenTarget,
    _duration: number,
    _properties: GSAPTweenVars,
    _settings?: GSAPTweenVars,
    _reducedProperties?: ReducedTweenVars,
    _reducedSettings?: GSAPTweenVars
): GSAPTweenVars {
    let properties = { ..._properties };
    let settings = { ..._settings };

    // staat reduced motion aan?
    if (!reducedMotionIsEnabled) {
        // nope, normale animatie
        return removeNaN({ duration: _duration, ...getPixiVars(_target, properties, settings) });
    }

    //  als reducedVars expliciet false is, dan geen animatie, wel duur en callbacks
    if (_reducedProperties === 'skip') {
        return { duration: _duration, ...cleanVarsForNoTween(getPixiVars(_target, properties, settings)) };
    }

    // bij ignore, gebruiken we de normale animatie
    if (_reducedProperties === 'ignore') {
        return { duration: _duration, ...getPixiVars(_target, properties, settings) };
    }

    // zijn er reduced vars meegegeven?
    if (_reducedProperties) {
        // voeg alle vars toe die niet in reducedVars staan, behalve als ze NaN zijn
        const combinedProperties = { ...properties };
        for (const [key, value] of Object.entries(_reducedProperties)) {
            if (value !== undefined) {
                combinedProperties[key] = value;
            }
        }

        properties = removeNaN({ ...combinedProperties });

        // nu zelfde voor settings
        if (_reducedSettings) {
            const combinedSettings = { ...settings };
            for (const [key, value] of Object.entries(_reducedSettings)) {
                if (value !== undefined) {
                    combinedSettings[key] = value;
                }
            }

            settings = removeNaN({ ...combinedSettings });
        }
    }


    // is het een tween met een duratie en geen speciale ease meegegeven voor de reduced?
    if (isNumber(_duration) && !_reducedSettings?.ease) {
        // zit er translatie of rotatie in de properties?
        if (
            properties.rotation !== undefined ||
            properties.x !== undefined ||
            properties.y !== undefined ||
            properties.position !== undefined ||
            properties.positionX !== undefined ||
            properties.positionY !== undefined
        ) {
            // dan doen we de animatie met een beam ease
            properties = { ...properties, ease: BeamEase };
        }

        // zit er een scaling in de properties?
        else if (
            properties.scale !== undefined ||
            properties.scaleX !== undefined ||
            properties.scaleY !== undefined ||
            properties.width !== undefined ||
            properties.height !== undefined
        ) {
            // dan doen we de animatie in stappen
            const steps = ceil(_duration * 3);
            properties = { ...properties, ease: `steps(${steps})` };
        }
    }

    // anders gewoon de vars teruggeven
    return { duration: _duration, ...getPixiVars(_target, properties, settings) };

}

