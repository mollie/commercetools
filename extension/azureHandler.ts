import {AzureFunction, Context, HttpRequest} from "@azure/functions"
import {HandleRequestInput, HandleRequestSuccess} from "./src/types";

loadSettings();

import handleRequest from "./src/requestHandlers/handleRequest";
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {

    /*
        The azure HttpRequest object does not expose the path, it can be configured directly in the function config
        https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=javascript
     */
    const requestInput = new HandleRequestInput('/', req.method!.toString(), req.body);
    const result = await handleRequest(requestInput);
    if (result instanceof HandleRequestSuccess) {
        context.res = {
            status: 200,
            body: {actions: result.actions}
        }
    } else {
        context.res = {
            status: result.status,
            body: {actions: result.errors}
        }
    }
};
function loadSettings(){
    const config = {
        commercetools: {
            authUrl: process.env["CT_MOLLIE_CONFIG:commercetools:authUrl"],
            clientId: process.env["CT_MOLLIE_CONFIG:commercetools:clientId"],
            clientSecret: process.env["CT_MOLLIE_CONFIG:commercetools:clientSecret"],
            host: process.env["CT_MOLLIE_CONFIG:commercetools:host"],
            projectKey: process.env["CT_MOLLIE_CONFIG:commercetools:projectKey"]
        },
        mollie: {
            apiKey: process.env["CT_MOLLIE_CONFIG:mollie:apiKey"]
        },
        service: {
            port: process.env["CT_MOLLIE_CONFIG:service:port"],
            logLevel: process.env["CT_MOLLIE_CONFIG:service:logLevel"],
            logTransports: process.env["CT_MOLLIE_CONFIG:service:logTransports"],
        }

    }
    process.env.CT_MOLLIE_CONFIG = JSON.stringify(config);
}

export default httpTrigger;