import { MollieClient, Order } from '@mollie/api-client';
import { mocked } from 'ts-jest/utils';
import getOrderDetailsById from '../../../src/requestHandlers/mollie/getOrderDetailsById';
import OrdersResource from '@mollie/api-client/dist/types/src/resources/orders/OrdersResource';

jest.mock('@mollie/api-client');

describe('getOrderDetailsById', () => {
  const mockMollieClient = {} as MollieClient;
  const mockOrdersResource = {} as OrdersResource;
  const mockOrder = { id: 'ord_12345' } as Order;

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
  });
});
