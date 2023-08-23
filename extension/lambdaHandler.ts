import { APIGatewayProxyEvent } from 'aws-lambda';
import { createCorrelationId } from './src/utils';
import handleRequest from './src/requestHandlers/handleRequest';
import { HandleRequestInput, HandleRequestSuccess, Action } from './src/types';

exports.handler = async (event: APIGatewayProxyEvent) => {
  const body = event.body ? JSON.parse(event.body) : event;

  const headers = new Map([['authorization', event.headers?.['authorization'] ?? '']]);
  const input = new HandleRequestInput(event.path, event.httpMethod, body, headers);

  let result = await handleRequest(input);

  if (result instanceof HandleRequestSuccess) {
    return {
        responseType: 'UpdateRequest',
        actions: result.actions
    };
  } else {
    return {
      headers: { ...event.headers, 'x-correlation-id': event.headers?.['x-correlation-id'] ?? createCorrelationId() },
      statusCode: result.status,
      body: JSON.stringify({
        responseType: 'FailedValidation',
        errors: result.errors,
      }),
    };
  }
};
