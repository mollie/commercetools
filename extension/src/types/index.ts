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
  extensionExtraInfo?: CTErrorExtensionExtraInfo;
};

export type CTErrorExtensionExtraInfo = {
  originalStatusCode: number;
  title: string;
  field: string;
  links?: string;
};

export type CTMoney = {
  type?: 'centPrecision';
  currencyCode: string;
  centAmount: number;
  fractionDigits?: number;
};

export type CTCustomLineItem = Pick<CTLineItem, 'taxedPrice' | 'totalPrice' | 'quantity' | 'taxRate' | 'name' | 'id' | 'discountedPrice'> & {
  money: CTMoney;
};

export type CTLineItem = {
  id: string;
  name: { [key: string]: string };
  productId: string;
  price: {
    value: CTMoney;
    discounted?: { value: CTMoney };
  };
  discountedPrice?: { value: CTMoney };
  taxRate: { amount: number };
  totalPrice: CTMoney;
  taxedPrice: {
    totalGross: CTMoney;
    totalNet: CTMoney;
  };
  quantity: number;
  variant: {
    sku: string;
  };
};

export type CTCart = {
  id: string;
  lineItems?: CTLineItem[];
  customLineItems?: CTCustomLineItem[];
  totalPrice: CTMoney;
  shippingAddress?: Object;
  billingAddress?: Object;
  locale?: string;
  shippingInfo?: Object;
};

export type CTPayment = {
  id: string;
  amountPlanned: CTMoney;
  paymentMethodInfo: {
    method: string;
    paymentInterface?: string;
  };
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

// TODO - make id required field as we remodel
export type CTTransaction = {
  id?: string;
  timestamp?: string;
  type: CTTransactionType;
  amount: CTMoney;
  interactionId?: string;
  state?: 'Initial' | 'Pending' | 'Success' | 'Failure';
  custom?: {
    fields: {
      lineIds?: string;
      includeShipping?: boolean;
      description?: string;
      metadata?: string;
    };
  };
};

export enum ControllerAction {
  GetPaymentMethods = 'getPaymentMethods',
  CreateOrder = 'createOrder',
  CreateOrderPayment = 'createOrderPayment',
  CreateCustomRefund = 'createCustomRefund',
  CreateShipment = 'createShipment',
  CancelOrder = 'cancelOrder',
  NoAction = 'noAction',
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

export class HandleRequestInput {
  constructor(public httpPath: string, public httpMethod: string, public httpBody: any, public headers: Map<string, string> = new Map<string, string>()) {}
}

export class HandleRequestSuccess {
  constructor(public status: number, public actions: Action[] = []) {}
}

export class HandleRequestFailure {
  constructor(public status: number, public errors: CTError[] = []) {}
}

export type HandleRequestOutput = HandleRequestSuccess | HandleRequestFailure;
