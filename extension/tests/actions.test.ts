import { validateAction } from '../src/requestHandlers/actions';

describe('validateAction', () => {
  it('Should return getPaymentMethods when payment is created (action = Create)', () => {
    const mockReqBody = {
      action: 'Create',
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe('getPaymentMethods');
  });

  it('Should return getPaymentMethods when payment is updated', () => {
    const mockReqBody = {
      action: 'Update',
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
