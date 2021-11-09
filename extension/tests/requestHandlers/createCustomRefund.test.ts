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
  const createCustomRefundRequest = '{ "id": "tr_12345", "amount": { "currencyCode": "EUR", "centAmount": 1547 } }';
  const createCustomRefundRequestWithDescriptionAndMetadata = '{ "id": "tr_12345", "amount": { "currencyCode": "EUR", "centAmount": 1547 }, "description": "refund", "metadata": { "code": "HA_789"}}';

  const mockCreate = jest.fn().mockImplementationOnce(() => mockRefund);
  beforeEach(() => {
    jest.clearAllMocks();
    Logger.error = mockLogError;
    mockPaymentRefunds.create = mockCreate;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully call mollie create payment refund and return stub 201 response', async () => {
    mockCtObject.custom.fields.createCustomRefundRequest = createCustomRefundRequest;
    const response = await createCustomRefund(mockCtObject, mockMollieClient);

    expect(mockCreate).toHaveBeenLastCalledWith({ paymentId: 'tr_12345', amount: { currency: 'EUR', value: '15.47' } });
    expect(response).toEqual({
      status: 201,
      actions: [],
    });
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
    expect(response).toEqual({
      status: 201,
      actions: [],
    });
  });

  it('should throw error if the incoming ctObject does not contain valid createCustomRefundRequest JSON', async () => {
    mockCtObject.custom.fields.createCustomRefundRequest = '';
    const response = await createCustomRefund(mockCtObject, mockMollieClient);
    expect(response.status).toBe(400);
  });
});
