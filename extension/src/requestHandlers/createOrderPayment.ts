import { MollieClient, OrderPaymentCreateParams } from '@mollie/api-client';
import { formatMollieErrorResponse } from '../errorHandlers/formatMollieErrorResponse';
import { CTUpdatesRequestedResponse } from '../types';

export function getOrdersPaymentsParams(ctObj: any): Promise<OrderPaymentCreateParams> {
  try {
    const parsedCreateOrderPaymentRequest = JSON.parse(ctObj?.custom?.fields?.createOrderPaymentRequest);
    const orderPaymentCreateParams = {
      orderId: ctObj?.key,
      // method: parsedCreateOrderPaymentRequest.method,
      // customerId: ''
    };
    return Promise.resolve(orderPaymentCreateParams);
  } catch (e) {
    console.error(e);
    return Promise.reject({ status: 400, title: 'Could not make parameters needed to create Mollie order payment.', field: 'createOrderPaymentRequest' });
  }
}

export default async function createOrderPayment(ctObj: any, mollieClient: MollieClient): Promise<CTUpdatesRequestedResponse> {
  try {
    const ordersPaymentsParams = await getOrdersPaymentsParams(ctObj);
    const mollieOrderPaymentRes = await mollieClient.orders_payments.create(ordersPaymentsParams);
    console.log('mollieOrderPaymentRes', mollieOrderPaymentRes);

    return {
      actions: [],
      status: 201,
    };
  } catch (error: any) {
    console.error(error);
    const errorResponse = formatMollieErrorResponse(error);
    return errorResponse;
  }
}
