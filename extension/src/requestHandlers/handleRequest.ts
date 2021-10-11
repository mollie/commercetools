import { Request, Response } from 'express';
import createMollieClient, { MollieClient } from '@mollie/api-client';
import { CTUpdatesRequestedResponse } from '../types/index';
import config from '../../config/config';
import actions, { validateAction } from './actions';

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

  // validate/get action
  const action = validateAction(req.body)

  if (!action) {
    // return error response, this is just temporary so that TS doesn't complain!!
    return res.status(400)
  }

  const { actions, errors, status } = await processAction(action, req.body, mollieClient);
  if (errors?.length) {
    return res.status(status).send({ errors: errors });
  } else {
    return res.status(status).send({ actions: actions });
  }
}

const processAction = async function (action: string, body: any, mollieClient: MollieClient) {
  let result = {} as CTUpdatesRequestedResponse;
  switch (action) {
    case 'getPaymentMethods':
      result = await actions.getPaymentMethods(body.resource.obj, mollieClient);
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
