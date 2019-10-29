export function getElement(_target) {
    // target vinden
    if (typeof _target === 'string') {
        return document.querySelector(_target);
    }
    else if (_target instanceof HTMLElement) {
        return _target;
    }
    return null;
}
//# sourceMappingURL=selector.js.map