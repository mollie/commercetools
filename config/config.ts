export function loadConfig(): any {
  let config: JSON;
  try {
    config = JSON.parse(process.env.MOLLIE_CONFIG || '');
  } catch (e) {
    throw new Error('No config file found');
  }
  return config;
}
