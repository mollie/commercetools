import { MollieClient } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/resources/payments/refunds/parameters';
import { ControllerAction, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import Logger from '../logger/logger';
import { amountMapper, createDateNowString, createResponseUpdateActions } from '../utils';

/**
 * @param ctObject
 * ctObject contains createCustomRefundRequest custom field
 * Parse the stringified JSON and extract paymentId, amount etc. for mollie call
 */
const extractParameters = (customRefundRequest: any): Promise<CreateParameters> => {
  try {
    const { interactionId: molliePaymentId, amount, description, metadata } = customRefundRequest;

    // Check for required fields, throw error if not present
    if (!molliePaymentId || !amount?.centAmount || !amount?.currencyCode) {
      throw new Error(`Required fields missing from createCustomRefundRequest. Must contain interactionId, amount`);
    }
    // Create refund parameters
    const refundParameters: CreateParameters = {
      paymentId: molliePaymentId,
      amount: {
        currency: amount.currencyCode,
        value: amountMapper({ centAmount: amount.centAmount, fractionDigits: amount?.fractionDigits }), // update when new method is in develop
      },
    };
    if (description) Object.assign(refundParameters, { description });
    if (metadata) Object.assign(refundParameters, { metadata });
    return Promise.resolve(refundParameters);
  } catch (error) {
    Logger.error(error);
    return Promise.reject({ status: 400, title: 'Could not extract valid parameters to create Mollie payment refund. This must contain interactionId, amount', field: 'createCustomRefundRequest' });
  }
};

/**
 *
 * @param ctObject
 * @param mollieClient
 * Creates a refund using the refunds API instead of the Orders API
 * This is used when the merchant wishes to refund an arbitrary amount,
 * rather than parial or whole line, or order
 */
export async function createCustomRefund(ctObject: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    // Parse JSON and call mollie's create payment refund endpoint
    const parsedRequest = JSON.parse(ctObject?.custom?.fields?.createCustomRefundRequest);
    const createRefundParameters = await extractParameters(parsedRequest);
    const response = await mollieClient.payments_refunds.create(createRefundParameters);
    const { id: mollieRefundId } = response;

    // Create update actions
    const updateActions = createResponseUpdateActions(ctObject?.custom?.fields?.createCustomRefundRequest, response, ControllerAction.CreateCustomRefund, 'createCustomRefundResponse');
    updateActions.push({
      action: 'addTransaction',
      transaction: {
        interactionId: mollieRefundId,
        amount: {
          centAmount: parsedRequest.amount.centAmount,
          currencyCode: parsedRequest.amount.currencyCode,
          fractionDigits: parsedRequest.amount?.fractionDigits ?? 2,
        },
        type: CTTransactionType.Refund,
        timestamp: createDateNowString(),
      },
    });

    // Return correct status and updates for CT
    return {
      status: 201,
      actions: updateActions,
    };
  } catch (error) {
    Logger.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
