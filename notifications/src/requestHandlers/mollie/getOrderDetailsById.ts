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

export const parseOrder = (order: Order) => {
  const { status, _embedded } = order;

  const payments = _embedded?.payments || [];

  const paymentIdAndStatuses = payments.map(payment => {
    return {
      id: payment.id,
      status: payment.status,
    };
  });
  return { status, payments: paymentIdAndStatuses };
};
