import { validateAction } from './src/requestHandlers/actions';
import { processAction } from './src/requestHandlers/handleRequest';
import { initialiseMollieClient } from './src/client';
import Logger from './src/logger/logger';
import { ControllerAction } from './src/types';
import { isMolliePaymentInterface } from './src/utils';

exports.handler = async (event: any) => {
  try {
    const body = event.body ? JSON.parse(event.body) : event;
    const requestObject = body?.resource?.obj;
    if (!requestObject) {
      return {
        responseType: 'FailedValidation',
        errors: [
          {
            code: 'InvalidInput',
            message: `Invalid event body`,
          },
        ],
      };
    }
    const noActionObject = {
      responseType: 'UpdateRequest',
      actions: [],
    };
    if (!isMolliePaymentInterface(requestObject)) {
      return noActionObject;
    }
    const action = validateAction(body);
    if (action === ControllerAction.NoAction) {
      return noActionObject;
    }
    const { actions, errors } = await processAction(action, body, initialiseMollieClient());
    if (errors?.length) {
      Logger.debug('Process action errors');
      return {
        responseType: 'FailedValidation',
        errors,
      };
    } else {
      return {
        responseType: 'UpdateRequest',
        actions,
      };
    }
  } catch (error: any) {
    Logger.error({ error });
    return {
      responseType: 'FailedValidation',
      errors: [
        {
          code: 'InvalidInput',
          message: `${error.message}`,
        },
      ],
    };
  }
};
