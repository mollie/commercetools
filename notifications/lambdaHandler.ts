import { Request, Response } from 'express'
import { createMollieClient } from '@mollie/api-client';
import config from './config/config';

const mollieClient = createMollieClient({ apiKey: config.mollieApiKey });

exports.handler = async (req: Request, res: Response) => {
  res.status(200).end()
};
