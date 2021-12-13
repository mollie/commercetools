export interface Config {
  mollie: {
    apiKey: string;
  };
  commercetools: {
    projectKey: string;
    clientId: string;
    clientSecret: string;
    authUrl: string;
    host: string;
    scopes?: string[];
  };
  service: {
    port: number | string;
    logLevel: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';
    logTransports?: 'all' | 'file' | 'terminal';
    notificationsModuleUrl: string;
    redirectUrl: string;
    locale: string;
  };
}
