import * as request from 'superagent';
import { isOnline } from '../device';
import { getLogger } from '../logger';
import { stringSizeInKb } from './util';

const Logger = getLogger('data > request');

/** Soorten fouten die kunnen optreden bij een netwerkverzoek: `DEFAULT`, `TIMEOUT`, `TERMINATED`, `NOT_FOUND` of `OFFLINE`. */
export const ResponseErrorTypes = {
  DEFAULT: 'default',
  TIMEOUT: 'timeout',
  TERMINATED: 'terminated',
  NOT_FOUND: 'not_found',
  OFFLINE: 'offline',
};

/** Informatie over een fout bij een netwerkverzoek: het type fout, een beschrijving en de HTTP-statuscode. */
export interface ResponseError {
  type: string;
  message: string;
  code: number;
}

/** Het resultaat van een netwerkverzoek: ofwel een `body` met de ontvangen gegevens, ofwel een `error` als het mislukt is. */
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
  if (!isOnline()) {
    return { type: ResponseErrorTypes.OFFLINE, message: 'Device is offline...', code: -1 };
  }
}

/**
 * Haalt de tekst op van een lokale URL (bijvoorbeeld een bestand dat in de app is meegeleverd).
 * Geeft een resultaat terug met de tekst bij succes, of een fout als het mislukt.
 */
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

/**
 * Haalt gegevens op van een API-eindpunt en controleert eerst of er een internetverbinding is.
 * Geeft het JSON-antwoord terug bij succes, of een fout als het mislukt.
 * @param _timeout Optionele time-out in seconden.
 */
export async function getAPIRequest(_url: string, _timeout?: { response: number; deadline?: number }): Promise<ResponseResult> {
  Logger.debug(`getAPIRequest() start loading '${_url}'`);

  const result: ResponseResult = {};

  // zijn we wel online
  const networkError = await checkNetworkStatus();
  if (networkError) {
    result.error = networkError;
    return result;
  }

  const timeout = {
    response: (_timeout?.response ?? 10) * 1000, // Wait x seconds for the server to start sending,
    deadline: _timeout?.deadline ? _timeout?.deadline * 1000 : undefined, // allow x seconds to finish loading.
  };

  try {
    const response = await request.get(_url).accept('json').timeout(timeout);
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

/**
 * Stuurt gegevens naar een API-eindpunt en controleert eerst of er een internetverbinding is.
 * Geeft het JSON-antwoord terug bij succes, of een fout als het mislukt.
 * @param _timeout Optionele time-out in seconden.
 */
export async function postAPIRequest(_url: string, _body?: {}, _timeout?: { response: number; deadline?: number }): Promise<ResponseResult> {
  Logger.debug(`postAPIRequest() posting to '${_url}' with body`, _body);

  const result: ResponseResult = {};

  // zijn we wel online
  const networkError = await checkNetworkStatus();
  if (networkError) {
    result.error = networkError;
    return result;
  }

  // bepaal timeout, standaard 10 seconden
  const timeout = {
    response: (_timeout?.response ?? 10) * 1000, // Wait x seconds for the server to start sending,
    deadline: _timeout?.deadline ? _timeout?.deadline * 1000 : undefined, // allow x seconds to finish loading.
  };

  try {
    const response = await request.post(_url).send(_body).type('form').timeout(timeout);

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
