export interface Config {
  port?: number | string;
  mollieApiKey: string;
  ctConfig: {
    projectKey: string;
    clientId: string;
    clientSecret: string;
    authUrl: string;
    host: string;
    scopes?: string[];
  };
}
