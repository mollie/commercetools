import { CTError, CTUpdatesRequestedResponse } from '../types';

// This is based on ApiError from Mollie's SDK
const getExtraInfo = (error: any) => {
  return {
    links: error?.links,
    title: error?.title,
    field: error?.field,
  };
};

/**
 *
 * @param error ApiError from Mollie (extended from Node's Error)
 * Formats error from failed request to Mollie into a
 * Commerce Tools "Validation Failed" response.
 * Docs: https://docs.commercetools.com/api/projects/api-extensions#error
 */
export const formatMollieErrorResponse = (error: any): CTUpdatesRequestedResponse => {
  let formattedError = {} as CTError;

  // 401 or 403
  if (error.status === 401 || error.status === 403) {
    formattedError = {
      code: 'Unauthorized',
      message: 'Forbidden or Unauthorized - Request to Mollie API failed',
      extensionExtraInfo: getExtraInfo(error),
    };
  }
  // 400
  if (error.status === 400) {
    formattedError = {
      code: 'Unauthorized',
      message: 'Request formatted incorrectly or missing information',
      extensionExtraInfo: getExtraInfo(error),
    };
  }
  // 5xx
  if (error.status >= 500) {
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
