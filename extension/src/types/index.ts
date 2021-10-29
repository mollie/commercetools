export type CTUpdatesRequestedResponse = {
  status: number;
  actions?: Action[];
  errors?: CTError[];
};

export type Action = {
  action: string;
  type?: {
    key: string;
  };
  fields?: {
    actionType: string;
    request?: string;
    response?: string;
    createdAt?: string;
  };
  name?: string;
  value?: string;
  key?: string;
  transaction?: CTTransaction;
  transactionId?: string;
  interactionId?: string;
};

export type CTError = {
  code: string;
  message: string;
  extensionExtraInfo?: Object;
};

export type CTMoney = {
  type?: 'centPrecision';
  currencyCode: string;
  centAmount: number;
  fractionDigits?: number;
};

export type CTTransaction = {
  timestamp: string;
  type: 'Charge';
  amount: CTMoney;
  interactionId?: string;
  state?: 'Initial' | 'Pending' | 'Success' | 'Failure';
};

export enum ControllerAction {
  GetPaymentMethods = 'getPaymentMethods',
  CreateOrder = 'createOrder',
  CreateOrderPayment = 'createOrderPayment',
  CreateShipment = 'createShipment',
  UpdateShipment = 'updateShipment',
  NoAction = 'noAction',
}
