import winston from 'winston';
import config from '../../config/config';
// TODO: add google cloud logging with credentials correctly setup

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
};

// Define severity level based on LOG_LEVEL env
function level(): string {
  return config.service.logLevel;
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'blue',
  debug: 'white',
};
winston.addColors(colors);

// Format for files
const fileFormat = winston.format.combine(
  winston.format.uncolorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.splat(),
  winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`),
);
const currentDate = new Date();
const logFileName = `${currentDate.getUTCFullYear()}_${currentDate.getUTCMonth() + 1}_${currentDate.getUTCDate()}`;

// Format for terminal
const terminalFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.simple(),
  winston.format.splat(),
  winston.format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`),
);

let transports = [];

// Configure transports used with logTransports config
// This can be 'terminal', 'file' or 'all'
switch (config.service.logTransports) {
  case 'all':
    transports.push(
      new winston.transports.Console({
        format: terminalFormat,
      }),
      new winston.transports.File({
        level: level(),
        filename: `logs/${logFileName}.log`,
        format: fileFormat,
      }),
    );
    break;
  case 'file':
    transports.push(
      new winston.transports.File({
        level: level(),
        filename: `logs/${logFileName}.log`,
        format: fileFormat,
      }),
    );
    break;
  // Default to 'terminal' if logTransports not provided
  default:
    transports.push(
      new winston.transports.Console({
        format: terminalFormat,
      }),
    );
}

const Logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

export default Logger;
