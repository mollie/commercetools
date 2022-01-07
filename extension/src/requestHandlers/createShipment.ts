import { isEmpty, trim } from 'lodash';
import { MollieClient, ShipmentCreateParams, Shipment, Order, OrderLine } from '@mollie/api-client';
import formatErrorResponse from '../errorHandlers';
import { Action, ControllerAction, CTPayment, CTTransaction, CTTransactionState, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import { createDateNowString } from '../utils';
import Logger from '../../src/logger/logger';

export function getShipmentParams(ctPayment: Required<CTPayment>, mollieOrder: Order | undefined): Promise<ShipmentCreateParams> {
  try {
    const shipmentParams: ShipmentCreateParams = {
      orderId: ctPayment.key,
    };
    if (isPartialCapture(ctPayment.transactions) && mollieOrder) {
      const initialCharge = findInitialCharge(ctPayment.transactions);
      const mollieLines = ctToMollieLines(initialCharge!, mollieOrder.lines);
      Object.assign(shipmentParams, { lines: mollieLines });
    }
    Logger.debug({ shipmentParams: shipmentParams });
    return Promise.resolve(shipmentParams);
  } catch (error) {
    Logger.error({ error });
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie shipment.', field: 'createShipmentRequest' });
  }
}

export function ctToMollieLines(ctTransaction: CTTransaction, mollieOrderLines: OrderLine[]): Object[] {
  // Case 1: Comma separated string of line ids
  const ctLinesArray = ctTransaction.custom?.fields?.lineIds?.split(',').map(trim) || [];
  // Case 2: TODO - objects with ids, quantities and amounts

  const mollieLines = ctLinesArray.reduce((acc: Object[], ctLine: string) => {
    const mollieLine = mollieOrderLines.find(mollieLine => mollieLine.metadata?.cartLineItemId === ctLine || mollieLine.metadata?.cartCustomLineItemId === ctLine);
    if (mollieLine) acc.push({ id: mollieLine.id, quantity: mollieLine.quantity, amount: mollieLine.totalAmount });
    return acc;
  }, []);

  if (ctTransaction.custom?.fields?.includeShipping) {
    const shippingLine = mollieOrderLines.find(mollieLine => mollieLine.name.startsWith('Shipping'));
    shippingLine && mollieLines.push({ id: shippingLine.id });
  }

  return mollieLines;
}

export function findInitialCharge(transactions: CTTransaction[]): CTTransaction | undefined {
  // Only find the first transaction with initial state to overcome mistakes
  return transactions.find(tr => tr.type === CTTransactionType.Charge && tr.state === CTTransactionState.Initial);
}

export function isPartialCapture(transactions: CTTransaction[]): boolean {
  const initialCharge = findInitialCharge(transactions);
  return !isEmpty(initialCharge?.custom?.fields?.lineIds) || initialCharge?.custom?.fields?.includeShipping!;
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

export default async function createShipment(ctPayment: Required<CTPayment>, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    Logger.debug({ 'Payment object': ctPayment });
    const mollieOrderRes = isPartialCapture(ctPayment.transactions ?? []) ? await mollieClient.orders.get(ctPayment.key) : undefined;
    const shipmentParams = await getShipmentParams(ctPayment, mollieOrderRes);
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
