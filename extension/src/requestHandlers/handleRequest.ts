import { MollieClient } from '@mollie/api-client';
import { CTUpdatesRequestedResponse, ControllerAction, CTEnumErrors, HandleRequestInput, HandleRequestSuccess, HandleRequestFailure, HandleRequestOutput } from '../types/index';
import actions from './actions';
import { determineAction } from './determineAction/determineAction';
import { formatExtensionErrorResponse } from '../errorHandlers/formatExtensionErrorResponse';
import { getOrdersPaymentsParams, createCtActions as createOrderPaymentActions } from './createOrderPayment';
import { getShipmentParams as getCreateShipmentParams, createCtActions as createShipmentActions } from './createShipment';
import { getShipmentParams as getUpdateShipmentParams, createCtActions as updateShipmentActions } from './updateShipment';
import { getCancelOrderParams, createCtActions as cancelOrderActions } from './cancelOrder';
import { createCtActions as createOrderRefundActions } from './createOrderRefund';
import Logger from '../logger/logger';
import { initialiseMollieClient, initialiseCommercetoolsClient } from '../client';
import { isMolliePaymentInterface } from '../utils';

const commercetoolsClient = initialiseCommercetoolsClient();
const mollieClient = initialiseMollieClient();

export default async function handleRequest(input: HandleRequestInput) : Promise<HandleRequestOutput> {
  if (input.httpPath !== '/') {
    Logger.http(`Path ${input.httpPath} not allowed`);
    return new HandleRequestFailure(400);
  }
  if (input.httpMethod !== 'POST') {
    Logger.http(`Method ${input.httpMethod} not allowed`);
    return new HandleRequestFailure(405);
  }
  // TODO - authentication check - CMI-95,96,97
  try {
    const ctPaymentObject = input.httpBody?.resource?.obj;
    if (!isMolliePaymentInterface(ctPaymentObject)) {
      Logger.debug('Payment interface is not Mollie, ending request');
      return new HandleRequestSuccess(200);
    }

    const { action, errorMessage } = determineAction(ctPaymentObject);
    if (errorMessage) {
      Logger.debug(errorMessage);
      const { status, errors } = formatExtensionErrorResponse(CTEnumErrors.InvalidInput, errorMessage);
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
    return new HandleRequestFailure(400, [{ code: CTEnumErrors.General, message: errorMessage, extensionExtraInfo: undefined }])
  }
}

const processAction = async function (action: ControllerAction, ctPaymentObject: any, mollieClient: MollieClient, commercetoolsClient: any) {
  let result = {} as CTUpdatesRequestedResponse;
  switch (action) {
    case ControllerAction.GetPaymentMethods:
      Logger.debug(`action: ${ControllerAction.GetPaymentMethods}`);
      result = await actions.getPaymentMethods(ctPaymentObject, mollieClient);
      break;
    case ControllerAction.CreateOrder:
      Logger.debug(`action: ${ControllerAction.CreateOrder}`);
      result = await actions.createOrder(ctPaymentObject, mollieClient, commercetoolsClient);
      break;
    case ControllerAction.CreateOrderPayment:
      Logger.debug(`action: ${ControllerAction.CreateOrderPayment}`);
      result = await actions.createOrderPayment(ctPaymentObject, mollieClient, getOrdersPaymentsParams, createOrderPaymentActions);
      break;
    case ControllerAction.CreateShipment:
      Logger.debug(`action: ${ControllerAction.CreateShipment}`);
      result = await actions.createShipment(ctPaymentObject, mollieClient, getCreateShipmentParams, createShipmentActions);
      break;
    case ControllerAction.UpdateShipment:
      Logger.debug(`action: ${ControllerAction.UpdateShipment}`);
      result = await actions.updateShipment(ctPaymentObject, mollieClient, getUpdateShipmentParams, updateShipmentActions);
      break;
    case ControllerAction.CreateOrderRefund:
      Logger.debug(`action: ${ControllerAction.CreateOrderRefund}`);
      result = await actions.createOrderRefund(ctPaymentObject, mollieClient, createOrderRefundActions);
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
