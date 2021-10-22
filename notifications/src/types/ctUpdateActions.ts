import { CTTransactionState, CTTransactionDraft } from './ctPaymentTypes';

// https://docs.commercetools.com/api/projects/payments#set-customfield
export type UpdateActionSetCustomField = {
  action: UpdateActionKey.SetCustomField;
  name: string;
  value: string;
};

// https://docs.commercetools.com/api/projects/payments#change-transactionstate
export type UpdateActionChangeTransactionState = {
  action: UpdateActionKey.ChangeTransactionState;
  transactionId: string;
  state: CTTransactionState;
};

export type AddTransaction = {
  action: UpdateActionKey.AddTransaction;
  transaction: CTTransactionDraft;
};

export enum UpdateActionKey {
  SetCustomField = 'setCustomField',
  ChangeTransactionState = 'changeTransactionState',
  AddTransaction = 'addTransaction',
}
