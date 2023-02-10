import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { HandleRequestInput, HandleRequestSuccess } from './src/types';
import handleRequest from './src/requestHandlers/handleRequest';
import { createCorrelationId } from './src/utils';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  /*
        The azure HttpRequest object does not expose the path, it can be configured directly in the function config
        https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=javascript
     */
  const requestInput = new HandleRequestInput('/', req.method!.toString(), req.body);
  const result = await handleRequest(requestInput);
  if (result instanceof HandleRequestSuccess) {
    context.res = {
      headers: { ...context?.res?.headers, 'x-correlation-id': req.headers['x-correlation-id'] ?? createCorrelationId() },
      status: result.status,
      body: { actions: result.actions },
    };
  } else {
    context.res = {
      headers: { ...context?.res?.headers, 'x-correlation-id': req.headers['x-correlation-id'] ?? createCorrelationId() },
      status: result.status,
      body: { errors: result.errors },
    };
  }
};

export default httpTrigger;
