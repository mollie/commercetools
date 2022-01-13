import { CTTransaction, CTPayment, CTTransactionType, ControllerAction, CTTransactionState } from '../../types/index';

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
    case !authorizationTransactions?.filter(authTransaction => authTransaction.state === 'Success').length && !!chargeTransactions.length:
      action = ControllerAction.NoAction;
      errorMessage = 'Cannot create a capture without a successful Authorization';
      break;
    case !!refundTransactions.length && !chargeTransactions.filter(chargeTransaction => chargeTransaction.state === 'Success').length:
      action = ControllerAction.NoAction;
      errorMessage = 'Cannot create a Refund without a successful capture';
      break;
    case !!authorizationTransactions?.filter(authTransaction => authTransaction.state === 'Failure').length && !!cancelAuthorizationTransactions.length:
      action = ControllerAction.NoAction;
      errorMessage = 'Cannot cancel a failed Authorization';
      break;
    case !!authorizationTransactions?.filter(authTransaction => authTransaction.state === 'Pending').length && !key:
      errorMessage = 'Cannot create a Transaction in state "Pending". This state is reserved to indicate the transaction has been accepted by the payment service provider';
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
