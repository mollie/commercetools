import { PaymentMethod } from '@mollie/api-client';
import { ControllerAction } from '../../types';
import { handlePayLaterFlow } from './handlePayLaterFlow';
import { handlePayNowFlow } from './handlePayNowFlow';

/**
 * @param paymentObject commercetools paymentObject, (from body.resource.obj)
 * @returns { action: ControllerAction, errorMessage: string }
 * Error cases will return ControllerAction.NoAction and an errorMessage
 * Valid input will return a ControllerAction and an empty errorMessage
 */
export const determineAction = (paymentObject: any): { action: ControllerAction; errorMessage: string } => {
  let errorMessage = '';

  // Merchant wants to list payment methods
  const shouldGetPaymentMethods = paymentObject.custom?.fields?.paymentMethodsRequest && !paymentObject.custom?.fields?.paymentMethodsResponse;
  if (shouldGetPaymentMethods) {
    return {
      action: ControllerAction.GetPaymentMethods,
      errorMessage,
    };
  }

  // If transactions are present, merchant is trying to create or update a mollie order
  if (!paymentObject.transactions?.length) {
    return {
      action: ControllerAction.NoAction,
      errorMessage,
    };
  } else {
    const method = paymentObject?.paymentMethodInfo?.method;
    if (!hasValidPaymentMethod(method)) {
      return {
        action: ControllerAction.Error,
        errorMessage: `Invalid paymentMethodInfo.method ${method}. Payment method must be set in order to make and manage payment transactions`,
      };
    } else {
      if (isPayLater(PaymentMethod[method as PaymentMethod])) {
        return handlePayLaterFlow(paymentObject);
      } else {
        return handlePayNowFlow(paymentObject);
      }
    }
  }
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
