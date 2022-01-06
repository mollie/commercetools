import express, { Application } from 'express';
import handler from '../expressHandler';

const app: Application = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.send('Ok');
});

app.use('/', handler);

export default app;
