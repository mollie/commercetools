import _ from 'lodash';
import app from './app';
import config from '../config/config';
import Logger from './logger/logger';

const port = config.service.port;

const _exit = _.once(() => {
  Logger.info('Closing http server.');
  server.close(() => {
    Logger.info('Http server closed.');
  });
});

const signals : NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

const server = app.listen(port, () => {
  Logger.info(`🚀 Server started on port: ${port} 🚀`);
  signals.forEach(signal => process.once(signal, _exit));
});
