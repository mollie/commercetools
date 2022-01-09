import { isEmpty, trim } from 'lodash';
import { MollieClient, ShipmentCreateParams, Shipment, Order, OrderLine } from '@mollie/api-client';
import { v4 as uuid } from 'uuid';
import formatErrorResponse from '../errorHandlers';
import { Action, ControllerAction, CTPayment, CTTransaction, CTTransactionState, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import Logger from '../../src/logger/logger';
import { makeActions } from '../makeActions';

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
    const shippingLine = mollieOrderLines.find(mollieLine => mollieLine.name.startsWith('Shipping - '));
    shippingLine && mollieLines.push({ id: shippingLine.id });
  }

  return mollieLines;
}

export function mollieToCtLines(mollieOrderLines: OrderLine[]): string {
  const ctLinesString = mollieOrderLines.reduce((acc: string, orderLine: OrderLine) => {
    const ctLineId = orderLine.metadata?.cartLineItemId || orderLine.metadata?.cartCustomLineItemId;
    if (ctLineId) acc += `${ctLineId},`;
    if (orderLine.name.startsWith('Shipping - ')) acc += `${orderLine.name.split('Shipping - ')[1]},`;
    return acc;
  }, '');

  return ctLinesString;
}

export function findInitialCharge(transactions: CTTransaction[]): CTTransaction | undefined {
  // Assumes one initial transaction, i.e. one capture being made at a time
  return transactions.find(tr => tr.type === CTTransactionType.Charge && tr.state === CTTransactionState.Initial);
}

export function isPartialCapture(transactions: CTTransaction[]): boolean {
  if (!transactions) return false;
  const initialCharge = findInitialCharge(transactions);
  return !isEmpty(initialCharge?.custom?.fields?.lineIds) || initialCharge?.custom?.fields?.includeShipping!;
}

export function createCtActions(mollieShipmentRes: Shipment, ctPayment: CTPayment): Action[] {
  const initialChargeTransaction = findInitialCharge(ctPayment.transactions!);
  const inTransactionId = initialChargeTransaction!.id || '';
  const mollieCreatedAt = mollieShipmentRes.createdAt;
  const interfaceInteractionId = uuid();
  const interfaceInteractionRequest = {
    transactionId: inTransactionId,
    createShipment: initialChargeTransaction?.custom?.fields,
  };
  const interfaceInteractionResponse = {
    mollieShipmentId: mollieShipmentRes.id,
    lineIds: mollieToCtLines(mollieShipmentRes.lines),
  };
  const interfaceInteractionParams = {
    id: interfaceInteractionId,
    actionType: ControllerAction.CreateShipment,
    requestValue: JSON.stringify(initialChargeTransaction),
    responseValue: JSON.stringify(interfaceInteractionResponse),
    timestamp: mollieCreatedAt,
  };

  const result: Action[] = [
    makeActions.changeTransactionState(inTransactionId, CTTransactionState.Success),
    makeActions.changeTransactionTimestamp(inTransactionId, mollieCreatedAt),
    makeActions.changeTransactionInteractionId(inTransactionId, interfaceInteractionId),
    makeActions.setStatusInterfaceText('Shipping'),
    makeActions.addInterfaceInteraction(interfaceInteractionParams),
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
