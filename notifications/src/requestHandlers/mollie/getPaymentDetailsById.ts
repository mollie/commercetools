import { MollieClient, PaymentEmbed } from '@mollie/api-client';
import Logger from '../../logger/logger';

export default async function getPaymentDetailsById(paymentId: string, mollieClient: MollieClient) {
  try {
    const payment = await mollieClient.payments.get(paymentId, { embed: [PaymentEmbed.refunds, PaymentEmbed.chargebacks] });
    return payment;
  } catch (error) {
    // Log full error at debug level
    Logger.debug({ error });
    throw error;
  }
}
