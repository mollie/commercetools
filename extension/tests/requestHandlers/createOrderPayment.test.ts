import { getOrdersPaymentsParams } from '../../src/requestHandlers/createOrderPayment';

describe('Create order payment tests', () => {
  const mockConsoleError = jest.fn();
  beforeEach(() => {
    console.error = mockConsoleError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create right params for mollie createOrderPayment call', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          paymentMethodsRequest: 'true',
          paymentMethodsResponse: 'true',
          createOrderRequest: 'true',
          createOrderResponse: 'true',
          createOrderPaymentRequest: '{"method":"creditcard"}',
        },
      },
    };
    const expectedCreateOrderPaymentParams = {
      orderId: 'ord_3uwvfd',
    };
    await expect(getOrdersPaymentsParams(mockedCtObj)).resolves.toMatchObject(expectedCreateOrderPaymentParams);
  });
  it('Should return error if creating params for createOrderPayment fails', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          paymentMethodsRequest: 'true',
          paymentMethodsResponse: 'true',
          createOrderRequest: 'true',
          createOrderResponse: 'true',
          createOrderPaymentRequest: 'something_json_parse_cannot_handle',
        },
      },
    };
    const expectedError = { status: 400, title: 'Could not make parameters needed to create Mollie order payment.', field: 'createOrderPaymentRequest' };
    await expect(getOrdersPaymentsParams(mockedCtObj)).rejects.toEqual(expectedError);
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
  });
});
