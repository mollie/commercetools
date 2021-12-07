import { CTEnumErrors, CTError } from '../types';

/**
 *
 * @param code Defaults to "General" if not provided
 * @param message High level description of the error
 * @param extraInfo JSON object, optional
 */
export const formatExtensionErrorResponse = (code: CTEnumErrors = CTEnumErrors.General, message: string, extraInfo?: Object) => {
  const errorMessage = !!message ? message : 'Error, see logs for more details';
  const formattedError: CTError = {
    code,
    message: errorMessage,
  };

  if (extraInfo && Object.keys(extraInfo).length) {
    formattedError['extensionExtraInfo'] = extraInfo;
  }

  return {
    status: 400,
    errors: [formattedError],
  };
};
