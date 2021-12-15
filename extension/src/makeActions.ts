import { v4 as uuid } from 'uuid';
import { Action, ControllerAction, CTTransactionState } from './types';
import { createDateNowString } from './utils';

/**
 *
 * @param customFieldName
 * @param customFieldValue
 * If the customFieldValue is an API response, JSON Stringify it before passing it
 */
const setCustomField = (customFieldName: string, customFieldValue: string) => {
  return {
    action: 'setCustomField',
    name: customFieldName,
    value: customFieldValue,
  };
};

/**
 *
 * @param actionType ControllerAction
 * @param requestValue
 * @param responseValue
 * @param id
 * If the responseValue is an API response, JSON Stringify it before passing it
 */
const addInterfaceInteraction = (actionType: ControllerAction, requestValue: string, responseValue: string, id?: string) => {
  const interfaceInteractionId = id ? id : uuid();
  return {
    action: 'addInterfaceInteraction',
    type: {
      key: 'ct-mollie-integration-interface-interaction-type',
    },
    fields: {
      id: interfaceInteractionId,
      actionType,
      createdAt: createDateNowString(),
      request: requestValue,
      response: responseValue,
    },
  };
};

/**
 *
 * @param key will be the mollie order id
 */
const setKey = (key: string) => {
  return {
    action: 'setKey',
    key,
  };
};

/**
 *
 * @param interfaceText will be the mollie order status
 */
const setStatusInterfaceText = (interfaceText: string) => {
  return {
    action: 'setMethodInfoName',
    interfaceText,
  };
};

/**
 *
 * @param id transaction to be updated
 * @param newState CTTransactionState
 */
const changeTransactionState = (id: string, newState: CTTransactionState) => {
  return {
    action: 'changeTransactionState',
    transactionId: id,
    state: newState,
  };
};

/**
 *
 * @param id transaction to be updated
 * @param interactionId either the mollie payment id, or the corresponding interfaceInteraction's id
 */
const changeTransactionInteractionId = (id: string, interactionId: string) => {
  return {
    action: 'changeTransactionInteractionId',
    transactionId: id,
    interactionId,
  };
};

export const makeActions = {
  setCustomField,
  addInterfaceInteraction,
  setKey,
  setStatusInterfaceText,
  changeTransactionState,
  changeTransactionInteractionId,
};
