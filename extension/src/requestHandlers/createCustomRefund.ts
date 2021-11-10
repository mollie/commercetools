import { MollieClient, Refund } from '@mollie/api-client';
import { CreateParameters } from '@mollie/api-client/dist/types/src/resources/payments/refunds/parameters';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import Logger from '../logger/logger';
import { CTUpdatesRequestedResponse } from '../types';
import { amountMapper } from '../utils';

/**
 * @param ctObject
 * ctObject contains createCustomRefundRequest custom field
 * Parse the stringified JSON and extract paymentId, amount etc. for mollie call
 */
const extractParameters = (ctObject: any): Promise<CreateParameters> => {
  try {
    const parsedRequest = JSON.parse(ctObject?.custom?.fields?.createCustomRefundRequest);
    const { interactionId: molliePaymentId, amount, description, metadata } = parsedRequest;
    const refundParameters: CreateParameters = {
      paymentId: molliePaymentId,
      amount: {
        currency: amount?.currencyCode,
        value: amountMapper({ centAmount: amount?.centAmount }), // update when new method is in develop
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

export async function createCustomRefund(ctObject: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const createRefundParameters = await extractParameters(ctObject);
    const response = await mollieClient.payments_refunds.create(createRefundParameters);
    Logger.debug(response);
    return {
      status: 201,
      actions: [
        {
          action: 'setCustomField',
          name: 'createCustomRefundResponse',
          value: 'Placeholder - to prevent API extension being triggered by Notifications',
        },
      ],
    };
  } catch (error) {
    Logger.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
