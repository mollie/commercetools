import getPaymentMethods from './getPaymentMethods';
import createOrder from './createOrder';
import createOrderPayment from './createOrderPayment';
import createShipment from './createShipment';
import updateShipment from './updateShipment';
import { ControllerAction } from '../types/index';
import cancelOrder from './cancelOrder';

export default {
  getPaymentMethods,
  createOrder,
  createOrderPayment,
  createShipment,
  updateShipment,
  cancelOrder,
};

/**
 * validateAction expects CT formatted body with action (and later custom params)
 * @param body
 * Based on logic it then returns either an action string or undefined if no action could be determined
 * @returns ControllerAction
 */
export function validateAction(body: any): ControllerAction {
  const requestFields = body.resource?.obj?.custom?.fields;

  if (requestFields?.paymentMethodsRequest && !requestFields?.paymentMethodsResponse) {
    return ControllerAction.GetPaymentMethods;
  }

  if (requestFields?.createOrderRequest && !requestFields?.createOrderResponse) {
    return ControllerAction.CreateOrder;
  }

  if (requestFields?.createOrderPaymentRequest && !requestFields?.createOrderPaymentResponse) {
    return ControllerAction.CreateOrderPayment;
  }

  if (requestFields?.createShipmentRequest && !requestFields?.createShipmentResponse) {
    return ControllerAction.CreateShipment;
  }

  if (requestFields?.updateShipmentRequest && !requestFields?.updateShipmentResponse) {
    return ControllerAction.UpdateShipment;
  }

  if (requestFields?.createCancelOrderRequest && !requestFields?.createCancelOrderResponse) {
    return ControllerAction.CancelOrder;
  }

  return ControllerAction.NoAction;
}
