import { validateAction } from '../../src/requestHandlers/actions';
import { ControllerAction } from '../../src/types/index';

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

  it('Should return createOrderPayment when createOrderPaymentRequest is present and createOrderPaymentResponse is not', () => {
    const mockReqBody = {
      resource: {
        obj: {
          custom: {
            fields: {
              createOrderPaymentRequest: '{}',
            },
          },
        },
      },
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe(ControllerAction.CreateOrderPayment);
  });

  it('Should return createShipment when createShipmentRequest is present and createShipmentResponse is not', () => {
    const mockReqBody = {
      resource: {
        obj: {
          custom: {
            fields: {
              createShipmentRequest: '{}',
            },
          },
        },
      },
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe(ControllerAction.CreateShipment);
  });

  it('Should return createOrderRefund when createOrderRefundRequest is present and createOrderRefundResponse is not', () => {
    const mockReqBody = {
      resource: {
        obj: {
          custom: {
            fields: {
              createOrderRefundRequest: '{}',
            },
          },
        },
      },
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe(ControllerAction.CreateOrderRefund);
  });

  it('Should return createCustomRefund when createCustomRefundRequest is present and createCustomRefundResponse is not', () => {
    const mockReqBody = {
      resource: {
        obj: {
          custom: {
            fields: {
              createCustomRefundRequest: '{}',
            },
          },
        },
      },
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe(ControllerAction.CreateCustomRefund);
  });

  it('Should return cancelOrder when createCancelOrderRequest is present and createCancelOrderResponse is not', () => {
    const mockReqBody = {
      resource: {
        obj: {
          custom: {
            fields: {
              createCancelOrderRequest: '{}',
            },
          },
        },
      },
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe(ControllerAction.CancelOrder);
  });

  it('Should return NoAction if request & response fields are present for all custom fields', () => {
    const mockReqBody = {
      resource: {
        obj: {
          custom: {
            fields: {
              paymentMethodsRequest: '{}',
              paymentMethodsResponse: '{}',
              createOrderRequest: '{}',
              createOrderResponse: '{}',
              createOrderPaymentRequest: '{}',
              createOrderPaymentResponse: '{}',
              createOrderRefundRequest: '{}',
              createOrderRefundResponse: '{}',
              createCancelOrderRequest: '{}',
              createCancelOrderResponse: '{}',
            },
          },
        },
      },
    };
    const action = validateAction(mockReqBody);
    expect(action).toBe(ControllerAction.NoAction);
  });
});
