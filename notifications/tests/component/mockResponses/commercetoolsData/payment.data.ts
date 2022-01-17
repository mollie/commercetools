export const ctPaymentResponse = {
  id: '99c2fea7-4ad7-4a39-8870-fc148e7b7269',
  version: 25,
  lastMessageSequenceNumber: 12,
  createdAt: '2022-01-03T15:47:38.575Z',
  lastModifiedAt: '2022-01-06T10:35:18.801Z',
  lastModifiedBy: {
    clientId: 'A-7gCPuzUQnNSdDwlOCCngFj',
    isPlatformClient: false,
  },
  createdBy: {
    clientId: 'A-7gCPuzUQnNSdDwlOCCngFj',
    isPlatformClient: false,
  },
  key: 'ord_12345',
  amountPlanned: {
    type: 'centPrecision',
    currencyCode: 'EUR',
    centAmount: 1000,
    fractionDigits: 2,
  },
  paymentMethodInfo: {
    paymentInterface: 'Mollie',
    method: 'klarnapaylater',
  },
  custom: {
    type: {
      typeId: 'type',
      id: 'c11764fa-4e07-4cc0-ba40-e7dfc8d67b4e',
    },
    fields: {
      createPayment: '{"redirectUrl":"https://www.google.com/","webhookUrl":"https://europe-west1-profound-yew-326712.cloudfunctions.net/dd-demo-notification","locale":"nl_NL"}',
    },
  },
  paymentStatus: {
    interfaceText: 'created',
  },
  transactions: [
    {
      id: '2020335e-1ea2-4d49-b45b-14a078f589a6',
      timestamp: '2022-01-03T15:49:11.000Z',
      type: 'Authorization',
      amount: {
        type: 'centPrecision',
        currencyCode: 'EUR',
        centAmount: 1000,
        fractionDigits: 2,
      },
      interactionId: 'tr_ncaPcAhuUV',
      state: 'Pending',
    },
  ],
  interfaceInteractions: [
    {
      type: {
        typeId: 'type',
        id: '6b313771-78b8-40f7-a3d2-b066df7ec852',
      },
      fields: {
        request:
          '{"transactionId":"2020335e-1ea2-4d49-b45b-14a078f589a6","createPayment":{"redirectUrl":"https://www.google.com/","webhookUrl":"https://europe-west1-profound-yew-326712.cloudfunctions.net/dd-demo-notification","locale":"nl_NL"}}',
        actionType: 'createOrder',
        createdAt: '2022-01-03T15:49:11+00:00',
        response: '{"mollieOrderId":"ord_gm9r1k","checkoutUrl":"https://www.mollie.com/checkout/order/gm9r1k","transactionId":"2020335e-1ea2-4d49-b45b-14a078f589a6"}',
        id: '62c5cd18-92de-4d8d-807c-26c884752060',
      },
    },
  ],
};
