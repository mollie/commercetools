import { MollieClient, PaymentEmbed } from '@mollie/api-client';
import Logger from '../../logger/logger';

export default async function getPaymentDetailsById(paymentId: string, mollieClient: MollieClient) {
  try {
    const payment = await mollieClient.payments.get(paymentId, { embed: [PaymentEmbed.refunds, PaymentEmbed.chargebacks] });
    return payment;
  } catch (error: any) {
    Logger.debug('Error in getPaymentDetailsById');
    if (error.status === 404) {
      return Promise.reject({ status: 404, source: 'mollie', message: error.message });
    } else {
      throw error;
    }
  }
}
