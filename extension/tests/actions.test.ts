import { validateAction } from '../src/requestHandlers/actions';

describe('validateAction', () => {
  it('Should return getPaymentMethods when payment is created or updated', () => {
    const mockReqBody = {
      resource: {
        obj: {
          custom: {
            fields: {
              paymentMethodsRequest: '{}',
            },
          },
        },
      },
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe('getPaymentMethods');
  });
});
