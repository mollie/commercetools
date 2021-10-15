/**
 *
 * @param key
 * @param commercetoolsClient
 * @param projectKey
 * @param updateActions
 */
export async function updatePaymentByKey(commercetoolsClient: any, projectKey: string, key: string, version: number, updateActions: Array<Object>) {
  // console.log(updateActions)
  const updateRequest = {
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
    const response = await commercetoolsClient.execute(updateRequest);
    const { body: paymentObject } = response;
    return paymentObject;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
