// This script will create custom field types on commercetools.

const axios = require('axios');
const fs = require('fs');
const customTypes = require('./custom-types.json');

function setup_types(options) {
  axios(options)
    .then(function (response) {
      console.log(`Type ${response.data.key} setup correctly`);
    })
    .catch(function (error) {
      if (error.response.status === 400) {
        console.log(`Type setup failed - ${error.message}. Did you already set up custom types for this project?`);
      } else if (error.response.status === 403) {
        console.log(`Type setup failed - ${error.message}. Check API url and projectKey are correctly set in config.`);
      } else {
        console.log(`Type setup failed - ${error.message}.`);
      }
    });
}

if (!process.env.CT_CREDENTIALS) {
  throw new Error('Environment variable not set. Point it to the config file.');
}

var ctMollieConfig = fs
  .readFileSync(process.env.CT_CREDENTIALS, 'utf8')
  .split('\n')
  .filter(item => item);
ctMollieConfig = ctMollieConfig.filter(item => item);

const ctMollieConfigObject = Object.fromEntries(ctMollieConfig.map(s => s.split('=')));

const host = ctMollieConfigObject.CTP_API_URL;
const authUrl = ctMollieConfigObject.CTP_AUTH_URL;
const projectKey = ctMollieConfigObject.CTP_PROJECT_KEY;
const clientId = ctMollieConfigObject.CTP_CLIENT_ID;
const clientSecret = ctMollieConfigObject.CTP_CLIENT_SECRET;

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
