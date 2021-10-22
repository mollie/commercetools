import { CTError, CTUpdatesRequestedResponse } from '../types';

// This is based on MollieApiError interface from Mollie's SDK
const getExtraInfo = (error: any) => {
  return {
    links: error?.links,
    title: error?.title,
    field: error?.field,
  };
};

/**
 *
 * @param error Takes Error or ApiError from Mollie SDK (extended from Node's Error class)
 * Formats error from failed request to Mollie into a
 * commercetools "Validation Failed" response.
 * Docs: https://docs.commercetools.com/api/projects/api-extensions#error
 */
export const formatMollieErrorResponse = (error: any): CTUpdatesRequestedResponse => {
  let formattedError = {} as CTError;
  const status = error.status;
  switch (true) {
    case status === 401:
    case status === 403:
      formattedError = {
        code: 'Unauthorized',
        message: 'Forbidden or Unauthorized - Request to Mollie API failed',
        extensionExtraInfo: getExtraInfo(error),
      };
      break;

    case status === 400:
      formattedError = {
        code: 'SyntaxError',
        message: 'Request formatted incorrectly or missing information',
        extensionExtraInfo: getExtraInfo(error),
      };
      break;

    case status === 422:
      formattedError = {
        code: 'SemanticError',
        message: error.message,
        extensionExtraInfo: getExtraInfo(error),
      };
      break;

    case status === 404:
      formattedError = {
        code: 'ObjectNotFound',
        message: error.message,
        extensionExtraInfo: getExtraInfo(error),
      };
      break;

    case status >= 400 && status < 500:
      formattedError = {
        code: 'SyntaxError',
        message: `Request error - ${error.status} code returned from Mollie`,
        extensionExtraInfo: getExtraInfo(error),
      };
      break;
    default:
      //5xx
      formattedError = {
        code: 'General',
        message: 'Server Error. Please see logs for more details',
        extensionExtraInfo: getExtraInfo(error),
      };
  }

  return {
    status: 400,
    errors: [formattedError],
  };
};
