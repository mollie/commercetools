import { MollieClient } from '@mollie/api-client';
import PaymentsBinder from '@mollie/api-client/dist/types/src/binders/payments/PaymentsBinder';
import getPaymentDetailsById from '../../../../src/requestHandlers/mollie/getPaymentDetailsById';
import Logger from '../../../../src/logger/logger';

jest.mock('@mollie/api-client');

describe('getOrderDetailsById', () => {
  const mockLogDebug = jest.fn();
  const mockMollieClient = {} as MollieClient;
  const mockPaymentsBinder = {} as PaymentsBinder;

  // payments.get() on Mollie Client has two overloads
  // One returns Payment type, one returns never
  // To get typescript to compile, had to cast the mock response as 'never' (any does not work)
  const mockPayment = { id: 'tr_12345' } as never;

  mockMollieClient.payments = mockPaymentsBinder;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockGetPayment = jest.fn().mockImplementationOnce(() => mockPayment);
    mockPaymentsBinder.get = mockGetPayment;
    jest.mocked(mockPaymentsBinder.get).mockResolvedValueOnce(mockPayment);
    Logger.debug = mockLogDebug;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should fetch mollie order by id', async () => {
    const payment = await getPaymentDetailsById('tr_12345', mockMollieClient);
    expect(payment).toEqual({ id: 'tr_12345' });
    expect(mockLogDebug).not.toHaveBeenCalled();
  });

  it('should format 404 errors and add source information', async () => {
    const orderNotFoundError = jest.fn().mockRejectedValue({ message: 'Payment not found', statusCode: 404 });
    mockPaymentsBinder.get = orderNotFoundError;

    await expect(getPaymentDetailsById('tr_12345', mockMollieClient)).rejects.toEqual({ message: 'Payment not found', source: 'mollie', status: 404 });
  });

  it('should log full error (at debug level) then throw the error if mollie call fails', async () => {
    const getPaymentFailure = jest.fn().mockRejectedValue(new Error('Mollie Error'));
    mockPaymentsBinder.get = getPaymentFailure;

    await expect(getPaymentDetailsById('tr_12345', mockMollieClient)).rejects.toThrow(Error);
    expect(mockLogDebug).toHaveBeenCalledTimes(1);
  });
});
