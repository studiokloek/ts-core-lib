import * as request from 'superagent';
import { isOnline } from '../device';
import { getLogger } from '../logger';
import { stringSizeInKb } from './util';

const Logger = getLogger('data > request');

export const ResponseErrorTypes = {
  DEFAULT: 'default',
  TIMEOUT: 'timeout',
  TERMINATED: 'terminated',
  NOT_FOUND: 'not_found',
  OFFLINE: 'offline',
};

export interface ResponseError {
  type: string;
  message: string;
  code: number;
}

export interface ResponseResult {
  error?: ResponseError;
  body?: {} | string;
}

function getResponseError(_responseError: request.ResponseError): ResponseError {
  const code = _responseError.status || -1,
    message = _responseError.message || '';

  let type;
  // bepaal type
  if (code === 404) {
    type = ResponseErrorTypes.NOT_FOUND;
  } else if (message.toLowerCase() === 'aborted') {
    type = ResponseErrorTypes.TIMEOUT;
  } else if (message.includes('Request has been terminated')) {
    type = ResponseErrorTypes.TERMINATED;
  } else {
    type = ResponseErrorTypes.DEFAULT;
  }

  return { type, message, code };
}

async function checkNetworkStatus(): Promise<ResponseError | void> {
  if (!(await isOnline())) {
    return { type: ResponseErrorTypes.OFFLINE, message: 'Device is offline...', code: -1 };
  }
}

export async function getLocalUrlContents(_url: string): Promise<ResponseResult> {
  Logger.debug(`getLocalUrlContents() start loading '${_url}'`);

  const result: ResponseResult = {};

  // zijn we wel online
  // const networkError = await checkNetworkStatus();
  // if (networkError) {
  //   result.error = networkError;
  //   return result;
  // }

  try {
    const response = await request.get(_url);
    const contents = response.text;
    Logger.debug(`getLocalUrlContents() done loading ${stringSizeInKb(contents)}kb from '${_url}'`);

    result.body = contents;

    return result;
  } catch (error) {
    Logger.error(`getLocalUrlContents() Could not load contents of ${_url}...`);
    result.error = getResponseError(error as request.ResponseError);
  }

  return result;
}

export async function getAPIRequest(_url: string): Promise<ResponseResult> {
  Logger.debug(`getAPIRequest() start loading '${_url}'`);

  const result: ResponseResult = {};

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
  } catch (error) {
    Logger.error(`getAPIRequest() Could not load contents of ${_url}...`);
    result.error = getResponseError(error as request.ResponseError);
  }

  return result;
}

export async function postAPIRequest(_url: string, _body?: {}): Promise<ResponseResult> {
  Logger.debug(`postAPIRequest() posting to '${_url}' with body`, _body);

  const result: ResponseResult = {};

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
  } catch (error) {
    Logger.error(`postAPIRequest() Could not post to ${_url}...`);
    result.error = getResponseError(error as request.ResponseError);
  }

  return result;
}
