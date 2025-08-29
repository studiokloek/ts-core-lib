// lijstje om te checken of een callback type bestaat in vars
const CallBackTypeValues = new Map([
	['onComplete', true],
	['onStart', true],
	['onUpdate', true],
	['onRepeat', true],
	['onReverseComplete', true],
	['onInterrupt', true],
]);


export function cleanVarsForNoTween(vars: GSAPTweenVars): GSAPTweenVars {
	const newVars: GSAPTweenVars = {};

	for (const [key, value] of Object.entries(vars)) {
		if (key === 'duration' || CallBackTypeValues.has(key)) {
			newVars[key] = value;
		}
	}

	return newVars;
}

export function removeNaN(obj: GSAPTweenVars): GSAPTweenVars {
	const newObj = { ...obj };

	for (const [key, value] of Object.entries(newObj)) {
		if (Number.isNaN(value)) {
			delete newObj[key];
		}
	}

	// ook pixi waarden opschonen
	const { pixi } = newObj;
	if (pixi) {
		for (const [key, value] of Object.entries(pixi)) {
			if (Number.isNaN(value)) {
				delete pixi[key];
			}
		}
		newObj.pixi = pixi;
	}

	return newObj;
}
