import { Logger } from '@studiokloek/kloek-ts-core/logger';
export function getElementFromTemplate(_id) {
    const template = document.querySelector(_id);
    if (!template || !template.firstChild) {
        Logger.error('HTMLInfoOverlay template not found...');
        return;
    }
    // get template contents
    const contents = document.createElement('div');
    contents.innerHTML = template.innerHTML;
    return contents.firstChild;
}
//# sourceMappingURL=template.js.map