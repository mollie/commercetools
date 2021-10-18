import { CTPayment } from '../../types/ctPaymentTypes';
/**
 *
 * @param key
 * @param commercetoolsClient
 * @param projectKey
 * @returns CTPayment object
 * Returns CommerceTools Payment
 * https://docs.commercetools.com/api/projects/payments#representations
 */
export async function getPaymentByKey(key: string, commercetoolsClient: any, projectKey: string): Promise<CTPayment> {
  const getPaymentByKeyRequest = {
    uri: `/${projectKey}/payments/key=${key}`,
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  try {
    const response = await commercetoolsClient.execute(getPaymentByKeyRequest);
    const { body: paymentObject } = response;
    return paymentObject as CTPayment;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
