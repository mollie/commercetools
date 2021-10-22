import { Request, Response } from 'express';
import { Payment, Order } from '@mollie/api-client';
import { mocked } from 'ts-jest/utils';
import { CTPayment } from '../../src/types/ctPaymentTypes';
import actions from '../../src/requestHandlers/index';
import handleRequest from '../../src/requestHandlers/handleRequest';

jest.mock('../../src/requestHandlers/index');

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

  const res = {} as Response;
  const req = {} as Request;

  const mockStatus = jest.fn().mockReturnValue(res);
  const mockSend = jest.fn().mockReturnValue(res);
  const mockEnd = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    req.path = '/';

    res.status = mockStatus;
    res.send = mockSend;
    res.end = mockEnd;
  });

  it('should return 400 is webhook is triggered with an invalid resource id', async () => {
    req.body = {
      id: '00000',
    };
    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenLastCalledWith(400);
    expect(mockSend).toHaveBeenLastCalledWith('ID 00000 is invalid');
  });

  it('order webhook flow - should return 200 and make calls to updatePaymentByKey', async () => {
    req.body = {
      id: mockOrderId,
    };
    await handleRequest(req, res);

    // Should be called
    expect(actions.ctUpdatePaymentByKey).toHaveBeenCalledTimes(1);
    expect(actions.ctGetPaymentByKey).toHaveBeenCalledTimes(1);
    expect(actions.mGetOrderDetailsById).toHaveBeenCalledTimes(1);

    // Not called on order flow
    expect(actions.mGetPaymentDetailsById).toHaveBeenCalledTimes(0);

    expect(mockStatus).toHaveBeenLastCalledWith(200);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('payment webhook flow - should return 200 and make calls to updatePaymentByKey', async () => {
    req.body = {
      id: mockPaymentId,
    };
    await handleRequest(req, res);

    // Should be called
    expect(actions.ctUpdatePaymentByKey).toHaveBeenCalledTimes(1);
    expect(actions.ctGetPaymentByKey).toHaveBeenCalledTimes(1);
    expect(actions.mGetPaymentDetailsById).toHaveBeenCalledTimes(1);

    // Not called on order flow
    expect(actions.mGetOrderDetailsById).toHaveBeenCalledTimes(0);

    expect(mockStatus).toHaveBeenLastCalledWith(200);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if an error occurs', async () => {
    req.body = {
      id: mockPaymentId,
    };
    const updatePaymentByKeyFailure = jest.fn().mockRejectedValue(new Error());
    actions.ctUpdatePaymentByKey = updatePaymentByKeyFailure;
    const mockConsoleWarn = jest.fn();
    console.error = mockConsoleWarn;

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenLastCalledWith(400);
    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
  });
});
