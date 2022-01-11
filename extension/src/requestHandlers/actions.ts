import getPaymentMethods from './getPaymentMethods';
import createOrder from './createOrder';
import createOrderPayment from './createOrderPayment';
import createShipment from './createShipment';
import { createCustomRefund } from './createCustomRefund';
import cancelOrder from './cancelOrder';

export default {
  getPaymentMethods,
  createOrder,
  createOrderPayment,
  createShipment,
  createCustomRefund,
  cancelOrder,
};
