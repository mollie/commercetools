import getPaymentMethods from './getPaymentMethods';
import createOrder from './createOrder';
import createOrderPayment from './createOrderPayment';
import { ControllerAction } from '../types/index';
export default {
  getPaymentMethods,
  createOrder,
  createOrderPayment,
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

  return ControllerAction.NoAction;
}
