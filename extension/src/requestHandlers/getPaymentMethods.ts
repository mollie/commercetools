import { MollieClient, List, Method } from "@mollie/api-client"
import { Request } from "express"
import { CTActionResponse } from "../types"

export default async function getPaymentMethods(req: Request, mollieClient: MollieClient) {
  try {
    const methods: List<Method> = await mollieClient.methods.all()
    const availablePaymentMethods: string = (methods.length > 0) ? JSON.stringify(methods) : "NO_AVAILABLE_PAYMENT_METHODS"
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
            request: JSON.stringify(req.body.custom?.fields?.paymentMethodsRequest),
            response: availablePaymentMethods,
            // TODO: Extract this into a util function to have it unified
            createdAt: new Date().toISOString(),
          }
        },
        {
          action: "setCustomField",
          name: "paymentMethodsResponse",
          value: availablePaymentMethods
        },
      ]
    }
    return ctResponse
  } catch (error: any) {
    console.warn(error)
    return error
  }

}