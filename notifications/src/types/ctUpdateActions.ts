import { CTTransactionState, CTTransactionDraft } from './ctPayment';

// https://docs.commercetools.com/api/projects/payments#change-transactionstate
export type ChangeTransactionState = {
  action: UpdateActionKey.ChangeTransactionState;
  transactionId: string;
  state: CTTransactionState;
};

export type AddTransaction = {
  action: UpdateActionKey.AddTransaction;
  transaction: CTTransactionDraft;
};

export type SetStatusInterfaceText = {
  action: UpdateActionKey.SetStatusInterfaceText;
  interfaceText: string;
};

export enum UpdateActionKey {
  SetCustomField = 'setCustomField',
  ChangeTransactionState = 'changeTransactionState',
  AddTransaction = 'addTransaction',
  SetStatusInterfaceText = 'setStatusInterfaceText',
}

export type CTUpdateAction = ChangeTransactionState | AddTransaction | SetStatusInterfaceText;
