import { MollieClient, PaymentEmbed } from '@mollie/api-client';

export default async function getPaymentDetailsById(paymentId: string, mollieClient: MollieClient) {
  try {
    const payment = await mollieClient.payments.get(paymentId, { embed: [PaymentEmbed.refunds, PaymentEmbed.chargebacks] });
    return payment;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
