export interface Config {
  mollie: {
    apiKey: string;
  },
  service: {
    port: number | string;
    logLevel: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';
    logTransports?: 'all' | 'file' | 'terminal';
  }
}
