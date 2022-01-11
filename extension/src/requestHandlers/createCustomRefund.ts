import { MollieClient } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/binders/payments/refunds/parameters';
import { ControllerAction, CTPayment, CTTransaction, CTTransactionState, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import formatErrorResponse from '../errorHandlers';
import Logger from '../logger/logger';
import { makeActions } from '../makeActions';
import { makeMollieAmount } from '../utils';

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
    if (custom?.fields?.metadata) {
      const parsedMetadata = JSON.parse(custom.fields.metadata); // try / catch ?
      Object.assign(refundParameters, { description: parsedMetadata });
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
    const { id: mollieRefundId } = response;

    // Create update actions
    const updateActions: any = [];

    // Update status - pending
    updateActions.push(makeActions.changeTransactionState(refundTransaction!.id!, CTTransactionState.Pending));
    // Update interaction -- refund id
    updateActions.push(makeActions.changeTransactionInteractionId(refundTransaction!.id!, response.id));

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
