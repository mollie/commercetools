import _ from 'lodash';
import app from './app';
import config from '../config/config';
import Logger from './logger/logger';

const port = config.port;

const _exit = _.once(() => {
  Logger.info('\nClosing http server.');
  server.close(() => {
    Logger.info('Http server closed.');
  });
});

const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

const server = app.listen(port, () => {
  Logger.info(`🚀 Notifications Module started on port: ${port} 🚀`);
  signals.forEach(signal => process.once(signal, _exit));
});
