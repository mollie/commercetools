import { formatExtensionErrorResponse } from '../../../src/errorHandlers/formatExtensionErrorResponse';

describe('formatExtensionErrorResponse', () => {
  it('should return the formatted error array with InvalidInput pass an error with code 400', () => {
    const error = new Error('Payment not processable') as any;
    error.code = 400;
    const { errors } = formatExtensionErrorResponse(error);
    expect(errors?.[0]).toEqual({
      code: 'InvalidInput',
      message: 'Payment not processable',
      extensionExtraInfo: {
        name: 'Error',
      },
    });
  });

  it('should return the formatted error array with ObjectNotFound when passed an object with code 404', () => {
    const { errors } = formatExtensionErrorResponse({ message: 'Cannot find associated cart', code: 404 });
    expect(errors?.[0]).toEqual({
      code: 'ObjectNotFound',
      message: 'Cannot find associated cart',
    });
  });

  it('should return default code and message if these are not present on incoming parameter', () => {
    const { errors } = formatExtensionErrorResponse({ message: '' });
    expect(errors?.[0]).toEqual({
      code: 'General',
      message: 'Error, see logs for more details',
    });
  });

  it('should return the formatted error and extra information if field is provided', () => {
    const { errors } = formatExtensionErrorResponse({ message: 'Unexpected token b in JSON at position 2', field: 'custom.fields.paymentMethodsRequest', code: 400 });
    expect(errors?.[0]).toEqual({
      code: 'InvalidInput',
      message: 'Unexpected token b in JSON at position 2',
      extensionExtraInfo: {
        field: 'custom.fields.paymentMethodsRequest',
      },
    });
  });
});
