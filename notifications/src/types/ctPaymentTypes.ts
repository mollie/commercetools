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
};

export type CTTransaction = {
  id: string;
  amount: CTMoney;
  interactionId?: string;
  state?: 'Initial' | 'Pending' | 'Success' | 'Failure';
};

export type CTMoney = {
  centAmout: number;
  currencyCode: string;
};
