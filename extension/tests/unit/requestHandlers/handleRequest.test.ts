import { MollieClient } from '@mollie/api-client';
import actions from '../../../src/requestHandlers/actions';
import handleRequest, { processAction } from '../../../src/requestHandlers/handleRequest';
import { determineAction } from '../../../src/requestHandlers/determineAction/determineAction';
import formatExtensionErrorResponse from '../../../src/errorHandlers';
import { ControllerAction, CTEnumErrors, HandleRequestFailure, HandleRequestInput, HandleRequestSuccess } from '../../../src/types/index';
import { checkAuthorizationHeader } from '../../../src/authentication/authenticationHandler';
import * as ut from '../../../src/utils';
import Logger from '../../../src/logger/logger';

jest.mock('../../../src/requestHandlers/actions');
jest.mock('../../../src/requestHandlers/determineAction/determineAction');
jest.mock('../../../src/errorHandlers');
jest.mock('../../../src/utils');
jest.mock('../../../src/authentication/authenticationHandler');

describe('handleRequest', () => {
  let reqInput = {} as HandleRequestInput;
  const mockLogError = jest.fn();
  const mockLogDebug = jest.fn();

  beforeAll(() => {
    jest.mocked(checkAuthorizationHeader).mockImplementation(() => {
      return {
        isValid: true,
        message: '',
      };
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    reqInput = new HandleRequestInput('/', 'POST', {});
    Logger.error = mockLogError;
    Logger.debug = mockLogDebug;
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('2xx - Happy Path', () => {
    it('should return a list of actions and status 200 when processed action returns successfully', async () => {
      jest.mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(true);
      jest.mocked(determineAction).mockReturnValueOnce({ action: ControllerAction.GetPaymentMethods, errorMessage: '' });
      jest.mocked(actions.getPaymentMethods).mockResolvedValueOnce({ status: 200, actions: [{ action: 'update' }] });

      const result = (await handleRequest(reqInput)) as HandleRequestSuccess;

      expect(result.status).toBe(200);
      expect(result.actions).toStrictEqual([{ action: 'update' }]);
    });

    it('should return status 200 if when the action is NoAction', async () => {
      jest.mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(true);
      jest.mocked(determineAction).mockReturnValueOnce({ action: ControllerAction.NoAction, errorMessage: '' });

      const result = await handleRequest(reqInput);

      expect(result.status).toBe(200);
    });

    it('should return status 200 if payment interface is not mollie', async () => {
      jest.mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(false);

      const result = await handleRequest(reqInput);

      expect(result.status).toBe(200);
    });
  });

  describe('4xx - Unhappy Path - API extension called incorrectly', () => {
    it('should return status 400 if the request path is not /', async () => {
      reqInput.httpPath = '/something';

      const result = await handleRequest(reqInput);

      expect(result.status).toBe(400);
    });

    it('should return status 405 Method Not Allowed if the request method is not POST', async () => {
      reqInput.httpMethod = 'DELETE';

      const result = await handleRequest(reqInput);

      expect(result.status).toBe(405);
    });
  });

  describe('4xx - Unhappy Path - Error processing action', () => {
    it('should return 400 and the correct error message if the incoming payment object incorrectly tries to trigger an action', async () => {
      jest.mocked(determineAction).mockReturnValueOnce({
        action: ControllerAction.NoAction,
        errorMessage: 'Invalid paymentMethodInfo.method cash. Payment method must be set in order to make and manage payment transactions',
      });
      jest.mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(true);
      jest.mocked(formatExtensionErrorResponse).mockReturnValueOnce({
        status: 400,
        errors: [
          {
            code: CTEnumErrors.InvalidInput,
            message: 'Invalid paymentMethodInfo.method cash. Payment method must be set in order to make and manage payment transactions',
          },
        ],
      });

      const result = (await handleRequest(reqInput)) as HandleRequestFailure;

      expect(result.status).toBe(400);
      expect(result.errors).toStrictEqual([
        {
          code: 'InvalidInput',
          message: 'Invalid paymentMethodInfo.method cash. Payment method must be set in order to make and manage payment transactions',
        },
      ]);
    });

    it('should return status 400 and an array of formatted errors if an error happens whilst processing actions', async () => {
      jest.mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(true);
      jest.mocked(determineAction).mockReturnValueOnce({ action: ControllerAction.GetPaymentMethods, errorMessage: '' });
      jest.mocked(actions.getPaymentMethods).mockResolvedValue({
        status: 400,
        errors: [
          {
            code: CTEnumErrors.Unauthorized,
            message: 'API Key error',
          },
        ],
      });

      const result = (await handleRequest(reqInput)) as HandleRequestFailure;

      expect(result.status).toBe(400);
      expect(result.errors).toStrictEqual([
        {
          code: CTEnumErrors.Unauthorized,
          message: 'API Key error',
        },
      ]);
    });

    it('should catch and handle errors and return a general error response to CT', async () => {
      const mockError = new Error('Something went wrong');
      mockError.name = 'Big error';
      jest.mocked(ut.isMolliePaymentInterface).mockReturnValueOnce(true);
      jest.mocked(determineAction).mockReturnValueOnce({ action: ControllerAction.GetPaymentMethods, errorMessage: '' });
      jest.mocked(actions.getPaymentMethods).mockRejectedValue({ name: 'Big error', message: 'Something went wrong' });

      const result = (await handleRequest(reqInput)) as HandleRequestFailure;

      expect(result.status).toBe(400);
      expect(result.errors).toEqual([
        {
          code: CTEnumErrors.General,
          message: 'error_name: Big error, error_message: Something went wrong',
        },
      ]);
      expect(mockLogError).toHaveBeenCalledTimes(1);
    });
  });
});

describe('processActions', () => {
  const mockedMollieClient = {} as MollieClient;
  const mockedCommercetoolsClient = {} as any;

  it('should call GetPaymentMethods if the action is GetPaymentMethods', async () => {
    const mockedGetPaymentMethods = jest.mocked(actions.getPaymentMethods);
    await processAction(ControllerAction.GetPaymentMethods, {}, mockedMollieClient, mockedCommercetoolsClient);
    expect(mockedGetPaymentMethods).toBeCalledTimes(1);
  });
  it('should call CreateOrder if the action is CreateOrder', async () => {
    const mockedCreateOrder = jest.mocked(actions.createOrder);
    await processAction(ControllerAction.CreateOrder, {}, mockedMollieClient, mockedCommercetoolsClient);
    expect(mockedCreateOrder).toBeCalledTimes(1);
  });
  it('should call CreateOrderPayment if the action is CreateOrderPayment', async () => {
    const mockedCreateOrderPayment = jest.mocked(actions.createOrderPayment);
    await processAction(ControllerAction.CreateOrderPayment, {}, mockedMollieClient, mockedCommercetoolsClient);
    expect(mockedCreateOrderPayment).toBeCalledTimes(1);
  });
  it('should call CreateShipment if the action is CreateShipment', async () => {
    const mockedCreateShipment = jest.mocked(actions.createShipment);
    await processAction(ControllerAction.CreateShipment, {}, mockedMollieClient, mockedCommercetoolsClient);
    expect(mockedCreateShipment).toBeCalledTimes(1);
  });
  it('should call CancelOrder if the action is CancelOrder', async () => {
    const mockedCancelOrder = jest.mocked(actions.cancelOrder);
    await processAction(ControllerAction.CancelOrder, {}, mockedMollieClient, mockedCommercetoolsClient);
    expect(mockedCancelOrder).toBeCalledTimes(1);
  });
  it('should return status 200 and empty actions, (for now), if the action is createCustomRefund', async () => {
    const mockedCreateCustomRefund = jest.mocked(actions.createCustomRefund);
    const result = await processAction(ControllerAction.CreateCustomRefund, {}, mockedMollieClient, mockedCommercetoolsClient);
    expect(mockedCreateCustomRefund).toBeCalledTimes(1);
  });
  it('should return an error if the action does not exist', async () => {
    const expectedError = {
      status: 400,
      errors: [
        {
          code: 'InvalidOperation',
          message: 'Error processing request, please check request and try again',
        },
      ],
    };
    const processActionResult = await processAction('nonExistingActionString' as ControllerAction, {}, mockedMollieClient, mockedCommercetoolsClient);
    expect(processActionResult).toEqual(expectedError);
  });
});
