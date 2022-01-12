# Setting up the Custom types on commercetools

Every outgoing call to commercetools has an extension action. This extension action uses custom fields, which need to be created.

In order to create these custom fields, first you should make sure your environment variables are correctly set, like so:

```
export CT_MOLLIE_CONFIG='{"mollie":{"apiKey":"<MOLLIE_API_KEY>"},"commercetools":{"authUrl":"<COMMERCETOOLS_AUTH_URL>","clientId":"<COMMERCETOOLS_CLIENT_ID>","clientSecret":"<COMMERCETOOLS_CLIENT_SECRET>","host":"<COMMERCETOOLS_HOST_URL>","projectKey":"<COMMERCETOOLS_PROJECT_KEY>"},"service":{"locale":"LOCALE"}}'
```

Once this is correctly set, you can call the setup custom types script by navigating to the extension/ directory and running:

```
npm run setup-types
```

You should see confirmation that 3 types, for payment, transaction and interface interaction were correctly set up.
