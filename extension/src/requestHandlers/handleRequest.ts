import { Request, Response } from 'express';
import createMollieClient, { MollieClient } from '@mollie/api-client';
import Debug from 'debug';
import { CTUpdatesRequestedResponse, ControllerAction } from '../types/index';
import config from '../../config/config';
import actions, { validateAction } from './actions';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';

const debug = Debug('extension:handleRequest');
const mollieApiKey = config.mollieApiKey;
const mollieClient = createMollieClient({ apiKey: mollieApiKey });

export default async function handleRequest(req: Request, res: Response) {
  if (req.path !== '/') return res.status(400).end();
  try {
    // add method check (POST)
    // add authorization check
    // response with error if any of those fail
    // if (authorisationResult) {

    // }

    const action = validateAction(req.body);

    if (action === ControllerAction.Invalid) {
      debug('No action, returning error');
      const error = formatMollieErrorResponse({ status: 400 });
      return res.send(error);
    }

    const { actions, errors, status } = await processAction(action, req.body, mollieClient);
    if (errors?.length) {
      debug('Process action errors');
      return res.status(status).send({ errors: errors });
    } else {
      return res.status(status).send({ actions: actions });
    }
  } catch (error: any) {
    // TODO - check this does not expose PII in stacktrace
    console.warn(error);
    // From Node's Error object: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
    const errorMessage = `error_name: ${error.name}, error_message: ${error.message}`;
    return res.status(400).send({
      errors: [{ code: 'General', message: errorMessage }],
    });
  }
}

const processAction = async function (action: ControllerAction, body: any, mollieClient: MollieClient) {
  let result = {} as CTUpdatesRequestedResponse;
  switch (action) {
    case ControllerAction.GetPaymentMethods:
      debug(`action: ${ControllerAction.GetPaymentMethods}`);
      result = await actions.getPaymentMethods(body?.resource?.obj, mollieClient);
      break;
    case ControllerAction.CreateOrder:
      debug(`action: ${ControllerAction.CreateOrder}`);
      result = await actions.createOrder(body, mollieClient);
      break;
    default:
      result = {
        status: 400,
        errors: [
          {
            code: 'InvalidOperation',
            message: 'Error processing request, please check request and try again',
          },
        ],
      };
  }
  return result;
};

export { processAction };
