import { validateAction } from './src/requestHandlers/actions';
import { processAction } from './src/requestHandlers/handleRequest';
import { initialiseMollieClient } from './src/client/utils';
import Logger from './src/logger/logger';

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
    const action = validateAction(body);
    const { actions, errors } = await processAction(action, body, initialiseMollieClient());
    if (errors?.length) {
      Logger.debug('Process action errors');
      return {
        responseType: 'FailedValidation',
        errors,
      };
    } else if (!actions) {
      return {};
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
