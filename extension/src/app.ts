import express, { Application } from 'express';
import handleRequest from './requestHandlers/handleRequest';
import morganMiddleware from './logger/morganMiddleware';

const app: Application = express();

app.use(morganMiddleware); // Logs from http level

app.get('/health', (req, res) => {
  res.send('Ok');
});

app.use(express.json());

app.use('/', handleRequest);

export default app;
