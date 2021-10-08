import { Request, Response } from 'express'
import config from './config/config'
import createMollieClient, { List, Method } from '@mollie/api-client'

const mollieApiKey = config.mollieApiKey

const mollieClient = createMollieClient({ apiKey: mollieApiKey })

exports.handler = async (req: Request, res: Response) => {
  try {
    res.status(200).end()
  } catch (error: any) {
    console.warn(error)
    res.status(400).send(error.message)
  }
}
