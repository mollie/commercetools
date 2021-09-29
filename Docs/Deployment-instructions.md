## Deploy to Google Cloud Function

Setting up the extension as a google cloud function requires an existing function, setting up entry point and secrets and uploading the source code.

1. Run `npm run zip-gcp-function` from the project root folder in the terminal
2. Upload the generated zip file to your google cloud function ([Guide to creating cloud functions](https://cloud.google.com/functions/docs#training-and-tutorials))
3. Add the `MOLLIE_TEST_API_KEY` to the function as `Runtime environment variables`
3. Set Runtime to `Node.js 14` and change entry point to `handler`
