import {AzureFunction, Context, HttpRequest} from "@azure/functions"
import {HandleRequestInput, HandleRequestSuccess} from "./src/types";
import handleRequest from "./src/requestHandlers/handleRequest";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {

    /*
        The azure HttpRequest object doens't expose the path, it can be configured directly in the function config
        https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger?tabs=javascript
     */
    const requestInput = new HandleRequestInput('/', req.method, req.body);
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

export default httpTrigger;