import { CTPayment } from '../../types/ctPayment';
import Logger from '../../logger/logger';

/**
 *
 * @param key
 * @param commercetoolsClient
 * @param projectKey
 * @param version
 * @param updateActions
 * @returns CTPayment object
 * Returns commercetools Payment
 * https://docs.commercetools.com/api/projects/payments#representations
 */
export async function updatePaymentByKey(key: string, commercetoolsClient: any, projectKey: string, version: number, updateActions: any): Promise<CTPayment> {
  const updatePaymentByKeyRequest = {
    uri: `/${projectKey}/payments/key=${key}`,
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: {
      version,
      actions: updateActions,
    },
  };
  try {
    const response = await commercetoolsClient.execute(updatePaymentByKeyRequest);
    const { body: paymentObject } = response;
    return paymentObject as CTPayment;
  } catch (error) {
    Logger.debug('Error in updatePaymentByKey');
    throw error;
  }
}
