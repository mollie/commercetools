import { APIGatewayProxyEvent } from 'aws-lambda';
import { createCorrelationId } from './src/utils';
import handleRequest from './src/requestHandlers/handleRequest';
import { HandleRequestInput, HandleRequestSuccess, Action } from './src/types';
import Logger from './src/logger/logger';

exports.handler = async (event: APIGatewayProxyEvent) => {
  const body = event.body ? JSON.parse(event.body) : event;

  const headers = new Map([['authorization', event.headers?.['authorization'] ?? '']]);
  const input = new HandleRequestInput(event.path, event.httpMethod, body, headers);
  Logger.debug('LambdaHandler : event.path : ' + event.path);
  Logger.debug('LambdaHandler : input : ' + JSON.stringify(body));

  let result = await handleRequest(input);

  if (result instanceof HandleRequestSuccess) {
    Logger.debug('LambdaHandler : Success - ' + result.status);
    Logger.debug('Result : ' + JSON.stringify(result));
    return {
      responseType: 'UpdateRequest',
      actions: result.actions,
    };
  } else {
    Logger.debug('LambdaHandler : Error handling request - ' + result.status);
    Logger.debug('Errors : ' + JSON.stringify(result.errors));
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
