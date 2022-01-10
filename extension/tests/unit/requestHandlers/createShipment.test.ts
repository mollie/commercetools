import { v4 as uuid } from 'uuid';
import { mocked } from 'ts-jest/utils';
import { CTPayment } from '../../../src/types';
import createShipment, { getShipmentParams, createCtActions } from '../../../src/requestHandlers/createShipment';
import Logger from '../../../src/logger/logger';
import { Order } from '@mollie/api-client';

jest.mock('uuid');

describe('getShipmentParams', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create required params for mollie createShipment call', async () => {
    const mockCtPayment = {
      key: 'ord_3uwvfd',
    } as Required<CTPayment>;
    const expectedCreateShipmentParams = {
      orderId: 'ord_3uwvfd',
    };
    await expect(getShipmentParams(mockCtPayment, undefined)).resolves.toEqual(expectedCreateShipmentParams);
  });
  it('Should create all optional params for mollie createShipment call when shipping whole lines', async () => {
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      transactions: [
        {
          type: 'Charge',
          state: 'Initial',
          custom: {
            fields: {
              lineIds: '3e632c95-8dc6-459a-9edc-5e64760abf21,  31fb05cd-6e00-42b4-a25d-68cceef5a603',
              includeShipping: true,
            },
          },
        },
      ],
    } as Required<CTPayment>;
    const mockOrderRes = {
      lines: [
        {
          id: 'odl_1.tlaa3w',
          orderId: 'ord_3uwvfd',
          name: 'Banaan',
          metadata: { cartLineItemId: '3e632c95-8dc6-459a-9edc-5e64760abf21' },
          quantity: 2,
          totalAmount: { value: '1.42', currency: 'EUR' },
        },
        {
          id: 'odl_1.5zqqm',
          orderId: 'ord_3uwvfd',
          name: 'Apple',
          metadata: { cartLineItemId: 'd02457cc-fceb-4588-9bdb-c93d4295b261' },
          quantity: 4,
          totalAmount: { value: '7.12', currency: 'EUR' },
        },
        {
          id: 'odl_1.6997yo',
          orderId: 'ord_3uwvfd',
          name: 'Gift wrapping service',
          metadata: { cartCustomLineItemId: '31fb05cd-6e00-42b4-a25d-68cceef5a603' },
          quantity: 1,
          totalAmount: { value: '7.50', currency: 'EUR' },
        },
        {
          id: 'odl_1.cgark2',
          orderId: 'ord_3uwvfd',
          name: 'Shipping - Standard Shipping',
          metadata: null,
          type: 'shipping_fee',
          quantity: 1,
          totalAmount: { value: '0.00', currency: 'EUR' },
        },
      ],
    } as Order;
    const expectedCreateShipmentParams = {
      orderId: 'ord_3uwvfd',
      lines: [{ id: 'odl_1.tlaa3w', quantity: 2, amount: { value: '1.42', currency: 'EUR' } }, { id: 'odl_1.6997yo', quantity: 1, amount: { value: '7.50', currency: 'EUR' } }, { id: 'odl_1.cgark2' }],
    };
    await expect(getShipmentParams(mockCtPayment, mockOrderRes)).resolves.toEqual(expectedCreateShipmentParams);
  });
  it('Should create required params for mollie createShipment call', async () => {
    const expectedError = { status: 400, title: 'Could not make parameters needed to create Mollie shipment.', field: 'createShipmentRequest' };
    await expect(getShipmentParams(undefined as unknown as Required<CTPayment>, undefined)).rejects.toMatchObject(expectedError);
  });
});
describe('createCtActions', () => {
  beforeAll(() => {
    const mockUuid = '3fea7470-5434-4056-a829-a187339e94d8';
    mocked(uuid).mockReturnValue(mockUuid);
  });
  afterAll(() => {
    jest.clearAllMocks();
  });
  it('Should create correct ct actions from request and mollies payment', () => {
    const mockCtPayment = {
      key: 'ord_3uwvfd',
      transactions: [
        {
          id: '869ea4f0-b9f6-4006-bf04-d8306b5c9564',
          type: 'Charge',
          state: 'Initial',
          custom: {
            fields: {
              lineIds: '3e632c95-8dc6-459a-9edc-5e64760abf21,  31fb05cd-6e00-42b4-a25d-68cceef5a603',
              includeShipping: true,
            },
          },
        },
      ],
    } as Required<CTPayment>;
    const mockShipmentResponse: any = {
      resource: 'shipment',
      id: 'shp_t72vlb',
      orderId: 'ord_3uwvfd',
      createdAt: '2021-10-27T10:25:24+00:00',
      lines: [
        {
          id: 'odl_1.tlaa3w',
          orderId: 'ord_3uwvfd',
          name: 'Banaan',
          metadata: { cartLineItemId: '3e632c95-8dc6-459a-9edc-5e64760abf21' },
          quantity: 2,
          totalAmount: { value: '1.42', currency: 'EUR' },
        },
        {
          id: 'odl_1.6997yo',
          orderId: 'ord_3uwvfd',
          name: 'Gift wrapping service',
          metadata: { cartCustomLineItemId: '31fb05cd-6e00-42b4-a25d-68cceef5a603' },
          quantity: 1,
          totalAmount: { value: '7.50', currency: 'EUR' },
        },
        {
          id: 'odl_1.cgark2',
          orderId: 'ord_3uwvfd',
          name: 'Shipping - Test Shipping',
          metadata: null,
          type: 'shipping_fee',
          quantity: 1,
          totalAmount: { value: '0.00', currency: 'EUR' },
        },
      ],
    };
    const ctActions = createCtActions(mockShipmentResponse, mockCtPayment);
    ctActions.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });
});

