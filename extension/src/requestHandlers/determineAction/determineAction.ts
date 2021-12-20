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
    // Check payment method and issuer (if present) are valid
    const method = paymentObject?.paymentMethodInfo?.method;
    const { isValid, errorMessage } = checkPaymentMethodAndIssuer(method);
    if (!isValid) {
      return {
        action: ControllerAction.NoAction,
        errorMessage: errorMessage,
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

const checkPaymentMethodAndIssuer = (paymentMethod: string): { isValid: boolean; errorMessage: string } => {
  let errorMessage = '';
  let isValid = true;
  const paymentMethodString = paymentMethod ?? '';
  const [method, issuer] = paymentMethodString.split(',');

  switch (true) {
    case !method:
      isValid = false;
      errorMessage = 'Payment method must be set in order to make and manage payment transactions';
      break;
    case !hasValidPaymentMethod(method):
      isValid = false;
      errorMessage = `Invalid paymentMethodInfo.method "${method}"`;
      break;
    case issuer && !doesPaymentMethodSupportIssuer(method as PaymentMethod):
      isValid = false;
      errorMessage = `Payment method "${method}" does not support issuers`;
    default:
      break;
  }
  return {
    isValid,
    errorMessage,
  };
};

/**
 * @param method string - mollie payment method enum
 *
 * The PaymentMethod enum is currently missing 'voucher' & 'mybank'. These will be added
 * in V3.6 or V4 of the mollie node SDK.
 *
 * Until then, we cast 'voucher'/'mybank' as PaymentMethod and track this in Issue #34
 * https://github.com/mollie/commercetools/issues/34
 *
 */
const hasValidPaymentMethod = (method: string | undefined) => {
  if (method === 'voucher' || method == 'mybank') {
    return true;
  }
  return !!PaymentMethod[method as PaymentMethod];
};

/**
 * Checks whether the payment method is valid with an issuer
 * @param issuer
 * @returns {boolean}
 */
function doesPaymentMethodSupportIssuer(paymentMethod: PaymentMethod): boolean {
  switch (true) {
    case paymentMethod === PaymentMethod.ideal:
    case paymentMethod === PaymentMethod.kbc:
    case paymentMethod === PaymentMethod.giftcard:
    // Isn't yet in the mollie api but will be added soon - https://github.com/mollie/commercetools/issues/34
    case paymentMethod === ('voucher' as PaymentMethod):
      return true;
    default:
      return false;
  }
}

const isPayLater = (method: PaymentMethod) => {
  const payLaterEnums: PaymentMethod[] = [PaymentMethod.klarnapaylater, PaymentMethod.klarnasliceit];
  return payLaterEnums.includes(method);
};
