// List of custom fields we will use
// This script will create those custom fields on CT

const axios = require('axios');
const customTypes = require('./custom-types.json');

function setup_types(options) {
  axios(options)
    .then(function (response) {
      console.log(`Type ${response.data.key} setup correctly`);
    })
    .catch(function (error) {
      console.log(`Type setup failed - ${error.message}. Check host and projectKey are correctly set in config.`);
    });
}

const ctMollieConfig = process.env.CT_MOLLIE_CONFIG;
if (!ctMollieConfig) {
  throw new Error('Config file not set');
}

const { commercetools } = JSON.parse(ctMollieConfig);

const host = commercetools.host;
const authUrl = commercetools.authUrl;
const projectKey = commercetools.projectKey;
const clientId = commercetools.clientId;
const clientSecret = commercetools.clientSecret;

if (!host || !authUrl || !projectKey || !clientId || !clientSecret) {
  throw new Error('Config file missing parameters. Needs host, projectKey, clientId and clientSecret');
}

const authOptions = {
  url: `${authUrl}/oauth/token?grant_type=client_credentials`,
  method: 'POST',
  headers: {
    Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
  },
};

axios(authOptions)
  .then(function (response) {
    // Axios config for setting up custom payment type
    const typeOptions = {
      url: `${host}/${projectKey}/types`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${response.data.access_token}`,
      },
      data: JSON.stringify(customTypes.paymentType),
    };
    setup_types(typeOptions);

    // Modify for custom transaction type
    typeOptions.data = JSON.stringify(customTypes.transactionType);
    setup_types(typeOptions);

    // Modify for the interface interaction types
    typeOptions.data = JSON.stringify(customTypes.interactionType);
    setup_types(typeOptions);
  })
  .catch(function (error) {
    console.log(`Authorization failure - ${error.message}. Check clientId and clientSecret are correctly set in config.`);
  });
