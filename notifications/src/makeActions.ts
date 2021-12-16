import { CTTransactionState, CTTransactionType } from './types/ctPaymentTypes';
import { AddTransaction, UpdateActionChangeTransactionState, UpdateActionKey } from './types/ctUpdateActions';
import { convertMollieAmountToCTMoney } from './utils';

const addTransaction = (type: CTTransactionType, amount: { currency: string; value: string }, interactionId: string, state: CTTransactionState, timestamp: string): AddTransaction => {
  const ctAmount = convertMollieAmountToCTMoney(amount);
  return {
    action: UpdateActionKey.AddTransaction,
    transaction: {
      type,
      amount: ctAmount,
      timestamp,
      interactionId,
      state,
    },
  };
};

const setStatusInterfaceText = (interfaceText: string) => {
  return {
    action: 'setMethodInfoName',
    interfaceText,
  };
};

const changeTransactionState = (id: string, newState: CTTransactionState): UpdateActionChangeTransactionState => {
  return {
    action: UpdateActionKey.ChangeTransactionState,
    transactionId: id,
    state: newState,
  };
};
export const makeActions = {
  addTransaction,
  changeTransactionState,
  setStatusInterfaceText,
};
