import { MollieClient } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/binders/payments/refunds/parameters';
import { ControllerAction, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import formatErrorResponse from '../errorHandlers';
import Logger from '../logger/logger';
import { createDateNowString } from '../utils';
import { makeActions } from '../makeActions';
import { convertCTToMollieAmountValue } from '../utils';

/**
 * @param ctObject
 * ctObject contains createCustomRefundRequest custom field
 * Parse the stringified JSON and extract parameters required to call the mollie endpoint
 */
const extractParameters = (customRefundRequest: any): Promise<CreateParameters> => {
  try {
    const { interactionId: molliePaymentId, amount, description, metadata } = customRefundRequest;

    // Check for required fields, throw error if not present
    if (!molliePaymentId || !amount?.centAmount || !amount?.currencyCode) {
      throw new Error();
    }
    // Create refund parameters
    const refundParameters: CreateParameters = {
      paymentId: molliePaymentId,
      amount: {
        currency: amount?.currencyCode,
        value: convertCTToMollieAmountValue(amount?.centAmount, amount?.fractionDigits),
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
 * rather than partial or full line, or the whole order
 */
export async function createCustomRefund(ctObject: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    // Parse JSON and call mollie's create payment refund endpoint
    const parsedRequest = JSON.parse(ctObject?.custom?.fields?.createCustomRefundRequest);
    const createRefundParameters = await extractParameters(parsedRequest);
    const response = await mollieClient.payments_refunds.create(createRefundParameters);
    const { id: mollieRefundId } = response;

    // Create update actions
    const updateActions = [];
    updateActions.push(
      makeActions.setCustomField('createCustomRefundResponse', JSON.stringify(response)),
      makeActions.addInterfaceInteraction(ControllerAction.CreateCustomRefund, ctObject?.custom?.fields?.createCustomRefundRequest, JSON.stringify(response)),
      {
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
      },
    );

    // Return correct status and updates for CT
    return {
      status: 201,
      actions: updateActions,
    };
  } catch (error) {
    Logger.error(error);
    const errorResponse = formatErrorResponse(error);
    return errorResponse;
  }
}
