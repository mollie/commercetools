import { CTEnumErrors } from '../../../src/types/index';
import { formatExtensionErrorResponse } from '../../../src/errorHandlers/formatExtensionErrorResponse';

describe('formatExtensionErrorResponse', () => {
  it('should return the formatted error array when provided a code and message', () => {
    const { errors } = formatExtensionErrorResponse(CTEnumErrors.SyntaxError, 'Payment not processable');
    expect(errors?.[0]).toEqual({
      code: 'SyntaxError',
      message: 'Payment not processable',
    });
  });

  it('should return default code and message if these are not provided', () => {
    const { errors } = formatExtensionErrorResponse(undefined, '');
    expect(errors?.[0]).toEqual({
      code: 'General',
      message: 'Error, see logs for more details',
    });
  });

  it('should return the formatted error and extra information if this object is provided', () => {
    const { errors } = formatExtensionErrorResponse(CTEnumErrors.InvalidInput, 'Cannot process payment', { field: 'custom.fields.paymentMethodsRequest' });
    expect(errors?.[0]).toEqual({
      code: 'InvalidInput',
      message: 'Cannot process payment',
      extensionExtraInfo: {
        field: 'custom.fields.paymentMethodsRequest',
      },
    });
  });
});
