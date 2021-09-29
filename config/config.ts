import { Config } from './config-model'

export const config: Config = {
  port: 3000,
  mollieApiKey: process.env.MOLLIE_TEST_API_KEY || 'testMollieKey'
}
