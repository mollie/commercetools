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

  it('Should return createOrder when createOrderRequest is present and createOrderResponse is not', () => {
    const mockReqBody = {
      resource: {
        obj: {
          custom: {
            fields: {
              createOrderRequest: '{}',
            },
          },
        },
      },
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe('createOrder');
  });
});
