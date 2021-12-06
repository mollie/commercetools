import { MollieClient } from '@mollie/api-client';
import { Request, Response } from 'express';
import { mocked } from 'ts-jest/utils';
import actions from '../../../src/requestHandlers/actions';
import handleRequest, { processAction } from '../../../src/requestHandlers/handleRequest';
import { determineAction } from '../../../src/requestHandlers/determineAction/determineAction';
import { formatExtensionErrorResponse } from '../../../src/errorHandlers/formatExtensionErrorResponse';
import { ControllerAction, CTEnumErrors } from '../../../src/types/index';
import * as ut from '../../../src/utils';
import Logger from '../../../src/logger/logger';

jest.mock('../../../src/requestHandlers/actions');
jest.mock('../../../src/requestHandlers/determineAction/determineAction');
jest.mock('../../../src/errorHandlers/formatExtensionErrorResponse');
jest.mock('../../../src/utils');

describe('handleRequest', () => {
  const req = {} as Request;
  const res = {} as Response;

  const mockStatus = jest.fn().mockReturnValue(res);
  const mockSend = jest.fn().mockReturnValue(res);
  const mockEnd = jest.fn();
  const mockLogError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    res.status = mockStatus;
    res.send = mockSend;
    res.end = mockEnd;
    req.path = '/';
    req.method = 'POST';
    Logger.error = mockLogError;
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should return a list of actions and status 200 when processed action returns successfully', async () => {
    mocked(determineAction).mockReturnValueOnce({ action: ControllerAction.GetPaymentMethods, errorMessage: '' });
    mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(true);
    mocked(actions.getPaymentMethods).mockResolvedValue({ status: 200, actions: [{ action: 'update' }] });

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockSend).toHaveBeenCalledWith({ actions: [{ action: 'update' }] });
  });

  it('should return status 200 if when the action is NoAction', async () => {
    mocked(determineAction).mockReturnValueOnce({ action: ControllerAction.NoAction, errorMessage: '' });

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should return status 200 if payment interface is not mollie', async () => {
    mocked(determineAction).mockReturnValueOnce({ action: ControllerAction.GetPaymentMethods, errorMessage: '' });
    mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(false);

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should return status 400 if the request path is not /', async () => {
    req.path = '/something';

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should return status 405 Method Not Allowed if the request method is not POST', async () => {
    req.method = 'DELETE';

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenCalledWith(405);
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('should return 400 and the correct error message if the incoming payment object incorrectly tries to trigger an action', async () => {
    mocked(determineAction).mockReturnValueOnce({
      action: ControllerAction.NoAction,
      errorMessage: 'Invalid paymentMethodInfo.method cash. Payment method must be set in order to make and manage payment transactions',
    });
    mocked(formatExtensionErrorResponse).mockReturnValueOnce({
      status: 400,
      errors: [
        {
          code: CTEnumErrors.InvalidInput,
          message: 'Invalid paymentMethodInfo.method cash. Payment method must be set in order to make and manage payment transactions',
        },
      ],
    });

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenLastCalledWith(400);
    expect(mockSend).toHaveBeenLastCalledWith({
      errors: [
        {
          code: 'InvalidInput',
          message: 'Invalid paymentMethodInfo.method cash. Payment method must be set in order to make and manage payment transactions',
        },
      ],
    });
  });

  it('should return status 400 and an array of formatted errors if an error happens whilst processing actions', async () => {
    mocked(determineAction).mockReturnValueOnce({ action: ControllerAction.GetPaymentMethods, errorMessage: '' });
    mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(true);
    mocked(actions.getPaymentMethods).mockResolvedValue({
      status: 400,
      errors: [
        {
          code: CTEnumErrors.Unauthorized,
          message: 'API Key error',
        },
      ],
    });

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockSend).toHaveBeenCalledWith({
      errors: [
        {
          code: CTEnumErrors.Unauthorized,
          message: 'API Key error',
        },
      ],
    });
  });

  it('should catch and handle errors and return a general error response to CT', async () => {
    const mockError = new Error('Something went wrong');
    mockError.name = 'Big error';
    mocked(determineAction).mockReturnValueOnce({ action: ControllerAction.GetPaymentMethods, errorMessage: '' });
    mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(true);
    mocked(actions.getPaymentMethods).mockRejectedValue({ name: 'Big error', message: 'Something went wrong' });

    await handleRequest(req, res);
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockSend).toHaveBeenCalledWith({
      errors: [
        {
          code: CTEnumErrors.General,
          message: 'error_name: Big error, error_message: Something went wrong',
        },
      ],
    });
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});

describe('processActions', () => {
  it('should call GetPaymentMethods if the action is GetPaymentMethods', async () => {
    const mockedGetPaymentMethods = mocked(actions.getPaymentMethods);
    await processAction(ControllerAction.GetPaymentMethods, {}, {} as MollieClient);
    expect(mockedGetPaymentMethods).toBeCalledTimes(1);
  });
  it('should call CreateOrder if the action is CreateOrder', async () => {
    const mockedCreateOrder = mocked(actions.createOrder);
    await processAction(ControllerAction.CreateOrder, {}, {} as MollieClient);
    expect(mockedCreateOrder).toBeCalledTimes(1);
  });
  it('should call CreateOrderPayment if the action is CreateOrderPayment', async () => {
    const mockedCreateOrderPayment = mocked(actions.createOrderPayment);
    await processAction(ControllerAction.CreateOrderPayment, {}, {} as MollieClient);
    expect(mockedCreateOrderPayment).toBeCalledTimes(1);
  });
  it('should call CreateShipment if the action is CreateShipment', async () => {
    const mockedCreateShipment = mocked(actions.createShipment);
    await processAction(ControllerAction.CreateShipment, {}, {} as MollieClient);
    expect(mockedCreateShipment).toBeCalledTimes(1);
  });
  it('should call UpdateShipment if the action is UpdateShipment', async () => {
    const mockedUpdateShipment = mocked(actions.updateShipment);
    await processAction(ControllerAction.UpdateShipment, {}, {} as MollieClient);
    expect(mockedUpdateShipment).toBeCalledTimes(1);
  });
  it('should call CancelOrder if the action is CancelOrder', async () => {
    const mockedCancelOrder = mocked(actions.cancelOrder);
    await processAction(ControllerAction.CancelOrder, {}, {} as MollieClient);
    expect(mockedCancelOrder).toBeCalledTimes(1);
  });
  it('should call CreateOrderRefund if the action is CreateOrderRefund', async () => {
    const mockedCreateOrderRefund = mocked(actions.createOrderRefund);
    await processAction(ControllerAction.CreateOrderRefund, {}, {} as MollieClient);
    expect(mockedCreateOrderRefund).toBeCalledTimes(1);
  });
  it('should return status 200 and empty actions, (for now), if the action is createCustomRefund', async () => {
    const mockedCreateCustomRefund = mocked(actions.createCustomRefund);
    const result = await processAction(ControllerAction.CreateCustomRefund, {}, {} as MollieClient);
    expect(mockedCreateCustomRefund).toBeCalledTimes(1);
  });
  it('should return an error if the action does not exist', async () => {
    const expectedError = {
      status: 400,
      errors: [{ code: 'InvalidOperation', message: 'Error processing request, please check request and try again' }],
    };
    const processActionResult = await processAction('nonExistingActionString' as ControllerAction, {}, {} as MollieClient);
    expect(processActionResult).toEqual(expectedError);
  });
});
