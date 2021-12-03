import { mocked } from 'ts-jest/utils';
import { Action } from '../../../src/types';
import updateShipment, { getShipmentParams, createCtActions } from '../../../src/requestHandlers/updateShipment';
import { createDateNowString } from '../../../src/utils';
import Logger from '../../../src/logger/logger';

jest.mock('../../../src/utils');

describe('getShipmentParams', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should create all params for mollie updateShipment call', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          updateShipmentRequest: '{"shipmentId":"shp_dhq5l7","tracking":{"carrier":"PostNL","code":"3SKABA000000000","url":"http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C"}}',
        },
      },
    };
    const expectedUpdateShipmentParams = {
      shipmentId: 'shp_dhq5l7',
      updateParams: {
        orderId: 'ord_3uwvfd',
        tracking: {
          carrier: 'PostNL',
          code: '3SKABA000000000',
          url: 'http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C',
        },
      },
    };
    await expect(getShipmentParams(mockedCtObj)).resolves.toEqual(expectedUpdateShipmentParams);
  });
  it('Should return 400 and error message if creating the parameters throws an error', async () => {
    const mockedCtObj = {
      key: 'ord_3uwvfd',
      custom: {
        fields: {
          updateShipmentRequest: '',
        },
      },
    };
    const expectedRejectedValue = {
      status: 400,
      title: 'Could not make parameters needed to update Mollie shipment.',
      field: 'updateShipmentRequest',
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
          updateShipmentRequest: '{"shipmentId":"shp_dhq5l7","tracking":{"carrier":"PostNL","code":"3SKABA000000000","url":"http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C"}}',
        },
      },
    };
    const mockedShipmentResponse: any = {
      resource: 'shipment',
      id: 'shp_dhq5l7',
      orderId: 'ord_3uwvfd',
      createdAt: '2021-10-28T14:30:25+00:00',
      tracking: {
        carrier: 'PostNL',
        code: '3SKABA000000000',
        url: 'http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C',
      },
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.juguf1',
          orderId: 'ord_3uwvfd',
          name: 'orange',
          sku: null,
          type: 'physical',
          status: 'completed',
          createdAt: '2021-10-28T14:20:27+00:00',
        },
      ],
    };
    const ctActions = createCtActions(mockedShipmentResponse, mockedCtObject);
    ctActions.forEach(action => {
      expect(action).toMatchSnapshot();
    });
  });
});

describe('updateShipment', () => {
  const mockLogError = jest.fn();
  beforeEach(() => {
    Logger.error = mockLogError;
    mocked(createDateNowString).mockReturnValue('2021-10-08T12:12:02.625Z');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('Should prepare params, call mollie, handle response and return actions', async () => {
    const mockedShipmentParams = {
      shipmentId: 'shp_dhq5l7',
      updateParams: {
        orderId: 'ord_3uwvfd',
        tracking: {
          carrier: 'PostNL',
          code: '3SKABA000000000',
          url: 'http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C',
        },
      },
    };
    const mockedCtObject = {
      custom: {
        fields: {
          updateShipmentRequest: '{"shipmentId":"shp_dhq5l7","tracking":{"carrier":"PostNL","code":"3SKABA000000000","url":"http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C"}}',
        },
      },
    };
    const mockedShipmentResponse: any = {
      resource: 'shipment',
      id: 'shp_dhq5l7',
      orderId: 'ord_3uwvfd',
      createdAt: '2021-10-28T14:30:25+00:00',
      tracking: {
        carrier: 'PostNL',
        code: '3SKABA000000000',
        url: 'http://postnl.nl/tracktrace/?B=3SKABA000000000&P=1015CW&D=NL&T=C',
      },
      lines: [
        {
          resource: 'orderline',
          id: 'odl_1.juguf1',
          orderId: 'ord_3uwvfd',
          name: 'orange',
          sku: null,
          type: 'physical',
          status: 'completed',
          createdAt: '2021-10-28T14:20:27+00:00',
        },
      ],
    };
    const mockedCtActions: Action[] = [];
    const getShipmentParams = jest.fn().mockResolvedValueOnce(mockedShipmentParams);
    const createCtActions = jest.fn().mockReturnValueOnce(mockedCtActions);
    const mollieClient = { orders_shipments: { update: jest.fn().mockResolvedValueOnce(mockedShipmentResponse) } } as any;

    const updateShipmentRes = await updateShipment(mockedCtObject, mollieClient, getShipmentParams, createCtActions);
    expect(getShipmentParams).toBeCalledWith(mockedCtObject);
    expect(mollieClient.orders_shipments.update).toHaveBeenCalledWith(mockedShipmentParams.shipmentId, mockedShipmentParams.updateParams);
    expect(createCtActions).toBeCalledWith(mockedShipmentResponse, mockedCtObject);
    expect(updateShipmentRes.status).toBe(200);
  });
  it('Should return commercetools formated error if one of the functions fails', async () => {
    const mockedError = { status: 400, title: 'Could not make parameters needed to update Mollie shipment.', field: 'updateShipmentRequest' };
    const getShipmentParams = jest.fn().mockRejectedValueOnce(mockedError);
    const createCtActions = jest.fn();
    const mollieClient = { orders_shipments: { update: jest.fn() } } as any;

    const updateShipmentRes = await updateShipment({}, mollieClient, getShipmentParams, createCtActions);
    expect(updateShipmentRes.status).toBe(400);
    expect(updateShipmentRes.errors).toHaveLength(1);
  });
});
