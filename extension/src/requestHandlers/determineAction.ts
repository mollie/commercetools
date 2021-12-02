import { PaymentMethod } from '@mollie/api-client';
import { ControllerAction } from '../types';

export const isListPaymentMethods = (paymentObject: any) => {
  const customFields = paymentObject?.custom?.fields;
  return customFields?.paymentMethodsRequest && !customFields?.paymentMethodsResponse;
};

/**
 * @param method string - mollie payment method enum
 *
 * If no valid payment methods are provided, this will return '' and
 * the 'method' parameter will not be passed as part of the createOrder request
 *
 * The PaymentMethod enum is currently missing 'voucher' & 'mybank'. These will be added
 * in V3.6 or V4 of the mollie node SDK.
 *
 * Until then, we cast 'voucher'/'mybank' as PaymentMethod and track this in Issue #34
 * https://github.com/mollie/commercetools/issues/34
 *
 * N.B. this may be updated to handle issuers (i.e. for vouchers, iDEAL) later on
 *
 */
export const hasValidPaymentMethod = (method: string | undefined) => {
  if (!method) {
    return false;
  } else {
    if (method === 'voucher' || method == 'mybank') {
      return true;
    }
    return !!PaymentMethod[method as PaymentMethod];
  }
};

export const isPayLater = (method: PaymentMethod) => {
  const payLaterEnums: PaymentMethod[] = [PaymentMethod.klarnapaylater, PaymentMethod.klarnasliceit];
  return payLaterEnums.includes(method);
};

/**
 *
 * @param paymentObject commercetools paymentObject, (from body.resource.obj)
 *
 * Returns either a ControllerAction or error
 */
export const determineAction = (paymentObject: any): ControllerAction | any => {
  // Is it mollie ?
  // --> Import the method from CMI30 - should this be here or higher?

  // Is it listpaymentmethods?
  const shouldGetPaymentMethods = isListPaymentMethods(paymentObject);
  if (shouldGetPaymentMethods) {
    return ControllerAction.GetPaymentMethods;
  }

  // Are there transactions ? OKAY - we're into the main event or NO return nought
  const shouldProcessTransaction = !!paymentObject.transactions.length;
  if (!shouldProcessTransaction) {
    return ControllerAction.NoAction;
  } else {
    // We carry on...
    const method = paymentObject?.paymentMethodInfo?.method;

    if (!hasValidPaymentMethod(method)) {
      // return error
      return;
    } else {
      if (isPayLater(method)) {
        // Y - Paylater - Switch
      } else {
        const action = handlePayNowFlow(paymentObject);
        return action;
      }
    }
  }
};

export const handlePayLaterFlow = (paymentObject: any) => {
  const {
    transactions,
    custom: { fields: customFields },
  } = paymentObject;
};

export const handlePayNowFlow = (paymentObject: any) => {
  const {
    transactions,
  } = paymentObject;

  // Check for invalid transaction types
  const authorizationTransactions = transactions.filter((transaction: any) => transaction.type === 'Authorization' || transaction.type === 'CancelAuthorization');

  const initialChargeTransactions: any = [];
  const pendingChargeTransactions: any = [];
  const successChargeTransactions: any = []; 
  
  const chargeTransactions = transactions.filter((transaction: any) => transaction.type === 'Charge');
  chargeTransactions.forEach((transaction: any) => {
    if(transaction.state === 'Initial') initialChargeTransactions.push(transaction);
    if(transaction.state === 'Pending') pendingChargeTransactions.push(transaction);
    if(transaction.state === 'Success') successChargeTransactions.push(transaction);
  });
  
  const refundTransactions = transactions.filter((transaction: any) => transaction.type === 'Refund');
  const initialRefundTransactions = refundTransactions.filter((transaction: any) => transaction.state === 'Initial');

  let action;
  // console.log((!successChargeTransactions.length && !!refundTransactions.length))
  switch (true) {
    // Error cases
    case (!!authorizationTransactions.length):
    case (!successChargeTransactions.length && !!refundTransactions.length):
    case (initialChargeTransactions.length > 1 || pendingChargeTransactions.length > 1):
      action = ControllerAction.Error;
      break;
    // Create Order
    case initialChargeTransactions.length === 1 && !successChargeTransactions.length && !pendingChargeTransactions.length:
      action = ControllerAction.CreateOrder;
      break;
    // Create Refund
    case !initialChargeTransactions.length && !pendingChargeTransactions.length && successChargeTransactions.length === 1 && !!initialRefundTransactions.length:
      action = ControllerAction.CreateCustomRefund;
      break;
    // Cancel Order
    case (initialChargeTransactions.length === 1 || pendingChargeTransactions.length === 1) && !successChargeTransactions.length: 
      action = ControllerAction.CancelOrder;
      break;
    default:
      action = ControllerAction.NoAction;
  }
  return action;
};
