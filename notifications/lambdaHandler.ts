import { APIGatewayProxyEvent } from 'aws-lambda';
import handleRequest from './src/requestHandlers/handleRequest';
import { HandleRequestInput, HandleRequestSuccess } from './src/types/requestHandler';
import querystring from 'querystring'

exports.handler = async function (event: APIGatewayProxyEvent) {
  const body = event.isBase64Encoded ?
    Buffer.from(event.body!, 'base64').toString('utf8') :
    event.body!;

  const input = new HandleRequestInput(event.path, event.httpMethod, querystring.parse(body));

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
