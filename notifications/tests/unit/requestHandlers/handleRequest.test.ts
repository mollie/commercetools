import { Payment, Order } from '@mollie/api-client';
import { CTPayment } from '../../../src/types/ctPaymentTypes';
import actions from '../../../src/requestHandlers/index';
import handleRequest from '../../../src/requestHandlers/handleRequest';
import Logger from '../../../src/logger/logger';
import { HandleRequestInput } from '../../../src/types/requestHandlerTypes';

jest.mock('../../../src/requestHandlers/index');

describe('handleRequest', () => {
  const mockPaymentId = 'tr_1234';
  const mockOrderId = 'ord_1234';
  const mockMolliePayment = {
    id: mockPaymentId,
    status: 'paid',
  } as Payment;
  const mockMollieOrder = {
    id: mockOrderId,
    status: 'paid',
    _embedded: {
      payments: [mockMolliePayment],
    },
  } as Order;

  const mockCTPayment = {
    id: '85fdcccf-bfa1-4d4d-82fb-0350e494824a',
    key: mockOrderId,
    version: 2,
    custom: {
      fields: {
        mollieOrderStatus: 'created',
      },
    },
    transactions: [
      {
        id: 'b83b650d-a579-4a53-a74c-e1911b0feacd',
        state: 'Initial',
        interactionId: mockPaymentId,
      },
    ],
  } as CTPayment;

  const mockmGetOrderDetailsById = jest.fn().mockResolvedValue(mockMollieOrder);
  const mockmGetPaymentDetailsById = jest.fn().mockResolvedValue(mockMolliePayment);
  const mockctGetPaymentDetailsByKey = jest.fn().mockResolvedValue(mockCTPayment);
  const mockctUpdatePaymentDetailsByKey = jest.fn();

  actions.mGetOrderDetailsById = mockmGetOrderDetailsById;
  actions.mGetPaymentDetailsById = mockmGetPaymentDetailsById;
  actions.ctGetPaymentByKey = mockctGetPaymentDetailsByKey;
  actions.ctUpdatePaymentByKey = mockctUpdatePaymentDetailsByKey;

  const mockLogError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Logger.error = mockLogError;
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  // Error
  it('should return 400 if webhook is called with a path that is not /', async () => {
    const mockInput = {
      httpPath: '/another-path',
    } as HandleRequestInput;

    const res = await handleRequest(mockInput);
    expect(res.status).toBe(400);
  });

  it('should return 405 if webhook is called with a method other than POST', async () => {
    const mockInput = {
      httpPath: '/',
      httpMethod: 'DELETE',
    } as HandleRequestInput;

    const res = await handleRequest(mockInput);
    expect(res.status).toBe(405);
  });

  it('should log 400 when webhook is triggered with an invalid resource id and return 200', async () => {
    const mockInput: HandleRequestInput = {
      httpPath: '/',
      httpMethod: 'POST',
      httpBody: {
        id: 'resource',
      },
    };

    const res = await handleRequest(mockInput);
    expect(res.status).toBe(200);
  });
});
