import express, { Application } from 'express';
import handler from '../expressHandler';

const app: Application = express();

app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.send('Ok');
});

app.use('/', handler);

export default app;
