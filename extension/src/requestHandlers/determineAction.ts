import { PaymentMethod } from '@mollie/api-client';
import { ControllerAction, CTTransaction, CTTransactionType, CTPayment } from '../types';

const isListPaymentMethods = (paymentObject: any) => {
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
const hasValidPaymentMethod = (method: string | undefined) => {
  if (!method) {
    return false;
  } else {
    if (method === 'voucher' || method == 'mybank') {
      return true;
    }
    return !!PaymentMethod[method as PaymentMethod];
  }
};

const isPayLater = (method: PaymentMethod) => {
  const payLaterEnums: PaymentMethod[] = [PaymentMethod.klarnapaylater, PaymentMethod.klarnasliceit];
  return payLaterEnums.includes(method);
};

/**
 *
 * @param paymentObject commercetools paymentObject, (from body.resource.obj)
 * @returns ControllerAction
 */

//  Return object with Controller Action & errorMessage
// If error --> no action + errorMessage
// in handleRequest, if message present, return 400 and the message to the merchant
export const determineAction = (paymentObject: any): { action: ControllerAction; errorMessage: string } => {
  let errorMessage = '';
  // Merchant wants to list payment methods
  const shouldGetPaymentMethods = isListPaymentMethods(paymentObject);
  if (shouldGetPaymentMethods) {
    return {
      action: ControllerAction.GetPaymentMethods,
      errorMessage,
    };
  }

  // If transactions are present, merchant is trying to create or update a mollie order
  if (!paymentObject.transactions.length) {
    return {
      action: ControllerAction.NoAction,
      errorMessage,
    };
  } else {
    const method = paymentObject?.paymentMethodInfo?.method;
    if (!hasValidPaymentMethod(method)) {
      return {
        action: ControllerAction.Error,
        errorMessage: 'Invalid payment method. Payment method must be set in order to make and manage payment transactions',
      };
    } else {
      if (isPayLater(method)) {
        return handlePayLaterFlow(paymentObject);
      } else {
        return handlePayNowFlow(paymentObject);
      }
    }
  }
};

// Break up the error cases so that different error messages can get set
export const handlePayLaterFlow = (paymentObject: CTPayment): { action: ControllerAction; errorMessage: string } => {
  let errorMessage = '';
  const { key, transactions } = paymentObject;

  const authorizationTransactions: CTTransaction[] = [];
  const cancelAuthorizationTransactions: CTTransaction[] = [];
  const chargeTransactions: CTTransaction[] = [];
  const refundTransactions: CTTransaction[] = [];

  transactions?.forEach(transaction => {
    if (transaction.type === CTTransactionType.Authorization) authorizationTransactions.push(transaction);
    if (transaction.type === CTTransactionType.CancelAuthorization) cancelAuthorizationTransactions.push(transaction);
    if (transaction.type === CTTransactionType.Charge) chargeTransactions.push(transaction);
    if (transaction.type === CTTransactionType.Refund) refundTransactions.push(transaction);
  });

  let action;
  switch (true) {
    // Error cases
    case (!!cancelAuthorizationTransactions.length || !!chargeTransactions.length || !!refundTransactions.length) && authorizationTransactions.length === 0:
      return {
        action: ControllerAction.NoAction,
        errorMessage: 'Cannot add a refund, cancel or charge without an Authorization transaction',
      };
    case !!authorizationTransactions?.filter(authTransaction => authTransaction.state !== 'Success').length && !!chargeTransactions.length:

    case !!authorizationTransactions?.filter(authTransaction => authTransaction.state === 'Failure').length && !!cancelAuthorizationTransactions.length:

    case !!authorizationTransactions?.filter(authTransaction => authTransaction.state === 'Pending').length && !key:
      errorMessage = 'No you cant do that';
      action = ControllerAction.NoAction;
      break;

    // Create order
    case !key && authorizationTransactions?.filter(authTransaction => authTransaction.state === 'Initial').length === 1:
      action = ControllerAction.CreateOrder;
      break;

    // Create shipment
    case key &&
      authorizationTransactions?.filter(authTransaction => authTransaction.state === 'Success').length === 1 &&
      !!chargeTransactions.filter(chargeTransaction => chargeTransaction.state === 'Initial').length:
      action = ControllerAction.CreateShipment;
      break;

    // Cancel Authorization
    case authorizationTransactions?.filter(authTransaction => authTransaction.state !== 'Failure').length >= 1 &&
      !!cancelAuthorizationTransactions.filter(cancelTransaction => cancelTransaction.state === 'Initial').length:
      action = ControllerAction.CancelOrder;
      break;

    // Create Refund
    case authorizationTransactions?.filter(authTransaction => authTransaction.state === 'Success').length === 1 &&
      chargeTransactions?.filter(chargeTransaction => chargeTransaction.state === 'Success').length >= 1 &&
      refundTransactions?.filter(refundTransaction => refundTransaction.state === 'Initial').length >= 1:
      action = ControllerAction.CreateCustomRefund;
      break;
    default:
      action = ControllerAction.NoAction;
  }
  return { action, errorMessage };
};

export const handlePayNowFlow = (paymentObject: CTPayment): { action: ControllerAction; errorMessage: string } => {
  let errorMessage = '';
  const { key, transactions } = paymentObject;

  // Check for invalid transaction types
  const authorizationTransactions = transactions?.filter(transaction => transaction.type === CTTransactionType.Authorization || transaction.type === CTTransactionType.CancelAuthorization) ?? [];

  const initialChargeTransactions: CTTransaction[] = [];
  const pendingChargeTransactions: CTTransaction[] = [];
  const successChargeTransactions: CTTransaction[] = [];

  const chargeTransactions = transactions?.filter((transaction: any) => transaction.type === 'Charge') ?? [];
  chargeTransactions?.forEach((transaction: any) => {
    if (transaction.state === 'Initial') initialChargeTransactions.push(transaction);
    if (transaction.state === 'Pending') pendingChargeTransactions.push(transaction);
    if (transaction.state === 'Success') successChargeTransactions.push(transaction);
  });

  const refundTransactions = transactions?.filter((transaction: any) => transaction.type === 'Refund') ?? [];
  const initialRefundTransactions = refundTransactions?.filter((transaction: any) => transaction.state === 'Initial');

  let action;
  // CHECK FOR PAYMENT KEY TOO
  switch (true) {
    // Error cases
    case !!authorizationTransactions.length:
    case !!refundTransactions.length && !chargeTransactions.length:
    // case (!successChargeTransactions.length && !!refundTransactions.length):
    case initialChargeTransactions.length > 1 || pendingChargeTransactions.length > 1:
    case !!pendingChargeTransactions.length && !key:
      action = ControllerAction.NoAction;
      errorMessage = 'woops';
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
    case (initialChargeTransactions.length === 1 || pendingChargeTransactions.length === 1) && !successChargeTransactions.length && !!initialRefundTransactions.length:
      action = ControllerAction.CancelOrder;
      break;
    default:
      action = ControllerAction.NoAction;
  }
  return { action, errorMessage };
};
