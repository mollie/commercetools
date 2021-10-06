import { createMollieClient } from '@mollie/api-client';
import { config } from './config/config';

const mollieClient = createMollieClient({ apiKey: config.mollieApiKey });

exports.handler = async () => {
  // Methods for the Payments API
  let methods = await mollieClient.methods.all();

  // Methods for the Orders API
  methods = await mollieClient.methods.all({ resource: 'orders' });
  return methods;
};
