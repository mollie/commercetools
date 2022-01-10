import { MollieClient, Order, OrderEmbed } from '@mollie/api-client';
import Logger from '../../logger/logger';

export default async function getOrderDetailsById(orderId: string, mollieClient: MollieClient): Promise<Order> {
  try {
    const order = await mollieClient.orders.get(orderId, { embed: [OrderEmbed.payments] });
    return order;
  } catch (error: any) {
    Logger.debug('Error in getOrderDetailsById');
    if (error.status === 404) {
      return Promise.reject({ status: 404, source: 'mollie', message: error.message });
    } else {
      throw error;
    }
  }
}
