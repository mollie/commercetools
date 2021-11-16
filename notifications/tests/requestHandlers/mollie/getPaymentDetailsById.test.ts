import { MollieClient } from '@mollie/api-client';
import { mocked } from 'ts-jest/utils';
import getPaymentDetailsById from '../../../src/requestHandlers/mollie/getPaymentDetailsById';
import PaymentsResource from '@mollie/api-client/dist/types/src/resources/payments/PaymentsResource';
import Logger from '../../../src/logger/logger';

jest.mock('@mollie/api-client');

describe('getOrderDetailsById', () => {
  const mockLogDebug = jest.fn();
  const mockMollieClient = {} as MollieClient;
  const mockPaymentsResource = {} as PaymentsResource;

  // payments.get() on Mollie Client has two overloads
  // One returns Payment type, one returns never
  // To get typescript to compile, had to cast the mock response as 'never' (any does not work)
  const mockPayment = { id: 'tr_12345' } as never;

  mockMollieClient.payments = mockPaymentsResource;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockGetPayment = jest.fn().mockImplementationOnce(() => mockPayment);
    mockPaymentsResource.get = mockGetPayment;
    mocked(mockPaymentsResource.get).mockResolvedValueOnce(mockPayment);
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

  it('should log full error (at debug level) then throw the error if mollie call fails', async () => {
    const getPaymentFailure = jest.fn().mockRejectedValue(new Error('Mollie Error'));
    mockPaymentsResource.get = getPaymentFailure;

    await expect(getPaymentDetailsById('ord_12345', mockMollieClient)).rejects.toThrow(Error);
    expect(mockLogDebug).toHaveBeenCalledTimes(1);
  });
});
