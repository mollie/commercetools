import { APIGatewayProxyEvent } from 'aws-lambda';
import handleRequest from './src/requestHandlers/handleRequest';
import { HandleRequestInput, HandleRequestSuccess } from './src/types/requestHandler';

exports.handler = async (event: APIGatewayProxyEvent) => {
  const body = event.body ? JSON.parse(event.body) : event;
  const input = new HandleRequestInput(event.path, event.httpMethod, body);

  let result = await handleRequest(input);

  if (result instanceof HandleRequestSuccess) {
    return {
      statusCode: result.status,
      body: JSON.stringify({
        responseType: 'UpdateRequest',
        actions: result.actions,
      }),
    };
  } else {
    return {
      statusCode: result.status,
      body: JSON.stringify({
        responseType: 'FailedValidation',
        errors: result.errors,
      }),
    };
  }
};
