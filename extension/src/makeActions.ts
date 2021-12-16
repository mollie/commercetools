import { time } from 'console';
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

type createInterfaceInteractionParams = {
  actionType: ControllerAction;
  requestValue: string;
  responseValue: string;
  id?: string;
  timestamp?: string;
};
/**
 * @param parameters type createInterfaceInteractionParams, which contains
 * actionType ControllerAction
 * requestValue string
 * responseValue string
 * id string string, optional
 * timestamp string, optional
 * If the responseValue is an API response, JSON Stringify it before passing it
 */
const addInterfaceInteraction = (params: createInterfaceInteractionParams) => {
  const { actionType, requestValue, responseValue, id, timestamp } = params;
  const interfaceInteractionId = id ? id : uuid();
  const interfaceInteractionTimestamp = timestamp ? timestamp : createDateNowString();
  return {
    action: 'addInterfaceInteraction',
    type: {
      key: 'ct-mollie-integration-interface-interaction-type',
    },
    fields: {
      id: interfaceInteractionId,
      actionType,
      createdAt: interfaceInteractionTimestamp,
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

/**
 *
 * @param id transaction to be updated
 * @param timestamp CT DateTime is a JSON string representation of UTC date & time in ISO 8601 format (YYYY-MM-DDThh:mm:ss.sssZ)
 * for example: "2018-10-12T14:00:00.000Z"
 */
const changeTransactionTimestamp = (id: string, timestamp: string) => {
  return {
    action: 'changeTransactionTimestamp',
    transactionId: id,
    timestamp,
  };
};

export const makeActions = {
  setCustomField,
  addInterfaceInteraction,
  setKey,
  setStatusInterfaceText,
  changeTransactionState,
  changeTransactionInteractionId,
  changeTransactionTimestamp,
};
