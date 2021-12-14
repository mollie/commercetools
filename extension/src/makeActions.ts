import { Action, ControllerAction } from './types';
import { createDateNowString } from './utils';

/**
 *
 * @param customFieldName
 * @param customFieldValue
 * If the customFieldValue is an API response, JSON Stringify it before passing it
 */
const setCustomField = (customFieldName: string, customFieldValue: string): Action => {
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
 * If the responseValue is an API response, JSON Stringify it before passing it
 */
const addInterfaceInteraction = (actionType: ControllerAction, requestValue: string, responseValue: string): Action => {
  return {
    action: 'addInterfaceInteraction',
    type: {
      key: 'ct-mollie-integration-interface-interaction-type',
    },
    fields: {
      actionType,
      createdAt: createDateNowString(),
      request: requestValue,
      response: responseValue,
    },
  };
};

// SET KEY

// SET INTERFACE STATUS CODE

// SET CUSTOM FIELD WILL BECOME DEPRECATED (Ik denk)

export const makeActions = {
  setCustomField,
  addInterfaceInteraction,
};
