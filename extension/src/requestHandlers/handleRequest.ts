import { MollieClient } from '@mollie/api-client';
import { CTUpdatesRequestedResponse, ControllerAction, CTEnumErrors, HandleRequestInput, HandleRequestSuccess, HandleRequestFailure, HandleRequestOutput, Action } from '../types/index';
import actions from './actions';
import { determineAction } from './determineAction/determineAction';
import formatErrorResponse from '../errorHandlers';
import { getCreateOrderParams, createCtActions as createOrderActions } from './createOrder';
import { getOrdersPaymentsParams, createCtActions as createOrderPaymentActions } from './createOrderPayment';
import { getCancelOrderParams, createCtActions as cancelOrderActions } from './cancelOrder';
import Logger from '../logger/logger';
import { initialiseMollieClient, initialiseCommercetoolsClient } from '../client';
import { isMolliePaymentInterface } from '../utils';
import { checkAuthorizationHeader } from '../authentication/authenticationHandler';

const commercetoolsClient = initialiseCommercetoolsClient();
const mollieClient = initialiseMollieClient();

export default async function handleRequest(input: HandleRequestInput): Promise<HandleRequestOutput> {
  Logger.debug('handleRequest : input : ' + JSON.stringify(input));
  const { isValid, message } = checkAuthorizationHeader(input.headers);
  if (!isValid) {
    Logger.error(message);
    return new HandleRequestFailure(400, [{ code: CTEnumErrors.Unauthorized, message: message }]);
  }

  if ((input.httpPath ?? '/') !== '/') {
    Logger.http(`Path ${input.httpPath} not allowed`);
    return new HandleRequestFailure(400);
  }
  if ((input.httpMethod ?? 'POST') !== 'POST') {
    Logger.http(`Method ${input.httpMethod} not allowed`);
    return new HandleRequestFailure(405);
  }

  const result = JSON.parse(JSON.stringify(input.httpBody));
  try {
    const ctPaymentObject = input.httpBody?.resource?.obj ?? result.httpBody?.resource?.obj;
    if (!isMolliePaymentInterface(ctPaymentObject)) {
      Logger.debug('Payment interface is not Mollie, ending request');
      return new HandleRequestSuccess(200);
    }

    const { action, errorMessage } = determineAction(ctPaymentObject);
    if (errorMessage) {
      Logger.debug(errorMessage);
      const { status, errors } = formatErrorResponse({ message: errorMessage, status: 400 });
      return new HandleRequestFailure(status, errors);
    }

    if (action === ControllerAction.NoAction) {
      Logger.debug('No action, ending request');
      return new HandleRequestSuccess(200);
    }

    const { actions, errors, status } = await processAction(action, ctPaymentObject, mollieClient, commercetoolsClient);
    if (errors?.length) {
      Logger.debug('Process action errors');
      return new HandleRequestFailure(status, errors);
    } else {
      return new HandleRequestSuccess(status, actions);
    }
  } catch (error: any) {
    // TODO - check this does not expose PII in stacktrace
    Logger.error({ error });
    // From Node's Error object: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
    const errorMessage = `error_name: ${error.name}, error_message: ${error.message}`;
    return new HandleRequestFailure(400, [{ code: CTEnumErrors.General, message: errorMessage, extensionExtraInfo: undefined }]);
  }
}

const processAction = async function (action: ControllerAction, ctPaymentObject: any, mollieClient: MollieClient, commercetoolsClient: any) {
  let result = {} as CTUpdatesRequestedResponse;
  Logger.debug('processAction : action : ' + JSON.stringify(action));
  switch (action) {
    case ControllerAction.GetPaymentMethods:
      Logger.debug(`action: ${ControllerAction.GetPaymentMethods}`);
      result = await actions.getPaymentMethods(ctPaymentObject, mollieClient);
      break;
    case ControllerAction.CreateOrder:
      Logger.debug(`action: ${ControllerAction.CreateOrder}`);
      result = await actions.createOrder(ctPaymentObject, mollieClient, commercetoolsClient, getCreateOrderParams, createOrderActions);
      break;
    case ControllerAction.CreateOrderPayment:
      Logger.debug(`action: ${ControllerAction.CreateOrderPayment}`);
      result = await actions.createOrderPayment(ctPaymentObject, mollieClient, getOrdersPaymentsParams, createOrderPaymentActions);
      break;
    case ControllerAction.CreateShipment:
      Logger.debug(`action: ${ControllerAction.CreateShipment}`);
      result = await actions.createShipment(ctPaymentObject, mollieClient);
      break;
    case ControllerAction.CreateCustomRefund:
      Logger.debug(`action: ${ControllerAction.CreateCustomRefund}`);
      result = await actions.createCustomRefund(ctPaymentObject, mollieClient);
      break;
    case ControllerAction.CancelOrder:
      Logger.debug(`action: ${ControllerAction.CancelOrder}`);
      result = await actions.cancelOrder(ctPaymentObject, mollieClient, getCancelOrderParams, cancelOrderActions);
      break;
    default:
      result = {
        status: 400,
        errors: [
          {
            code: CTEnumErrors.InvalidOperation,
            message: 'Error processing request, please check request and try again',
          },
        ],
      };
  }
  return result;
};

export { processAction };
