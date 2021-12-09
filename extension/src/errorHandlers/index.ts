import { formatMollieErrorResponse } from './formatMollieErrorResponse';
import { formatExtensionErrorResponse } from './formatExtensionErrorResponse';

const errorHandler = {
  mollie: formatMollieErrorResponse,
  extension: formatExtensionErrorResponse,
};

export default errorHandler;
