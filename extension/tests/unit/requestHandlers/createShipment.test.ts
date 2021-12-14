import { mocked } from 'ts-jest/utils';
import { Action, CTPayment, CTShipment } from '../../../src/types';
import createShipment, { getShipmentParams, createCtActions } from '../../../src/requestHandlers/createShipment';
import { createDateNowString } from '../../../src/utils';
import Logger from '../../../src/logger/logger';

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
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          createCapture: '{}',
        },
      },
    };
    const expectedCreateShipmentParams = {
      orderId: 'ord_3uwvfd',
    };
    await expect(getShipmentParams(mockedCtObj)).resolves.toEqual(expectedCreateShipmentParams);
  });
  it('Should create all optional params for mollie createShipment call', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          createCapture: '{"lines":[{"id":"testCartLineItemId","quantity":3}]}',
        },
      },
    };
    const expectedCreateShipmentParams = {
      orderId: 'ord_3uwvfd',
      lines: [{ id: 'testCartLineItemId', quantity: 3 }],
    };
    await expect(getShipmentParams(mockedCtObj)).resolves.toEqual(expectedCreateShipmentParams);
  });
  it('Should return 400 and error message if creating the parameters throws an error', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          createShipmentRequest: '',
        },
      },
    };
    const expectedRejectedValue = {
      status: 400,
      title: 'Could not make parameters needed to create Mollie shipment.',
      field: 'createShipmentRequest',
    };
    await expect(getShipmentParams(mockedCtObj)).rejects.toEqual(expectedRejectedValue);
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});
describe('createCtActions', () => {
  beforeEach(() => {
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create correct ct actions from request and mollies payment', () => {
    const mockedCtObject = {
      custom: {
        fields: {
          createCapture: '{"lines":[{"id":"odl_1.d8ck99","quantity":1}]}',
        },
      },
    };
    const mockedShipmentResponse: any = {
      resource: 'shipment',
      id: 'shp_t72vlb',
      orderId: 'ord_qzwg9x',
      createdAt: '2021-10-27T10:25:24+00:00',
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.d8ck99',
          orderId: 'ord_qzwg9x',
          name: 'orange',
          sku: null,
          type: 'physical',
          status: 'completed',
          isCancelable: false,
          quantity: 1,
          vatRate: '20.00',
          createdAt: '2021-10-27T10:02:36+00:00',
        },
      ],
    };
    const ctActions = createCtActions(mockedShipmentResponse, mockedCtObject);
    ctActions.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });
});

describe('createShipment', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should prepare params, call mollie, handle response and return actions', async () => {
    const mockedShipmentParams = { orderId: 'ord_qzwg9x', lines: [{ id: 'odl_1.d8ck99', quantity: 1 }] };
    const mockedCtObject: CTShipment = {
      key: 'ord_qzwg9x',
      custom: {
        fields: {
          createCapture: '{"lines":[{"id":"odl_1.d8ck99","quantity":1}]}',
        },
      },
    };
    const mockedShipmentResponse: any = {
      resource: 'shipment',
      id: 'shp_t72vlb',
      orderId: 'ord_qzwg9x',
      createdAt: '2021-10-27T10:25:24+00:00',
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.d8ck99',
          orderId: 'ord_qzwg9x',
          name: 'orange',
          sku: null,
          type: 'physical',
          status: 'completed',
          isCancelable: false,
          quantity: 1,
          vatRate: '20.00',
          createdAt: '2021-10-27T10:02:36+00:00',
        },
      ],
    };
    const mollieClient = { orders_shipments: { create: jest.fn().mockResolvedValueOnce(mockedShipmentResponse) } } as any;

    const createShipmentRes = await createShipment(mockedCtObject, mollieClient);
    expect(mollieClient.orders_shipments.create).toHaveBeenCalledWith(mockedShipmentParams);
    expect(createShipmentRes.actions).toHaveLength(2);
    expect(createShipmentRes.status).toBe(201);
  });
  it('Should return commercetools formated error if one of the functions fails', async () => {
    const mockedError = { status: 400, title: 'Could not make parameters needed to create Mollie shipment.', field: 'createShipmentRequest' };
    // const getShipmentParams = jest.fn().mockRejectedValueOnce(mockedError);
    // const createCtActions = jest.fn();
    const mollieClient = { orders_shipments: { create: jest.fn() } } as any;

    const createShipmentRes = await createShipment({} as CTShipment, mollieClient);
    expect(createShipmentRes.status).toBe(400);
    expect(createShipmentRes.errors).toHaveLength(1);
  });
});
