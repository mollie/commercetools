import { MollieClient } from '@mollie/api-client';
import { mocked } from 'ts-jest/utils';
import getOrderDetailsById from '../../../src/requestHandlers/mollie/getOrderDetailsById';
import OrdersResource from '@mollie/api-client/dist/types/src/resources/orders/OrdersResource';
import Logger from '../../../src/logger/logger';

jest.mock('@mollie/api-client');

describe('getOrderDetailsById', () => {
  const mockLogError = jest.fn();
  const mockMollieClient = {} as MollieClient;
  const mockOrdersResource = {} as OrdersResource;

  // orders.get() on Mollie Client has two overloads
  // One returns Order type, one returns never
  // To get typescript to compile, had to cast the mock response as 'never' (any does not work)
  const mockOrder = { id: 'ord_12345' } as never;

  mockMollieClient.orders = mockOrdersResource;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockGetOrder = jest.fn().mockImplementationOnce(() => mockOrder);
    mockOrdersResource.get = mockGetOrder;
    mocked(mockOrdersResource.get).mockResolvedValueOnce(mockOrder);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should fetch mollie order by id', async () => {
    const order = await getOrderDetailsById('ord_12345', mockMollieClient);
    expect(order).toEqual({ id: 'ord_12345' });
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it('should throw and log error if mollie call fails', async () => {
    Logger.error = mockLogError;
    const getOrderFailure = jest.fn().mockRejectedValue(new Error('Mollie Error'));
    mockOrdersResource.get = getOrderFailure;

    await expect(getOrderDetailsById('ord_12345', mockMollieClient)).rejects.toThrow(Error);
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});
