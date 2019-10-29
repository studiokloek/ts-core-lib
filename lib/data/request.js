import * as request from 'superagent';
import { getLogger } from '@studiokloek/kloek-ts-core/logger';
import { stringSizeInKb } from './util';
import { isOnline } from '@studiokloek/kloek-ts-core/device';
const Logger = getLogger('core > request');
export const ResponseErrorTypes = {
    DEFAULT: 'default',
    TIMEOUT: 'timeout',
    TERMINATED: 'terminated',
    NOT_FOUND: 'not_found',
    OFFLINE: 'offline',
};
function getResponseError(_responseError) {
    const code = _responseError.status || -1, message = _responseError.message || '';
    let type;
    // bepaal type
    if (code === 404) {
        type = ResponseErrorTypes.NOT_FOUND;
    }
    else if (message.toLowerCase() === 'aborted') {
        type = ResponseErrorTypes.TIMEOUT;
    }
    else if (message.includes('Request has been terminated')) {
        type = ResponseErrorTypes.TERMINATED;
    }
    else {
        type = ResponseErrorTypes.DEFAULT;
    }
    return { type, message, code };
}
async function checkNetworkStatus() {
    if (!(await isOnline())) {
        return { type: ResponseErrorTypes.OFFLINE, message: 'Device is offline...', code: -1 };
    }
}
export async function getLocalUrlContents(_url) {
    Logger.debug(`getLocalUrlContents() start loading '${_url}'`);
    const result = {};
    // zijn we wel online
    const networkError = await checkNetworkStatus();
    if (networkError) {
        result.error = networkError;
        return result;
    }
    try {
        const response = await request.get(_url);
        const contents = response.text;
        Logger.debug(`getLocalUrlContents() done loading ${stringSizeInKb(contents)}kb from '${_url}'`);
        result.body = contents;
        return result;
    }
    catch (error) {
        Logger.error(`getLocalUrlContents() Could not load contents of ${_url}...`);
        result.error = getResponseError(error);
    }
    return result;
}
export async function getAPIRequest(_url) {
    Logger.debug(`getAPIRequest() start loading '${_url}'`);
    const result = {};
    // zijn we wel online
    const networkError = await checkNetworkStatus();
    if (networkError) {
        result.error = networkError;
        return result;
    }
    try {
        const response = await request.get(_url).accept('json');
        const contents = response.body;
        Logger.debug(`getAPIRequest() done loading ${stringSizeInKb(contents)}kb from '${_url}'`);
        result.body = contents;
        return result;
    }
    catch (error) {
        Logger.error(`getAPIRequest() Could not load contents of ${_url}...`);
        result.error = getResponseError(error);
    }
    return result;
}
export async function postAPIRequest(_url, _body) {
    Logger.debug(`postAPIRequest() posting to '${_url}' with body`, _body);
    const result = {};
    // zijn we wel online
    const networkError = await checkNetworkStatus();
    if (networkError) {
        result.error = networkError;
        return result;
    }
    try {
        const response = await request
            .post(_url)
            .send(_body)
            .type('form')
            .timeout(1000 * 10); // max tien seconden
        const contents = response.body;
        Logger.debug(`postAPIRequest() successfully posted to '${_url}'`);
        result.body = contents;
        return result;
    }
    catch (error) {
        Logger.error(`postAPIRequest() Could not post to ${_url}...`);
        result.error = getResponseError(error);
    }
    return result;
}
//# sourceMappingURL=request.js.map