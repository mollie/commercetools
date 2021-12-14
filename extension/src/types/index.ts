// This is not exhaustive
// If you use another commercetools error response code, add it to this enum
export enum CTEnumErrors {
  General = 'General',
  InvalidInput = 'InvalidInput',
  InvalidOperation = 'InvalidOperation',
  Unauthorized = 'Unauthorized',
  SyntaxError = 'SyntaxError',
  SemanticError = 'SemanticError',
  ObjectNotFound = 'ObjectNotFound',
}

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
  state?: CTTransactionState;
};

export type CTError = {
  code: CTEnumErrors;
  message: string;
  extensionExtraInfo?: Object;
};

export type CTMoney = {
  type?: 'centPrecision';
  currencyCode: string;
  centAmount: number;
  fractionDigits?: number;
};

export type CTPayment = {
  id: string;
  amountPlanned: CTMoney;
  transactions?: CTTransaction[];
  key?: string;
  custom?: {
    fields?: {
      paymentMethodsRequest?: string;
      paymentMethodsResponse?: string;
      createPayment?: string;
      createCapture?: string;
      cancelPayment?: string;
      createRefund?: string;
    };
  };
  interfaceInteractions?: CTInterfaceInteraction[];
};

export type CTInterfaceInteraction = {
  id: string;
  actionType: string;
  createdAt?: Date;
  request?: string;
  response?: string;
};

export type CTTransaction = {
  id?: string;
  timestamp?: string;
  type: CTTransactionType;
  amount: CTMoney;
  interactionId?: string;
  state?: 'Initial' | 'Pending' | 'Success' | 'Failure';
};

export enum ControllerAction {
  GetPaymentMethods = 'getPaymentMethods',
  CreateOrder = 'createOrder',
  CreateOrderPayment = 'createOrderPayment',
  CreateOrderRefund = 'createOrderRefund',
  CreateCustomRefund = 'createCustomRefund',
  CreateShipment = 'createShipment',
  UpdateShipment = 'updateShipment',
  CancelOrder = 'cancelOrder',
  NoAction = 'noAction',
  Error = 'error',
}

export enum CTTransactionType {
  Authorization = 'Authorization',
  CancelAuthorization = 'CancelAuthorization',
  Charge = 'Charge',
  Refund = 'Refund',
  Chargeback = 'Chargeback',
}

export enum CTTransactionState {
  Initial = 'Initial',
  Pending = 'Pending',
  Success = 'Success',
  Failure = 'Failure',
}
