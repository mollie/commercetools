// import { Request, Response } from 'express';
import ServerlessHttp from 'serverless-http';
import handleRequest from './src/requestHandlers/handleRequest';
import app from './src/app';

const handler = ServerlessHttp(app);
exports.handler = async (event: any, context: any) => {
  return await handler(event, context);
};
