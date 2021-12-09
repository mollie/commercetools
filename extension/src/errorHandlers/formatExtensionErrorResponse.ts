import { CTEnumErrors, CTError, CTUpdatesRequestedResponse } from '../types';

/**
 *
 * @param error Either a NodeJS Error or an object containing message, name, field and code
 */
export const formatExtensionErrorResponse = (error: any): CTUpdatesRequestedResponse => {
  const { message, name, field, code } = error;
  const errorMessage = message ? message : 'Error, see logs for more details';
  let ctCode;
  switch (code) {
    case 400:
      ctCode = CTEnumErrors.InvalidInput;
      break;
    case 404:
      ctCode = CTEnumErrors.ObjectNotFound;
      break;
    default:
      ctCode = CTEnumErrors.General;
  }
  const formattedError: CTError = {
    code: ctCode,
    message: errorMessage,
  };

  if (field || name) {
    const extraInfo = Object.assign({}, field && { field }, name && { name });
    formattedError['extensionExtraInfo'] = extraInfo;
  }

  return {
    status: 400,
    errors: [formattedError],
  };
};
