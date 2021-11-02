import { MollieClient, ShipmentCreateParams, Shipment } from '@mollie/api-client';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, ControllerAction, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString } from '../utils';
import Logger from '../../src/logger/logger';

export function getShipmentParams(ctObj: any): Promise<ShipmentCreateParams> {
  try {
    const parsedShipmentRequest = JSON.parse(ctObj?.custom?.fields?.createShipmentRequest);
    const shipmentParams: ShipmentCreateParams = {
      orderId: ctObj.key,
    };
    if (parsedShipmentRequest.lines?.length) Object.assign(shipmentParams, { lines: parsedShipmentRequest.lines });
    if (parsedShipmentRequest.tracking) Object.assign(shipmentParams, { tracking: parsedShipmentRequest.tracking });

    Logger.debug('shipmentParams', shipmentParams);
    return Promise.resolve(shipmentParams);
  } catch (e) {
    Logger.error(e);
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie shipment.', field: 'createShipmentRequest' });
  }
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
        request: ctObj?.custom?.fields?.createShipmentRequest,
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

export default async function createShipment(ctObj: any, mollieClient: MollieClient, getShipmentParams: Function, createCtActions: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const shipmentParams = await getShipmentParams(ctObj);
    const mollieShipmentRes = await mollieClient.orders_shipments.create(shipmentParams);
    Logger.debug('mollieShipmentRes', mollieShipmentRes);
    const ctActions = createCtActions(mollieShipmentRes, ctObj);
    return {
      actions: ctActions,
      status: 201,
    };
  } catch (error: any) {
    Logger.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
