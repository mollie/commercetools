import { CTUpdatesRequestedResponse, CTError } from '../types';

const getExtraInfo = (error: any) => {
  return {
    links: error?.links,
    title: error?.title,
    field: error?.field
  }
}

export const formatMollieErrorResponse = (error: any) => {
  let errorResponse: CTUpdatesRequestedResponse = {
    status: 400,
    errors: [],
  };
  let formattedError = {} as CTError;

  // 401 or 403
  if (error.status === 401 || error.status === 403) {
    formattedError = {
      code: 'Forbidden',
      message: 'Forbidden or Unauthorized - Request to Mollie API failed',
      extensionExtraInfo: getExtraInfo(error) || {}
    };
    errorResponse?.errors?.push(formattedError);
  }
  // 400
  if (error.status === 400) {
    formattedError = {
      code: 'BadRequest',
      message: 'Request formatted incorrectly or missing information',
      extensionExtraInfo: getExtraInfo(error)
    };
    errorResponse?.errors?.push(formattedError);
  }
  // 5xx
  if (error.status >= 500) {
    formattedError = {
      code: 'General',
      message: 'Server Error. Please see logs for more details',
      extensionExtraInfo: getExtraInfo(error)
    };
    errorResponse?.errors?.push(formattedError);
  }

  return errorResponse;
};
