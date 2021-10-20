import getPaymentDetailsById from './mollie/getPaymentDetailsById';
import getOrderDetailsById from './mollie/getOrderDetailsById';
import { getPaymentByKey } from './commercetools/getPaymentByKey';
import { updatePaymentByKey } from './commercetools/updatePaymentByKey';
export default {
  ctGetPaymentByKey: getPaymentByKey,
  mGetOrderDetailsById: getOrderDetailsById,
  mGetPaymentDetailsById: getPaymentDetailsById,
  ctUpdatePaymentByKey: updatePaymentByKey,
};
