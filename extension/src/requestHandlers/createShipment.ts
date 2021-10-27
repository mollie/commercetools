import { MollieClient, ShipmentCreateParams } from '@mollie/api-client';
import Debug from 'debug';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { CTUpdatesRequestedResponse } from '../types';

const debug = Debug('extension:createShipment');

export function getShipmentParams(ctObj: any): Promise<ShipmentCreateParams> {
  try {
    const parsedShipmentRequest = JSON.parse(ctObj?.custom?.fields?.createShipmentRequest);
    const shipmentParams: ShipmentCreateParams = {
      orderId: ctObj.key,
    };
    if (parsedShipmentRequest.lines?.length) Object.assign(shipmentParams, { lines: parsedShipmentRequest.lines });
    if (parsedShipmentRequest.tracking) Object.assign(shipmentParams, { tracking: parsedShipmentRequest.tracking });

    debug('shipmentParams', shipmentParams);
    return Promise.resolve(shipmentParams);
  } catch (e) {
    console.error(e);
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie shipment.', field: 'createOrderResponse,createShipmentRequest' });
  }
}

export default async function createShipment(ctObj: any, mollieClient: MollieClient, getShipmentParams: Function): Promise<CTUpdatesRequestedResponse> {
  try {
    const shipmentParams = await getShipmentParams(ctObj);
    const mollieShipmentRes = await mollieClient.orders_shipments.create(shipmentParams);
    debug('mollieShipmentRes', mollieShipmentRes);
    // const ctActions = createCtActions(mollieShipmentRes, ctObj);
    return {
      actions: [],
      status: 201,
    };
  } catch (error: any) {
    console.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
