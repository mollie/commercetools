import getPaymentDetailsById from './mollie/getPaymentDetailsById';
import getOrderDetailsById, { parseOrder } from './mollie/getOrderDetailsById';
import { getPaymentByKey, parsePayment } from './commercetools/getPaymentByKey';
import { updatePaymentByKey } from './commercetools/updatePaymentByKey';

export default {
  ctGetPaymentByKey: getPaymentByKey,
  ctUpdatePaymentByKey: updatePaymentByKey,
  ctParsePayment: parsePayment,
  mGetOrderDetailsById: getOrderDetailsById,
  mParseOrder: parseOrder,
  mGetPaymentDetailsById: getPaymentDetailsById,
};
