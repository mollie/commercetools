import { formatMollieErrorResponse } from './formatMollieErrorResponse';
import { formatExtensionErrorResponse } from './formatExtensionErrorResponse';

/**
 *
 * @param error Node Error object or an object with set keys of message, name, field
 * @param code Status code, defaults to 500
 * Extends error with isExtensionError, so we can format the response to commercetools
 * and make it clear that the error originated from either mollie or API Extension
 */
export const createExtensionError = (error: any, code = 500) => {
  return { ...error, isExtensionError: true, code };
};

const formatErrorResponse = (error: any) => {
  return error.isExtensionError ? formatExtensionErrorResponse(error) : formatMollieErrorResponse(error);
};

export default formatErrorResponse;
