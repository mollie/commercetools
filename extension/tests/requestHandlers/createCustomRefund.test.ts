import { MollieClient, Refund } from '@mollie/api-client';
import PaymentsRefundsResource from '@mollie/api-client/dist/types/src/resources/payments/refunds/PaymentRefundsResource';
import Logger from '../../src/logger/logger';
import { createCustomRefund } from '../../src/requestHandlers/createCustomRefund';

describe('createCustomRefund', () => {
  const mockLogError = jest.fn();

  const mockMollieClient = {} as MollieClient;
  const mockPaymentRefunds = {} as PaymentsRefundsResource;

  const mockRefund = {} as Refund;
  mockMollieClient.payments_refunds = mockPaymentRefunds;

  const mockCtObject = {
    key: 'ord_12345',
    custom: {
      fields: {
        createCustomRefundRequest: '',
      },
    },
  };
  const createCustomRefundRequest = '{ "interactionId": "tr_12345", "amount": { "currencyCode": "EUR", "centAmount": 1547 } }';
  const createCustomRefundRequestWithDescriptionAndMetadata =
    '{ "interactionId": "tr_12345", "amount": { "currencyCode": "EUR", "centAmount": 1547 }, "description": "refund", "metadata": { "code": "HA_789"}}';

  const mockCreate = jest.fn().mockImplementation(() => mockRefund);
  beforeEach(() => {
    jest.clearAllMocks();
    Logger.error = mockLogError;
    mockPaymentRefunds.create = mockCreate;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  // 2xx
  it('should successfully call mollie create payment refund and return stub 201 response', async () => {
    mockCtObject.custom.fields.createCustomRefundRequest = createCustomRefundRequest;
    const response = await createCustomRefund(mockCtObject, mockMollieClient);

    expect(mockCreate).toHaveBeenLastCalledWith({ paymentId: 'tr_12345', amount: { currency: 'EUR', value: '15.47' } });
    expect(response.status).toEqual(201);
  });

  it('should successfully call mollie create payment refund with description and metadata if provided', async () => {
    mockCtObject.custom.fields.createCustomRefundRequest = createCustomRefundRequestWithDescriptionAndMetadata;
    const response = await createCustomRefund(mockCtObject, mockMollieClient);

    expect(mockCreate).toHaveBeenLastCalledWith({
      paymentId: 'tr_12345',
      amount: { currency: 'EUR', value: '15.47' },
      description: 'refund',
      metadata: {
        code: 'HA_789',
      },
    });
    expect(response.status).toEqual(201);
  });

  // 4xx
  it('should throw error if the incoming ctObject does not contain valid createCustomRefundRequest JSON', async () => {
    mockCtObject.custom.fields.createCustomRefundRequest = '';
    const response = await createCustomRefund(mockCtObject, mockMollieClient);
    expect(response.status).toBe(400);
  });

  it('should throw error if the incoming createCustomRefundRequest does not contain required fields', async () => {
    mockCtObject.custom.fields.createCustomRefundRequest = '{ "interactionId": "ord_78932"}';
    const response = await createCustomRefund(mockCtObject, mockMollieClient);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(400);
  });

  it('should throw error if the call to mollie fails', async () => {
    mockPaymentRefunds.create = jest.fn().mockRejectedValueOnce(() => new Error('Mollie error'));
    mockCtObject.custom.fields.createCustomRefundRequest = '';

    const { status, errors = [] } = await createCustomRefund(mockCtObject, mockMollieClient);

    expect(status).toBe(400);
    expect(errors[0]).toEqual({
      code: 'General',
      extensionExtraInfo: {
        field: undefined,
        links: undefined,
        title: undefined,
      },
      message: 'Server Error. Please see logs for more details',
    });
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});
