import { Request, Response } from 'express';
import createMollieClient, { MollieClient } from '@mollie/api-client';
import { CTUpdatesRequestedResponse } from '../types/index';
import config from '../../config/config';
import actions from './actions';

const mollieApiKey = config.mollieApiKey;
const mollieClient = createMollieClient({ apiKey: mollieApiKey });

export default async function handleRequest(req: Request, res: Response) {
  // Only accept '/' endpoint
  if (req.path !== '/') return res.sendStatus(400);

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
