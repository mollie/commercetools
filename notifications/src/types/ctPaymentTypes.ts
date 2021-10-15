export type CTPayment = {
  id: string;
  version: number;
  key?: string;
  amountPlanned: CTMoney;
  paymentMethodInfo?: {
    paymentInterface?: string;
    method?: string;
  };
  paymentStatus: {
    interfaceCode?: string;
    interfaceText?: string;
    state?: Object;
  };
  transactions?: CTTransaction[];
  custom?: {
    fields: {
      mollieOrderStatus?: string;
      createOrderRequest?: string;
      createOrderResponse?: string;
    };
  };
};

export type CTTransaction = {
  id: string;
  amount: CTMoney;
  interactionId?: string;
  state: 'Initial' | 'Pending' | 'Success' | 'Failure';
};

export type CTMoney = {
  centAmout: number;
  currencyCode: string;
};
