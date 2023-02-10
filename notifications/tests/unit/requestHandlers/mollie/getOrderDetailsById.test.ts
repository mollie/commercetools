import { MollieClient } from '@mollie/api-client';
import OrdersBinder from '@mollie/api-client/dist/types/src/binders/orders/OrdersBinder';
import getOrderDetailsById from '../../../../src/requestHandlers/mollie/getOrderDetailsById';
import Logger from '../../../../src/logger/logger';

jest.mock('@mollie/api-client');

describe('getOrderDetailsById', () => {
  const mockLogDebug = jest.fn();
  const mockMollieClient = {} as MollieClient;
  const mockOrdersBinder = {} as OrdersBinder;

  // orders.get() on Mollie Client has two overloads
  // One returns Order type, one returns never
  // To get typescript to compile, had to cast the mock response as 'never' (any does not work)
  const mockOrder = { id: 'ord_12345' } as never;

  mockMollieClient.orders = mockOrdersBinder;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockGetOrder = jest.fn().mockImplementationOnce(() => mockOrder);
    mockOrdersBinder.get = mockGetOrder;
    jest.mocked(mockOrdersBinder.get).mockResolvedValueOnce(mockOrder);
    Logger.debug = mockLogDebug;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should fetch mollie order by id', async () => {
    const order = await getOrderDetailsById('ord_12345', mockMollieClient);
    expect(order).toEqual({ id: 'ord_12345' });
    expect(mockLogDebug).not.toHaveBeenCalled();
  });

  it('should format 404 errors and add source information', async () => {
    const orderNotFoundError = jest.fn().mockRejectedValue({ message: 'Order not found', statusCode: 404 });
    mockOrdersBinder.get = orderNotFoundError;

    await expect(getOrderDetailsById('ord_12345', mockMollieClient)).rejects.toEqual({ message: 'Order not found', source: 'mollie', status: 404 });
  });

  it('should log full error (at debug level) then throw the error if mollie call fails', async () => {
    const getOrderFailure = jest.fn().mockRejectedValue(new Error('Mollie Error'));
    mockOrdersBinder.get = getOrderFailure;

    await expect(getOrderDetailsById('ord_12345', mockMollieClient)).rejects.toThrow(Error);
    expect(mockLogDebug).toHaveBeenCalledTimes(1);
  });
});
