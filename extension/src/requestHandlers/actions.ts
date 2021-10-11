import getPaymentMethods from './getPaymentMethods';
export default {
  getPaymentMethods,
};

/**
 * validateAction expects CT formatted body with action (and later custom params)
 * @param body
 * Based on logic it then returns either an action string or undefined if no action could be determined
 * @returns 'actionName'
 */
export function validateAction(body: any): string | undefined {
  let action = undefined;
  switch (true) {
    case body.action === 'Create':
      action = 'getPaymentMethods';
      break;
    case body.resource?.obj?.custom?.fields?.paymentMethodsRequest && !body.resource?.obj?.custom?.fields?.paymentMethodsResponse:
      action = 'getPaymentMethods';
      break;
  }
  return action;
}
