import morgan, { StreamOptions } from 'morgan';
import Logger from './logger';

const stream: StreamOptions = {
  write: message => Logger.http(message),
};

const morganMiddleware = morgan('tiny', { stream });

export default morganMiddleware;
