import { validateAction } from './src/requestHandlers/actions';
import { initialiseMollieClient, processAction } from './src/requestHandlers/handleRequest';

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
      console.debug('Process action errors');
      return {
        responseType: 'FailedValidation',
        errors,
      };
    } else {
      return {
        responseType: 'UpdateRequest',
        errors,
        actions,
      };
    }
  } catch (error: any) {
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
