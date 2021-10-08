import { Request, Response } from 'express';
import createMollieClient, { MollieClient } from '@mollie/api-client';
import config from '../../config/config';

const mollieApiKey = config.mollieApiKey;
const mollieClient = createMollieClient({ apiKey: mollieApiKey });

export default async function handleRequest(req: Request, res: Response) {
  // Only accept '/' endpoint
  if (req.path !== '/') return res.sendStatus(400);
  else return res.sendStatus(200);
}
