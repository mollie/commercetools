import { Request, Response } from 'express';
import createMollieClient, { MollieClient } from '@mollie/api-client';
import { CTUpdatesRequestedResponse } from '../types/index';
import config from '../../config/config';
import actions from './actions';

const mollieApiKey = config.mollieApiKey;
const mollieClient = createMollieClient({ apiKey: mollieApiKey });

export default async function handleRequest(req: Request, res: Response) {
  if (req.path !== '/') return res.status(400).end();
  try {
    // Only accept '/' endpoint

    // add method check (POST)
    // add authorization check
    // response with error if any of those fail
    // if (authorisationResult) {

    // }

    // handle request based on action

    // validate/get action
    // const action:  = validateAction(request...)
    const action: string | undefined = 'getPaymentMethods';
    // error if unknown action
    if (!action) {
      // return error response
    }
    const { actions, errors, status } = await processAction(action, req, mollieClient);
    if (errors?.length) {
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

const processAction = async function (action: string, req: Request, mollieClient: MollieClient) {
  let result = {} as CTUpdatesRequestedResponse;
  switch (action) {
    case 'getPaymentMethods':
      result = await actions.getPaymentMethods(req, mollieClient);
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
