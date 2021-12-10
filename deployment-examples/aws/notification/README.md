
# Deploy notification module to AWS with SAM

## Requirements

  [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-getting-started.html)
  [NPM](https://nodejs.org/en)

## Configure

Set valid Mollie & Commercetools configuration values in the template.yaml

```yaml
Environment:

Variables:

CT_MOLLIE_CONFIG: >-

{"mollie":{"apiKey":"API_KEY"},"commercetools":{"authUrl":"AUTH_URL","clientId":"CLIENT_ID","clientSecret":"CLIENT_SECRET","host":"HOST_URL","projectKey":"PROJECT_KEY"}}
```

Define the stage name for the api gateway

```yaml
MollieCommerceToolsNotificationFunctionAPI:
 Type: AWS::Serverless::Api
  Properties:
   StageName: test
```

## Deploy the function for the first time

```bash
npm --prefix ../../../notifications run sam-prepare
```

```bash
sam build
```

```bash
sam deploy --guided
```

```bash
rm -rf build/
```

## Making changes and deploy

After any change it is required to build the application before deployment

```bash
sam build
```

```bash
sam deploy
```

```bash
rm -rf build/
```

## Call your function

The API Gateway address is defined in the output of the deploy command  in the key *MollieCommerceToolsNotificationFunctionAPI*

Remember to add the stage name to the end of this url

<https://o494mji000.execute-api.eu-west-1.amazonaws.com/{STAGE>}
