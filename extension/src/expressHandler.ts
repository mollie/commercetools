import {Request, Response} from 'express';
import handleRequest from './requestHandlers/handleRequest';
import {HandleRequestInput, HandleRequestSuccess} from './types';
import actions from "./requestHandlers/actions";


export default async function handler(req: Request, res: Response) {
    const requestInput = new HandleRequestInput(req.path, req.method, req.body);
    const result = await handleRequest(requestInput);
    if (result instanceof HandleRequestSuccess) {
        return res.status(200).send({actions: actions});

    } else {
        return res.status(result.status).send({errors: result.errors});
    }
};
