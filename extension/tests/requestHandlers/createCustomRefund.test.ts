import { MollieClient, Refund } from '@mollie/api-client';
import PaymentsRefundsResource from '@mollie/api-client/dist/types/src/resources/payments/refunds/PaymentRefundsResource';
import Logger from '../../src/logger/logger';
import { createCustomRefund } from '../../src/requestHandlers/createCustomRefund';

jest.mock('../../src/utils');

describe('createCustomRefund', () => {
  const mockLogError = jest.fn();

  const mockMollieClient = {} as MollieClient;
  const mockPaymentRefunds = {} as PaymentsRefundsResource;

  const mockRefund = {} as Refund;
  mockMollieClient.payments_refunds = mockPaymentRefunds;

  beforeEach(() => {
    jest.clearAllMocks();
    Logger.error = mockLogError;
    const mockCreate = jest.fn().mockImplementationOnce(() => mockRefund);
    mockPaymentRefunds.create = mockCreate;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return stub 201 response', async () => {
    const response = await createCustomRefund({}, mockMollieClient, {});
    expect(response).toEqual({
      status: 201,
      actions: [],
    });
  });
});
