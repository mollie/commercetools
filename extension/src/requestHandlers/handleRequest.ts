import { Request, Response } from 'express';
import createMollieClient, { MollieClient } from '@mollie/api-client';
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
  const actionResult = await processAction(action, req.body, mollieClient);
  return res.send(actionResult);
}

const processAction = function (action: string, body: any, mollieClient: MollieClient) {
  let result = {};
  switch (action) {
    case 'getPaymentMethods':
      result = actions.getPaymentMethods(body.resource.obj, mollieClient);
      break;
    default:
      // TODO: Implement once errors are defined
      result = 'someErrorObject';
  }
  // Transform this for CT acceptable object
  return result;
};

export { processAction };