describe('createShipment', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should prepare params, call mollie, handle response and return actions', async () => {
    const mockShipmentParams = { orderId: 'ord_qzwg9x', lines: [{ id: 'odl_1.tlaa3w', quantity: 2, amount: { value: '1.42', currency: 'EUR' } }] };
    const mockCtPayment = {
      key: 'ord_qzwg9x',
      transactions: [
        {
          type: 'Charge',
          state: 'Initial',
          custom: {
            fields: {
              lineIds: '3e632c95-8dc6-459a-9edc-5e64760abf21',
            },
          },
        },
      ],
    };
    const mockShipmentResponse: any = {
      resource: 'shipment',
      id: 'shp_t72vlb',
      orderId: 'ord_qzwg9x',
      createdAt: '2021-10-27T10:25:24+00:00',
      lines: [
        {
          id: 'odl_1.tlaa3w',
          orderId: 'ord_3uwvfd',
          name: 'Banaan',
          metadata: { cartLineItemId: '3e632c95-8dc6-459a-9edc-5e64760abf21' },
          quantity: 2,
          totalAmount: { value: '1.42', currency: 'EUR' },
        },
      ],
    };
    const mollieClient = {
      orders_shipments: { create: jest.fn().mockResolvedValueOnce(mockShipmentResponse) },
      orders: { get: jest.fn().mockResolvedValueOnce(mockShipmentResponse) },
    } as any;

    const createShipmentRes = await createShipment(mockCtPayment as Required<CTPayment>, mollieClient);
    expect(mollieClient.orders_shipments.create).toHaveBeenCalledWith(mockShipmentParams);
    expect(createShipmentRes.actions).toHaveLength(5);
    expect(createShipmentRes.status).toBe(201);
  });
  it('Should return commercetools formated error with message if call to mollie api fails', async () => {
    const mockExtensionError = {
      code: 'General',
      message: 'Cannot make shipment.',
    };
    const mollieClient = { orders_shipments: { create: jest.fn().mockRejectedValueOnce(new Error('Cannot make shipment.')) } } as any;

    const createShipmentRes = await createShipment({ key: 'ord_123' } as Required<CTPayment>, mollieClient);
    const { errors, status } = createShipmentRes;
    expect(status).toBe(400);
    expect(errors).toHaveLength(1);
    const error = errors?.[0] ?? {};
    expect(error).toMatchObject(mockExtensionError);
  });
});
