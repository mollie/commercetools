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
    authentication: {
      isBasicAuth: boolean;
      username?: string;
      password?: string;
    };
    enableRetry?: boolean;
  };
  service: {
    port: number | string;
    logLevel: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug';
    logTransports?: 'all' | 'file' | 'terminal';
    webhookUrl?: string;
    redirectUrl?: string;
    locale?: string; // should match regex ^[a-z]{2}_[A-Z]{2}$
  };
}
