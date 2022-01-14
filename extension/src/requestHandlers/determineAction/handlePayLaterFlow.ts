import { CTTransaction, CTPayment, CTTransactionType, ControllerAction, CTTransactionState } from '../../types/index';

export const includesState = (transactions: CTTransaction[], type: CTTransactionState): boolean => {
  return !!transactions.filter(({ state }) => state === type).length;
};

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

  const initialTransactions = transactions!.filter(({ state }) => state === CTTransactionState.Initial);

  let action;
  switch (true) {
    // Error cases
    case initialTransactions.length > 1:
      action = ControllerAction.NoAction;
      errorMessage = 'Only one transaction can be in "Initial" state at any time';
      break;
    case (!!cancelAuthorizationTransactions.length || !!chargeTransactions.length || !!refundTransactions.length) && authorizationTransactions.length === 0:
      action = ControllerAction.NoAction;
      errorMessage = 'Cannot add a refund, cancel or charge transaction without an Authorization transaction';
      break;
    case includesState(chargeTransactions, CTTransactionState.Initial) && !includesState(authorizationTransactions, CTTransactionState.Success):
      action = ControllerAction.NoAction;
      errorMessage = 'Cannot create a capture without a successful Authorization';
      break;
    case !!refundTransactions.length && !includesState(chargeTransactions, CTTransactionState.Success):
      action = ControllerAction.NoAction;
      errorMessage = 'Cannot create a Refund without a successful capture';
      break;
    case !key && includesState(authorizationTransactions, CTTransactionState.Pending):
      errorMessage = 'Cannot create a Transaction in state "Pending". This state is reserved to indicate the transaction has been accepted by the payment service provider';
      action = ControllerAction.NoAction;
      break;

    // Create order
    case !key && includesState(authorizationTransactions, CTTransactionState.Initial):
      action = ControllerAction.CreateOrder;
      break;

    // Create order payment
    case key && includesState(authorizationTransactions, CTTransactionState.Initial):
      action = ControllerAction.CreateOrderPayment;
      break;

    // Create shipment
    case key && includesState(authorizationTransactions, CTTransactionState.Success) && includesState(chargeTransactions, CTTransactionState.Initial):
      action = ControllerAction.CreateShipment;
      break;

    // Cancel Authorization
    case includesState(cancelAuthorizationTransactions, CTTransactionState.Initial):
      action = ControllerAction.CancelOrder;
      break;

    // Create Refund
    case includesState(authorizationTransactions, CTTransactionState.Success) &&
      includesState(chargeTransactions, CTTransactionState.Success) &&
      includesState(refundTransactions, CTTransactionState.Initial):
      action = ControllerAction.CreateCustomRefund;
      break;
    default:
      action = ControllerAction.NoAction;
  }
  return { action, errorMessage };
};
