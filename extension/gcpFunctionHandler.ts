import { Request, Response } from 'express'
import handleRequest from './src/requestHandlers/handleRequest'

const debug = require('@google-cloud/debug-agent').start({ allowExpressions: true })

debug.isReady().then(() => {
  console.log("debugger is initialised!")
})

exports.handler = async (req: Request, res: Response) => {  
  await handleRequest(req, res);
}
