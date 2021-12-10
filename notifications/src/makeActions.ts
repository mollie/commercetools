import { CTTransactionState } from './types/ctPaymentTypes';

const setStatusInterfaceText = (interfaceText: string) => {
  return {
    action: 'setMethodInfoName',
    interfaceText,
  };
};

const changeTransactionState = (id: string, newState: CTTransactionState) => {
  return {
    action: 'changeTransactionState',
    transactionId: id,
    state: newState,
  };
};
export const makeActions = {
  changeTransactionState,
  setStatusInterfaceText,
};
