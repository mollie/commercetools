import { Request, Response } from 'express';
import { Payment, Order } from '@mollie/api-client';
import { CTPayment } from '../../src/types/ctPaymentTypes';
import actions from '../../src/requestHandlers/index';
import handleRequest from '../../src/requestHandlers/handleRequest';
import Logger from '../../src/logger/logger';

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
  const mockLogError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    req.path = '/';
    req.method = 'POST';

    res.status = mockStatus;
    res.send = mockSend;
    res.end = mockEnd;
    Logger.error = mockLogError;
  });

  afterAll(() => {
    jest.resetAllMocks();
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
    expect(mockLogError).toHaveBeenCalledTimes(0);
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
    expect(mockLogError).toHaveBeenCalledTimes(0);
  });

  it('should return 400 if webhook is called with a path that is not /', async () => {
    req.path = '/another-path';

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenLastCalledWith(400);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should return 405 if webhook is called with a method other than POST', async () => {
    req.method = 'DELETE';

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenLastCalledWith(405);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should log 400 when webhook is triggered with an invalid resource id and return 200', async () => {
    req.body = {
      id: '00000',
    };
    await handleRequest(req, res);

    expect(mockLogError).toHaveBeenLastCalledWith('ID 00000 is invalid');
    expect(mockStatus).toHaveBeenLastCalledWith(200);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should log if an error occurs and return 200', async () => {
    req.body = {
      id: mockPaymentId,
    };
    const updatePaymentByKeyFailure = jest.fn().mockRejectedValue(new Error());
    actions.ctUpdatePaymentByKey = updatePaymentByKeyFailure;

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenLastCalledWith(200);
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});
