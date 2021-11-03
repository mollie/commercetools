import { mocked } from 'ts-jest/utils';
import { Action } from '../../src/types';
import createShipment, { getShipmentParams, createCtActions } from '../../src/requestHandlers/createShipment';
import { createDateNowString } from '../../src/utils';
import Logger from '../../src/logger/logger';

jest.mock('../../src/utils');

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
          createShipmentRequest: '{}',
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
          createShipmentRequest:
            '{"lines":[{"id":"test_id","quantity":1,"amount":{}}],"tracking":{"carrier":"PostNL","code":"3SKABA000000000","url":"http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C"}}',
        },
      },
    };
    const expectedCreateShipmentParams = {
      orderId: 'ord_3uwvfd',
      lines: [{ id: 'test_id', quantity: 1, amount: {} }],
      tracking: { carrier: 'PostNL', code: '3SKABA000000000', url: 'http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C' },
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
          createShipmentRequest:
            '{"lines":[{"id":"odl_1.d8ck99","quantity":1}],"tracking":{"carrier":"PostNL","code":"3SKABA000000000","url":"http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C"}}',
        },
      },
    };
    const mockedShipmentResponse: any = {
      resource: 'shipment',
      id: 'shp_t72vlb',
      orderId: 'ord_qzwg9x',
      createdAt: '2021-10-27T10:25:24+00:00',
      tracking: {
        carrier: 'PostNL',
        code: '3SKABA000000000',
        url: 'http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C',
      },
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
    console.error = mockLogError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should prepare params, call mollie, handle response and return actions', async () => {
    const mockedShipmentParams = { orderId: 'ord_qzwg9x' };
    const mockedCtObject = {
      custom: { fields: { createShipmentRequest: '{}' } },
    };
    const mockedShipmentResponse: any = {
      resource: 'shipment',
      id: 'shp_t72vlb',
      orderId: 'ord_qzwg9x',
      createdAt: '2021-10-27T10:25:24+00:00',
      tracking: {
        carrier: 'PostNL',
        code: '3SKABA000000000',
        url: 'http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C',
      },
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
    const mockedCtActions: Action[] = [];
    const getShipmentParams = jest.fn().mockResolvedValueOnce(mockedShipmentParams);
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);
    const mollieClient = { orders_shipments: { create: jest.fn().mockResolvedValueOnce(mockedShipmentResponse) } } as any;

    const createShipmentRes = await createShipment(mockedCtObject, mollieClient, getShipmentParams, createCtActions);
    expect(getShipmentParams).toBeCalledWith(mockedCtObject);
    expect(mollieClient.orders_shipments.create).toHaveBeenCalledWith(mockedShipmentParams);
    expect(createCtActions).toBeCalledWith(mockedShipmentResponse, mockedCtObject);
    expect(createShipmentRes.status).toBe(201);
  });
  it('Should return commercetools formated error if one of the functions fails', async () => {
    const mockedError = { status: 400, title: 'Could not make parameters needed to create Mollie shipment.', field: 'createShipmentRequest' };
    const getShipmentParams = jest.fn().mockRejectedValueOnce(mockedError);
    const createCtActions = jest.fn();
    const mollieClient = { orders_shipments: { create: jest.fn() } } as any;

    const createShipmentRes = await createShipment({}, mollieClient, getShipmentParams, createCtActions);
    expect(createShipmentRes.status).toBe(400);
    expect(createShipmentRes.errors).toHaveLength(1);
  });
});
