import {Request, Response} from 'express';
import handleRequest from './src/requestHandlers/handleRequest';
import {HandleRequestInput, HandleRequestSuccess} from './src/types';
import actions from "./src/requestHandlers/actions";


export default async function handler(req: Request, res: Response) {
    const requestInput = new HandleRequestInput(req.path, req.method, req.body);
    const result = await handleRequest(requestInput);
    if (result instanceof HandleRequestSuccess) {
        return res.status(200).send({actions: result.actions});

    } else {
        return res.status(result.status).send({errors: result.errors});
    }
};