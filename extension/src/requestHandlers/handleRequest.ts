import { Request, Response } from 'express';
import { MollieClient } from '@mollie/api-client';
import { CTUpdatesRequestedResponse, ControllerAction, CTEnumErrors } from '../types/index';
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

export default async function handleRequest(req: Request, res: Response) {
  if (req.path !== '/') {
    Logger.http(`Path ${req.path} not allowed`);
    return res.status(400).end();
  }
  if (req.method !== 'POST') {
    Logger.http(`Method ${req.method} not allowed`);
    return res.status(405).end();
  }
  // TODO - authentication check - CMI-95,96,97
  try {
    const ctPaymentObject = req.body?.resource?.obj;
    if (!isMolliePaymentInterface(ctPaymentObject)) {
      Logger.debug('Payment interface is not Mollie, ending request');
      return res.status(200).end();
    }

    const { action, errorMessage } = determineAction(ctPaymentObject);
    if (errorMessage) {
      Logger.debug(errorMessage);
      const { status, errors } = formatExtensionErrorResponse(CTEnumErrors.InvalidInput, errorMessage);
      return res.status(status).send({ errors: errors });
    }

    if (action === ControllerAction.NoAction) {
      Logger.debug('No action, ending request');
      return res.status(200).end();
    }

    const { actions, errors, status } = await processAction(action, ctPaymentObject, mollieClient, commercetoolsClient);
    if (errors?.length) {
      Logger.debug('Process action errors');
      return res.status(status).send({ errors: errors });
    } else {
      return res.status(status).send({ actions: actions });
    }
  } catch (error: any) {
    // TODO - check this does not expose PII in stacktrace
    Logger.error({ error });
    // From Node's Error object: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
    const errorMessage = `error_name: ${error.name}, error_message: ${error.message}`;
    return res.status(400).send({
      errors: [{ code: 'General', message: errorMessage }],
    });
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
