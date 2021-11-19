import ServerlessHttp from 'serverless-http';
import app from './src/app';

<<<<<<< HEAD
const handler = ServerlessHttp(app);
exports.handler = async (event: any, context: any) => {
  return await handler(event, context);
=======
const mollieClient = createMollieClient({ apiKey: config.mollie.apiKey });

exports.handler = async () => {
  // Methods for the Payments API
  let methods = await mollieClient.methods.all();

  // Methods for the Orders API
  methods = await mollieClient.methods.all({ resource: 'orders' });
  return methods;
>>>>>>> develop
};
