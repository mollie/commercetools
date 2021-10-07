import { Request, Response } from "express"
import createMollieClient, { MollieClient } from '@mollie/api-client'
import config from '../../config/config'
import actions from './actions'

const mollieApiKey = config.mollieApiKey
const mollieClient = createMollieClient({ apiKey: mollieApiKey })

export default async function handleRequest(req: Request, res: Response) {
  // Only accept '/' endpoint
  if (req.path !== '/') return res.sendStatus(400)

  // add method check (POST)
  // add authorization check
  // response with error if any of those fail
  // if (authorisationResult) {

  // }

  // handle request based on action

  // validate/get action
  // const action:  = validateAction(request...)
  const action: string | undefined = 'getPaymentMethods'
  // error if unknown action
  if (!action) {
    // return error response
  }
  const actionResult = await processAction(action, req, mollieClient)
  return res.send(actionResult)
}

const processAction = function (action: string, req: Request, mollieClient: MollieClient) {
  let result = {}
  switch (action) {
    case 'getPaymentMethods':
      result = actions.getPaymentMethods(req, mollieClient)
      break
    default:
      // TODO: Implement once errors are defined
      result = 'someErrorObject'
  }
  // Transform this for CT acceptable object
  return result
}

export {
  processAction
}