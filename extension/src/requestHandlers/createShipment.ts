import { isEmpty } from 'lodash';
import { MollieClient, ShipmentCreateParams, Shipment } from '@mollie/api-client';
import formatErrorResponse from '../errorHandlers';
import { Action, ControllerAction, CTPayment, CTTransaction, CTTransactionState, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString } from '../utils';
import Logger from '../../src/logger/logger';

export function getShipmentParams(ctObj: any): Promise<ShipmentCreateParams> {
  try {
    const parsedShipmentRequest = ctObj?.custom?.fields?.createCapture ? JSON.parse(ctObj?.custom?.fields?.createCapture) : '';
    const shipmentParams: ShipmentCreateParams = {
      orderId: ctObj.key,
    };
    if (parsedShipmentRequest.lines?.length) Object.assign(shipmentParams, { lines: parsedShipmentRequest.lines });
    Logger.debug({ shipmentParams: shipmentParams });
    return Promise.resolve(shipmentParams);
  } catch (error) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie shipment.', field: 'createShipmentRequest' });
  }
}

export function isPartialCapture(transactions: CTTransaction[]): boolean {
  // // Assumes only one initial transaction, i.e. only one capture being made at a time
  const initialCharge = transactions.find(tr => tr.type === CTTransactionType.Charge && tr.state === CTTransactionState.Initial);
  return !isEmpty(initialCharge?.custom?.fields?.lineIds);
}

export function createCtActions(mollieShipmentRes: Shipment, ctObj: any): Action[] {
  const stringifiedShipmentResponse = JSON.stringify(mollieShipmentRes);
  const result: Action[] = [
    {
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        actionType: ControllerAction.CreateShipment,
        createdAt: createDateNowString(),
        request: ctObj?.custom?.fields?.createCapture,
        response: stringifiedShipmentResponse,
      },
    },
    {
      action: 'setCustomField',
      name: 'createShipmentResponse',
      value: stringifiedShipmentResponse,
    },
  ];
  return result;
}

export default async function createShipment(ctPayment: CTPayment, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    Logger.debug({ 'Payment object': ctPayment });
    if (!ctPayment.key) {
      return Promise.reject({ status: 400, title: 'Payment is missing key', field: 'payment.key' });
    }

    const molliePaymentRes = isPartialCapture(ctPayment.transactions ?? []) ? await mollieClient.orders.get(ctPayment.key) : undefined;
    console.log('molliePaymentRes', molliePaymentRes);
    const shipmentParams = await getShipmentParams(ctPayment);
    const mollieShipmentRes = await mollieClient.orders_shipments.create(shipmentParams);
    Logger.debug({ mollieShipmentRes: mollieShipmentRes });
    const ctActions = createCtActions(mollieShipmentRes, ctPayment);
    return {
      actions: ctActions,
      status: 201,
    };
  } catch (error: any) {
    Logger.error({ error });
    const errorResponse = formatErrorResponse(error);
    return errorResponse;
  }
}
