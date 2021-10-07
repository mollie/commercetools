import { Request, Response } from 'express'
import config from './config/config'
import createMollieClient, { List, Method } from '@mollie/api-client'
import { processAction } from './src/requestHandlers/handleRequest'

const mollieApiKey = config.mollieApiKey

const mollieClient = createMollieClient({ apiKey: mollieApiKey })

exports.handler = async (req: Request, res: Response) => {

  // validate/get action
  // const action:  = validateAction(request...)
  const action: string | undefined = 'getPaymentMethods'
  // error if unknown action
  if (!action) {
    // return error response
  }

  try {
    const result = await processAction(action, req, mollieClient)
    res.status(200).send(result)
  } catch (error: any) {
    console.warn(error)
    res.status(400).send(error.message)
  }
}
