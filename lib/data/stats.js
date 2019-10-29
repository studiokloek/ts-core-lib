import { CoreDebug } from '@studiokloek/kloek-ts-core/core-debug';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { isPlatform, isApp, Platform } from '@studiokloek/kloek-ts-core/device';
const Logger = getLogger('core > data > stats');
function initStats(_ua) {
    if (!_ua) {
        Logger.warn('initStats() No UA id provided.');
        return;
    }
    if (window.ga && !CoreDebug.isEnabled()) {
        // onder iOS moeten we andere instellingen hebben.
        if (isApp() && isPlatform(Platform.IOS)) {
            // zorg er voor dat dat we niets opslaan, want dat werkt niet onder ios
            window.ga('create', _ua, {
                cookieDomain: 'none',
                storage: 'none',
                clientId: window.localStorage.getItem('ga_clientId'),
            });
            // zorg er voor dat analicts ook werkt onder capacitor://
            window.ga('set', 'checkProtocolTask', function () {
                /* nothing */
            });
            window.ga(function (tracker) {
                window.localStorage.setItem('ga_clientId', tracker.get('clientId'));
            });
        }
        else {
            window.ga('create', _ua);
        }
        // meer privacy voor de kids
        window.ga('set', 'allowAdFeatures', false);
        window.ga('set', 'anonymizeIp', true);
    }
}
function doTrack(_event) {
    Logger.info('doTrack', _event);
    if (typeof window.ga === 'function') {
        window.ga('send', _event);
    }
}
let currentPage;
function getCurrentPageEvent() {
    if (!currentPage) {
        return;
    }
    const title = currentPage.title;
    let path = '/';
    if (currentPage.path) {
        path = `${path}${currentPage.path}`;
    }
    return {
        hitType: 'pageview',
        page: path,
        title: title,
    };
}
function registerPageStats(_data) {
    if (!_data || !_data.path) {
        return;
    }
    currentPage = _data;
    const event = getCurrentPageEvent();
    if (!event) {
        return;
    }
    if (CoreDebug.isEnabled()) {
        Logger.debug(`registerPage('${event.page}', '${event.title}')`);
    }
    else {
        doTrack(event);
    }
}
function registerEventStats(_data) {
    if (!_data || !_data.path) {
        return;
    }
    const event = getCurrentPageEvent();
    if (!event) {
        return;
    }
    // append path
    event.page = `${event.page}/${_data.path}`;
    // append optional value
    if (_data.value !== undefined) {
        event.page = `${event.page}/${_data.value}`;
    }
    if (CoreDebug.isEnabled()) {
        Logger.debug(`registerEvent('${event.page}', '${event.title}')`);
    }
    else {
        doTrack(event);
    }
}
export const Stats = {
    registerPage: registerPageStats,
    registerEvent: registerEventStats,
    initStats,
};
//# sourceMappingURL=stats.js.map