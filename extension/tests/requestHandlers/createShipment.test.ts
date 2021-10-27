import createShipment, { getShipmentParams } from '../../src/requestHandlers/createShipment';

describe('getShipmentParams', () => {
  const mockConsoleError = jest.fn();
  beforeEach(() => {
    console.error = mockConsoleError;
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
      field: 'createOrderResponse,createShipmentRequest',
    };
    await expect(getShipmentParams(mockedCtObj)).rejects.toEqual(expectedRejectedValue);
    expect(mockConsoleError).toHaveBeenCalledTimes(1);
  });
});
// describe('createShipment', () => {
// To be be added when createShipment functionality is done
// });
