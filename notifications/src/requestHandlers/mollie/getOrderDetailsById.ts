import { MollieClient, Order, OrderEmbed } from '@mollie/api-client';
import Logger from '../../logger/logger';

export default async function getOrderDetailsById(orderId: string, mollieClient: MollieClient): Promise<Order> {
  try {
    const order = await mollieClient.orders.get(orderId, { embed: [OrderEmbed.payments] });
    return order;
  } catch (error) {
    // Log full error at debug level
    Logger.debug({ error });
    throw error;
  }
}
