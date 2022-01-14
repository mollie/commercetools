import { CTTransaction, CTPayment, CTTransactionType, ControllerAction, CTTransactionState } from '../../types/index';

export const handlePayNowFlow = (paymentObject: CTPayment): { action: ControllerAction; errorMessage: string } => {
  let errorMessage = '';
  const { key, transactions } = paymentObject;

  // Check for invalid transaction types
  const invalidTransactionTypes = transactions?.filter(transaction => transaction.type === CTTransactionType.CancelAuthorization) ?? [];

  const initialChargeTransactions: CTTransaction[] = [];
  const pendingChargeTransactions: CTTransaction[] = [];
  const successChargeTransactions: CTTransaction[] = [];

  const chargeTransactions = transactions?.filter((transaction: any) => transaction.type === CTTransactionType.Charge) ?? [];
  chargeTransactions?.forEach((transaction: any) => {
    if (transaction.state === CTTransactionState.Initial) initialChargeTransactions.push(transaction);
    if (transaction.state === CTTransactionState.Pending) pendingChargeTransactions.push(transaction);
    if (transaction.state === CTTransactionState.Success) successChargeTransactions.push(transaction);
  });

  const initialTransactions = transactions!.filter(({ state }) => state === CTTransactionState.Initial);
  const refundTransactions = transactions?.filter((transaction: any) => transaction.type === CTTransactionType.Refund) ?? [];
  const initialRefundTransactions = refundTransactions?.filter((transaction: any) => transaction.state === CTTransactionState.Initial);

  let action;
  // CHECK FOR PAYMENT KEY TOO
  switch (true) {
    // Error cases
    case initialTransactions.length > 1:
      action = ControllerAction.NoAction;
      errorMessage = 'Only one transaction can be in "Initial" state at any time';
      break;
    case !!invalidTransactionTypes.length:
      action = ControllerAction.NoAction;
      errorMessage = 'CancelAuthorization transaction type is invalid for pay now methods';
      break;
    case !!refundTransactions.length && !chargeTransactions.length:
      action = ControllerAction.NoAction;
      errorMessage = 'Cannot create a Refund with no Charge';
      break;

    // Bit unsure of this one....
    case initialChargeTransactions.length === 1 && pendingChargeTransactions.length >= 1:
      action = ControllerAction.NoAction;
      errorMessage = 'Must only have one Charge transaction processing (i.e. in state "Initial" or "Pending") at a time';
      break;
    case !!pendingChargeTransactions.length && !key:
      action = ControllerAction.NoAction;
      errorMessage = 'Cannot create a Transaction in state "Pending". This state is reserved to indicate the transaction has been accepted by the payment service provider';
      break;

    // Create Order
    case !key && initialChargeTransactions.length === 1 && !successChargeTransactions.length && !pendingChargeTransactions.length:
      action = ControllerAction.CreateOrder;
      break;
    // Create Order Payment
    case !!key && initialChargeTransactions.length === 1 && !successChargeTransactions.length && !pendingChargeTransactions.length:
      action = ControllerAction.CreateOrderPayment;
      break;
    // Create Refund
    case !initialChargeTransactions.length && !pendingChargeTransactions.length && successChargeTransactions.length === 1 && !!initialRefundTransactions.length:
      action = ControllerAction.CreateCustomRefund;
      break;
    // Cancel Order
    case pendingChargeTransactions.length === 1 && !successChargeTransactions.length && !!initialRefundTransactions.length:
      action = ControllerAction.CancelOrder;
      break;
    default:
      action = ControllerAction.NoAction;
  }
  return { action, errorMessage };
};
