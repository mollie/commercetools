import { MollieClient, OrderEmbed } from '@mollie/api-client';

export default async function getOrderDetailsById(orderId: string, mollieClient: MollieClient) {
  try {
    const order = await mollieClient.orders.get(orderId, { embed: [OrderEmbed.payments] });
    return order;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
