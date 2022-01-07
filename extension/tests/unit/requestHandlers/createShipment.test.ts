import { mocked } from 'ts-jest/utils';
import { CTPayment } from '../../../src/types';
import createShipment, { getShipmentParams, createCtActions } from '../../../src/requestHandlers/createShipment';
import { createDateNowString } from '../../../src/utils';
import Logger from '../../../src/logger/logger';
import { Order } from '@mollie/api-client';

jest.mock('../../../src/utils');

describe('getShipmentParams', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
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
          sku: '12345',
          metadata: { cartLineItemId: '3e632c95-8dc6-459a-9edc-5e64760abf21' },
          quantity: 2,
          totalAmount: { value: '1.42', currency: 'EUR' },
        },
        {
          id: 'odl_1.5zqqm',
          orderId: 'ord_3uwvfd',
          name: 'Apple',
          sku: '21345',
          metadata: { cartLineItemId: 'd02457cc-fceb-4588-9bdb-c93d4295b261' },
          quantity: 4,
          totalAmount: { value: '7.12', currency: 'EUR' },
        },
        {
          id: 'odl_1.6997yo',
          orderId: 'ord_3uwvfd',
          name: 'Gift wrapping service',
          sku: null,
          metadata: { cartCustomLineItemId: '31fb05cd-6e00-42b4-a25d-68cceef5a603' },
          quantity: 1,
          totalAmount: { value: '7.50', currency: 'EUR' },
        },
        {
          id: 'odl_1.cgark2',
          orderId: 'ord_3uwvfd',
          name: 'Shipping - Standard Shipping',
          sku: null,
          metadata: null,
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
});
// describe('createCtActions', () => {
//   beforeEach(() => {
//     mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
//   });
//   afterEach(() => {
//     jest.clearAllMocks();
//   });
//   it('Should create correct ct actions from request and mollies payment', () => {
//     const mockCtPaymentect = {
//       custom: {
//         fields: {
//           createCapture: '{"lines":[{"id":"odl_1.d8ck99","quantity":1}]}',
//         },
//       },
//     };
//     const mockedShipmentResponse: any = {
//       resource: 'shipment',
//       id: 'shp_t72vlb',
//       orderId: 'ord_qzwg9x',
//       createdAt: '2021-10-27T10:25:24+00:00',
//       lines: [
//         {
//           resource: 'orderline',
//           id: 'odl_1.d8ck99',
//           orderId: 'ord_qzwg9x',
//           name: 'orange',
//           sku: null,
//           type: 'physical',
//           status: 'completed',
//           quantity: 1,
//           vatRate: '20.00',
//           createdAt: '2021-10-27T10:02:36+00:00',
//         },
//       ],
//     };
//     const ctActions = createCtActions(mockedShipmentResponse, mockCtPaymentect);
//     ctActions.forEach(action => {
//       expect(action).toMatchSnapshot();
//     });
//   });
// });

// describe('createShipment', () => {
//   const mockLogError = jest.fn();
//   beforeEach(() => {
//     Logger.error = mockLogError;
//     mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
//   });
//   afterEach(() => {
//     jest.clearAllMocks();
//   });
//   it('Should prepare params, call mollie, handle response and return actions', async () => {
//     const mockedShipmentParams = { orderId: 'ord_qzwg9x', lines: [{ id: 'odl_1.d8ck99', quantity: 1 }] };
//     const mockCtPaymentect = {
//       key: 'ord_qzwg9x',
//       custom: {
//         fields: {
//           createCapture: '{"lines":[{"id":"odl_1.d8ck99","quantity":1}]}',
//         },
//       },
//     };
//     const mockedShipmentResponse: any = {
//       resource: 'shipment',
//       id: 'shp_t72vlb',
//       orderId: 'ord_qzwg9x',
//       createdAt: '2021-10-27T10:25:24+00:00',
//       lines: [
//         {
//           resource: 'orderline',
//           id: 'odl_1.d8ck99',
//           orderId: 'ord_qzwg9x',
//           name: 'orange',
//           sku: null,
//           type: 'physical',
//           status: 'completed',
//           quantity: 1,
//           vatRate: '20.00',
//           createdAt: '2021-10-27T10:02:36+00:00',
//         },
//       ],
//     };
//     const mollieClient = { orders_shipments: { create: jest.fn().mockResolvedValueOnce(mockedShipmentResponse) } } as any;

//     const createShipmentRes = await createShipment(mockCtPaymentect as CTPayment, mollieClient);
//     expect(mollieClient.orders_shipments.create).toHaveBeenCalledWith(mockedShipmentParams);
//     expect(createShipmentRes.actions).toHaveLength(2);
//     expect(createShipmentRes.status).toBe(201);
//   });
//   it('Should return commercetools formated error with message if call to mollie api fails', async () => {
//     const mockedExtensionError = {
//       code: 'General',
//       message: 'Cannot make shipment.',
//     };
//     const mollieClient = { orders_shipments: { create: jest.fn().mockRejectedValueOnce(new Error('Cannot make shipment.')) } } as any;

//     const createShipmentRes = await createShipment({ key: 'ord_123' } as CTPayment, mollieClient);
//     const { errors, status } = createShipmentRes;
//     expect(status).toBe(400);
//     expect(errors).toHaveLength(1);
//     const error = errors?.[0] ?? {};
//     expect(error).toMatchObject(mockedExtensionError);
//   });
// });
