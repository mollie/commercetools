import handleRequest from './src/requestHandlers/handleRequest';
import { HandleRequestInput, HandleRequestSuccess } from './src/types';


exports.handler = async (event: any) => {
  const body = event.body ? JSON.parse(event.body) : event;
  const input = new HandleRequestInput(event.path, event.httpMethod, body);

  let result = await handleRequest(input);

  if (result instanceof HandleRequestSuccess) {
    return {
      statusCode: 200,
      'body': JSON.stringify({
        responseType: 'UpdateRequest',
        actions: result.actions
      })
    };
  } else {
    return {
      statusCode: 200,
      'body': JSON.stringify({
        responseType: 'FailedValidation',
        errors: result.errors
      })
    };
  }
};
