import { MollieClient, List, Method } from "@mollie/api-client"
import { Request } from "express"
import { CTActionResponse } from "../types"
import { createDateNowString } from "../utils"

export default async function getPaymentMethods(req: Request, mollieClient: MollieClient) {
  try {
    const methods: List<Method> = await mollieClient.methods.all()
    const ctResponse: CTActionResponse = {
      actions: [
        {
          action: "addInterfaceInteraction",
          type: {
            key: "ct-mollie-integration-interface-interaction-type"
          },
          fields:
          {
            actionType: "getPaymentMethods",
            request: JSON.stringify(req.body?.custom?.fields?.paymentMethodsRequest),
            response: JSON.stringify(methods),
            createdAt: createDateNowString(),
          }
        },
        {
          action: "setCustomField",
          name: "paymentMethodsResponse",
          value: JSON.stringify(methods)
        },
      ]
    }
    return ctResponse
  } catch (error: any) {
    console.warn(error)
    return error
  }

}