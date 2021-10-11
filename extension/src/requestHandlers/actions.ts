import getPaymentMethods from './getPaymentMethods';
export default {
  getPaymentMethods,
};

export function validateAction(body: any): string | undefined {
  let action = undefined
  switch (true) {
    case body.action === 'create':
      action = 'getPaymentMethods'
      break
  }
  return action
}
