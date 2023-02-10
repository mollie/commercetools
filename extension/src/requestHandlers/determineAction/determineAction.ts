import { PaymentMethod } from '@mollie/api-client';
import { ControllerAction } from '../../types';
import { handlePayLaterFlow } from './handlePayLaterFlow';
import { handlePayNowFlow } from './handlePayNowFlow';
import { isPayLater } from '../../utils';

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
    // Check if payment method is valid
    const method = paymentObject?.paymentMethodInfo?.method;
    const { isValid, errorMessage } = checkPaymentMethodInput(method);
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

const checkPaymentMethodInput = (paymentMethod: string): { isValid: boolean; errorMessage: string } => {
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
    default:
      break;
  }
  return {
    isValid,
    errorMessage,
  };
};

const hasValidPaymentMethod = (method: string | undefined) => {
  return !!PaymentMethod[method as PaymentMethod];
};
