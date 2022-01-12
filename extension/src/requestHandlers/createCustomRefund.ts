import { MollieClient } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/binders/payments/refunds/parameters';
import { ControllerAction, CTPayment, CTTransaction, CTTransactionState, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import formatErrorResponse from '../errorHandlers';
import Logger from '../logger/logger';
import { makeActions } from '../makeActions';
import { makeMollieAmount } from '../utils';

function tryParseJSON(jsonString: string | undefined) {
  try {
    const parsed = JSON.parse(jsonString!);
    if (parsed && typeof parsed === 'object') return parsed;
  } catch (error) {
    return false;
  }
}

/**
 *
 * @param refundTransaction CTTransaction
 *
 * This currencly uses the interactionId to get the correct mollie payment to refund
 * This must be passed by the merchant or the call will fail
 */
const extractRefundParameters = (refundTransaction: CTTransaction): Promise<CreateParameters> => {
  try {
    const { interactionId: molliePaymentId, amount, custom } = refundTransaction;
    // Check for required fields, throw error if not present
    if (!molliePaymentId || !amount?.centAmount || !amount?.currencyCode) {
      throw new Error();
    }
    // interactionId --> mollie payment to make the refund against, we can make a call to mollie later to make this more robust
    const refundParameters: CreateParameters = {
      paymentId: molliePaymentId,
      amount: makeMollieAmount(amount),
    };

    if (custom?.fields?.description) {
      Object.assign(refundParameters, { description: custom.fields.description });
    }

    // Mollie accepts JSON or string as metadata
    // If metadata is incorrect stringified JSON, this string will be passed to mollie
    if (custom?.fields?.metadata) {
      const parsedMetadata = tryParseJSON(custom.fields.metadata);
      const metadata = parsedMetadata ? parsedMetadata : custom.fields.metadata;
      Object.assign(refundParameters, { metadata: metadata });
    }

    return Promise.resolve(refundParameters);
  } catch (error) {
    Logger.error(error);
    return Promise.reject({
      status: 400,
      title: 'Could not extract valid parameters to create Mollie payment refund. This must contain interactionId, amount',
      field: `Transaction id: ${refundTransaction.id}`,
    });
  }
};

/**
 *
 * @param ctPayment
 * @param mollieClient
 * Creates a refund using the refunds API instead of the Orders API
 * Assumes one refund is requested at a time
 * This currencly uses the interactionId to get the correct mollie payment to refund
 * This must be passed by the merchant or the call will fail.
 */
export async function createCustomRefund(ctPayment: CTPayment, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    // Get the refund transaction (initial), amount etc.
    const { transactions } = ctPayment;
    const refundTransaction = transactions!.find(({ type, state }) => type === CTTransactionType.Refund && state === CTTransactionState.Initial);

    // Create refund parameters
    const refundParams = await extractRefundParameters(refundTransaction!);

    // Call the refund
    const response = await mollieClient.payments_refunds.create(refundParams);
    const { id: mollieRefundId, createdAt: refundCreatedAt } = response;

    // Create update actions
    const updateActions: any = [];

    updateActions.push(makeActions.changeTransactionState(refundTransaction!.id!, CTTransactionState.Pending));
    updateActions.push(makeActions.changeTransactionInteractionId(refundTransaction!.id!, mollieRefundId));
    updateActions.push(makeActions.changeTransactionTimestamp(refundTransaction!.id!, refundCreatedAt));

    // InterfaceInteraction - TODO
    const interfaceRequest = {};
    const interaceResponse = {};
    updateActions.push(
      makeActions.addInterfaceInteraction({
        actionType: ControllerAction.CreateCustomRefund,
        requestValue: JSON.stringify(interfaceRequest),
        responseValue: JSON.stringify(interaceResponse),
        timestamp: response.createdAt,
      }),
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
