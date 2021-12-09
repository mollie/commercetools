import { CTError, CTUpdatesRequestedResponse, CTEnumErrors } from '../types';

// This is based on MollieApiError interface from Mollie's SDK
const getExtraInfo = ({ status, links, title, field }: any) => {
  const extraInfo = Object.assign({}, status && { originalStatusCode: status }, links && { links }, title && { title }, field && { field });
  return extraInfo;
};

/**
 *
 * @param error Takes extension error or ApiError from Mollie SDK (extended from Node's Error class)
 * Formats error into a commercetools "Validation Failed" response.
 * Docs: https://docs.commercetools.com/api/projects/api-extensions#error
 */
const formatErrorResponse = (error: any): CTUpdatesRequestedResponse => {
  let formattedError = {} as CTError;
  const ctCode = error.ctCode;
  const status = error.status;
  switch (true) {
    case status === 401:
    case status === 403:
      formattedError = {
        code: CTEnumErrors.Unauthorized,
        message: error.message,
      };
      break;

    case status === 400:
      formattedError = {
        code: ctCode ?? CTEnumErrors.SyntaxError,
        message: error.message,
      };
      break;

    case status === 422:
      formattedError = {
        code: CTEnumErrors.SemanticError,
        message: error.message,
      };
      break;

    case status === 404:
      formattedError = {
        code: CTEnumErrors.ObjectNotFound,
        message: error.message,
      };
      break;

    case status === 409:
      formattedError = {
        code: CTEnumErrors.InvalidOperation,
        message: error.message,
      };
      break;

    case status >= 400 && status < 500:
      formattedError = {
        code: CTEnumErrors.SyntaxError,
        message: error.message ?? `Request error`,
      };
      break;
    default:
      //5xx
      formattedError = {
        code: CTEnumErrors.General,
        message: error.message ?? 'Please see logs for more details',
      };
  }
  const extraInfo = getExtraInfo(error);
  if (Object.keys(extraInfo).length) formattedError.extensionExtraInfo = extraInfo;

  return {
    status: 400,
    errors: [formattedError],
  };
};

export default formatErrorResponse;
