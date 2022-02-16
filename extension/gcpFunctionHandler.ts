import { Request, Response } from 'express';
import handleRequest from './src/requestHandlers/handleRequest';
import { HandleRequestInput, HandleRequestSuccess } from './src/types';
import { createCorrelationId } from './src/utils';

exports.handler = async (req: Request, res: Response) => {
  const headers = new Map([['authorization', req?.headers?.authorization ?? '']]);
  const requestInput = new HandleRequestInput(req.path, req.method, req.body, headers);
  const result = await handleRequest(requestInput);
  res.setHeader('x-correlation-id', req?.headers?.['x-correlation-id'] ?? createCorrelationId());
  if (result instanceof HandleRequestSuccess) {
    if (result.actions && result.actions.length > 0) {
      return res.status(result.status).send({ actions: result.actions });
    } else {
      return res.status(result.status).end();
    }
  } else {
    if (result.errors && result.errors.length > 0) {
      return res.status(result.status).send({ errors: result.errors });
    } else {
      return res.status(result.status).end();
    }
  }
};
