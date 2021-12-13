import express, { Application } from 'express';
import handler from '../expressHandler';
import morganMiddleware from './logger/morganMiddleware';

const app: Application = express();

app.use(morganMiddleware); // Logs from http level

app.get('/health', (req, res) => {
  res.send('Ok');
});

app.use(express.json());

app.use('/', handler);

export default app;