import mollieCreateOrderParams from './mollieCreateOrderParams.json';
import mollieOrder from './mollieOrder.json';
import ctCart from './ctCart.json';
import ctPayment from './ctPayment.json';
import extensionActions from './extensionActions.json';

const ctLineItem = ctCart.lineItems[0];
const ctAddress = ctCart.billingAddress;

export { mollieCreateOrderParams, mollieOrder, ctCart, ctPayment, ctLineItem, ctAddress, extensionActions };
