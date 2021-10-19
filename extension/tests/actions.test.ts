import { validateAction } from '../src/requestHandlers/actions';
import { ControllerAction } from '../src/types/index';

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
    expect(action).toBe(ControllerAction.GetPaymentMethods);
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
    expect(action).toBe(ControllerAction.CreateOrder);
  });

  it('Should return Invalid if no createOrder or getPaymentMethods fields are present', () => {
    const mockReqBody = {
      resource: {
        obj: {
          custom: {
            fields: {
              paymentMethodsRequest: '{}',
              paymentMethodsResponse: '{}',
              createOrderRequest: '{}',
              createOrderResponse: '{}',
            },
          },
        },
      },
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe(ControllerAction.Invalid);
  });
});
