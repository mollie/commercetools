import { MollieClient, ShipmentUpdateParams, Shipment } from '@mollie/api-client';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { Action, ControllerAction, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString } from '../utils';
import Logger from '../../src/logger/logger';

export function getShipmentParams(ctObj: any): Promise<{ shipmentId: string; updateParams: ShipmentUpdateParams }> {
  try {
    const parsedShipmentRequest = JSON.parse(ctObj?.custom?.fields?.updateShipmentRequest);
    const shipmentId = parsedShipmentRequest.shipmentId;
    const updateParams: ShipmentUpdateParams = {
      orderId: ctObj.key,
      tracking: parsedShipmentRequest.tracking,
    };

    Logger.debug({ shipmentId: shipmentId });
    Logger.debug({ updateShipmentParams: updateParams });
    return Promise.resolve({ shipmentId, updateParams });
  } catch (error) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to update Mollie shipment.', field: 'updateShipmentRequest' });
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
        actionType: ControllerAction.UpdateShipment,
        createdAt: createDateNowString(),
        request: ctObj?.custom?.fields?.updateShipmentRequest,
        response: stringifiedShipmentResponse,
      },
    },
    {
      action: 'setCustomField',
      name: 'updateShipmentResponse',
      value: stringifiedShipmentResponse,
    },
  ];
  return result;
}

export default async function updateShipment(ctObj: any, mollieClient: MollieClient, getShipmentParams: Function, createCtActions: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const shipmentParams = await getShipmentParams(ctObj);
    const mollieShipmentRes = await mollieClient.orders_shipments.update(shipmentParams.shipmentId, shipmentParams.updateParams);
    Logger.debug({ mollieShipmentRes: mollieShipmentRes });
    const ctActions = createCtActions(mollieShipmentRes, ctObj);
    return {
      actions: ctActions,
      status: 200,
    };
  } catch (error: any) {
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
