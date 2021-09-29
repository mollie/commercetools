import { config } from './config/config';
import createMollieClient, { List, Method } from '@mollie/api-client';

const mollieApiKey = config.mollieApiKey

const mollieClient = createMollieClient({ apiKey: mollieApiKey });

exports.handler = async (req, res) => {
  // Methods for the Orders API
  try {
    const methods: List<Method> = await mollieClient.methods.all();
    res.status(200).send(methods)
  } catch (error) {
    console.warn(error);
    res.status(400).send(error.message)
  }
}
