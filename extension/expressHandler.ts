import { Request, Response } from 'express';
import handleRequest from './src/requestHandlers/handleRequest';
import { HandleRequestInput, HandleRequestSuccess } from './src/types';

export default async function handler(req: Request, res: Response) {
    const requestInput = new HandleRequestInput(req.path, req.method, req.body);

    const result = await handleRequest(requestInput);
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