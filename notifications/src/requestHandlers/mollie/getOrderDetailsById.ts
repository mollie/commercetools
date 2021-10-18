import { MollieClient, Order, OrderEmbed } from '@mollie/api-client';

export default async function getOrderDetailsById(orderId: string, mollieClient: MollieClient): Promise<Order> {
  try {
    const order = await mollieClient.orders.get(orderId, { embed: [OrderEmbed.payments] });
    return order;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
