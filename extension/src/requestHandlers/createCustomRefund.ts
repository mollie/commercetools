import { MollieClient, PaymentMethod, Refund } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/binders/payments/refunds/parameters';
import { Action, ControllerAction, CTPayment, CTTransaction, CTTransactionState, CTTransactionType, CTUpdatesRequestedResponse } from '../types';
import formatErrorResponse from '../errorHandlers';
import Logger from '../logger/logger';
import { makeActions } from '../makeActions';
import { makeMollieAmount, isPayLater, tryParseJSON } from '../utils';

/**
 *
 * @param refundTransaction CTTransaction
 * @param molliePaymentId string - the id of the payment on mollie against which to make the refund
 *
 */
const extractRefundParameters = (refundTransaction: CTTransaction, molliePaymentId: string): Promise<CreateParameters> => {
  try {
    const { amount, custom } = refundTransaction;
    // Check for required fields, throw error if not present
    if (!molliePaymentId || !amount?.centAmount || !amount?.currencyCode) {
      throw new Error();
    }

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

const findSuccessfulCharge = (transactions: CTTransaction[]) => {
  return transactions.find(({ state, type }) => state === CTTransactionState.Success && type === CTTransactionType.Charge);
};

const findSuccessfulAuthorization = (transactions: CTTransaction[]) => {
  return transactions.find(({ state, type }) => state === CTTransactionState.Success && type === CTTransactionType.Authorization);
};

const findSuccessfulPayment = (isPayLater: boolean, transactions: CTTransaction[]): Promise<CTTransaction> => {
  const successfulPayment = isPayLater ? findSuccessfulAuthorization(transactions) : findSuccessfulCharge(transactions);
  if (successfulPayment) {
    return Promise.resolve(successfulPayment);
  } else {
    return Promise.reject({ status: 400, title: 'Cannot find corresponding Payment to refund against' });
  }
};

const createCtActions = (refundTransaction: CTTransaction, originalPaymentTransaction: CTTransaction, mollieRefund: Refund): Action[] => {
  // Create update actions
  const updateActions: Action[] = [];

  updateActions.push(makeActions.changeTransactionState(refundTransaction!.id!, CTTransactionState.Pending));
  updateActions.push(makeActions.changeTransactionInteractionId(refundTransaction!.id!, mollieRefund.id));
  updateActions.push(makeActions.changeTransactionTimestamp(refundTransaction!.id!, mollieRefund.createdAt));

  const interfaceRequest = { refundTransaction: refundTransaction!.id!, refundRequested: refundTransaction?.amount };
  const interaceResponse = { originalTransaction: originalPaymentTransaction.id, molliePaymentId: originalPaymentTransaction.interactionId, refundTransaction: refundTransaction!.id! };
  updateActions.push(
    makeActions.addInterfaceInteraction({
      actionType: ControllerAction.CreateCustomRefund,
      requestValue: JSON.stringify(interfaceRequest),
      responseValue: JSON.stringify(interaceResponse),
      timestamp: mollieRefund.createdAt,
    }),
  );

  return updateActions;
};

/**
 *
 * @param ctPayment
 * @param mollieClient
 * Creates a refund using the refunds API instead of the Orders API
 * Assumes one refund is requested at a time
 * This uses the Transaction (Charge or Authorization) which contained the original payment to
 * get the mollie payment id.
 */
export async function createCustomRefund(ctPayment: CTPayment, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  Logger.debug('createCustomRefund : ctPayment : ' + JSON.stringify(ctPayment));
  try {
    // Get the refund transaction (initial), amount etc.
    const { transactions } = ctPayment;
    const refundTransaction = transactions!.find(({ type, state }) => type === CTTransactionType.Refund && state === CTTransactionState.Initial);

    // Get the payment transaction and its id
    const isPayLaterMethod = isPayLater(ctPayment.paymentMethodInfo.method as PaymentMethod);
    const paymentTransaction = await findSuccessfulPayment(isPayLaterMethod, transactions!);

    // Create refund parameters
    const refundParams = await extractRefundParameters(refundTransaction!, paymentTransaction.interactionId!);

    // Call the refund
    const response = await mollieClient.payments_refunds.create(refundParams);

    // Create update actions
    const updateActions = createCtActions(refundTransaction!, paymentTransaction, response);

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
