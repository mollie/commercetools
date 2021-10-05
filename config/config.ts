import { Config } from './config-model'

function loadConfig() {
  try {
    // Parse env config
    const envConfig = JSON.parse(process.env.CT_MOLLIE_CONFIG || '')

    // Allow missing parts of config and fill in with defaults
    const config: Config = {
      port: envConfig.port || 3000,
      // TODO: Move this to test config/setup
      mollieApiKey: envConfig.mollieApiKey || 'mollieApiKey',
      ...envConfig
    }
    return config
  } catch (e) {
    throw new Error(
      'Commercetools - Mollie Integration configuration is missing or not provided in the valid JSON format'
    )
  }
}

export const config = loadConfig()

export default config