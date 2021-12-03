import { PaymentMethod } from '@mollie/api-client';
import { hasValidPaymentMethod, isListPaymentMethods, isPayLater, determineAction, handlePayNowFlow, CTPayment, handlePayLaterFlow } from '../../src/requestHandlers/determineAction';
import { ControllerAction } from '../../src/types';

describe('isListPaymentMethods', () => {
  it('should return true if paymentMethodsRequest is set and paymentMethodsResponse is not', () => {
    const mockPaymentObject = {
      custom: {
        fields: {
          paymentMethodsRequest: 'local:de_DE',
        },
      },
    };
    expect(isListPaymentMethods(mockPaymentObject)).toBeTruthy();
  });

  it('should return false if paymentMethodsRequest is set and paymentMethodsResponse is set', () => {
    const mockPaymentObject = {
      custom: {
        fields: {
          paymentMethodsRequest: 'local:de_DE',
          paymentMethodsResponse: 'NO_AVAILABLE_PAYMENT_METHODS',
        },
      },
    };
    expect(isListPaymentMethods(mockPaymentObject)).toBeFalsy();
  });

  it('should return false if paymentMethodsRequest custom field is not set', () => {
    const mockPaymentObject = {
      custom: {
        fields: {
          createPayment: '{}',
        },
      },
    };
    expect(isListPaymentMethods(mockPaymentObject)).toBeFalsy();
  });

  it('should return false if no custom field are set', () => {
    const mockPaymentObject = {
      amountPlanned: {
        currencyCode: 'ISK',
        centAmount: 10,
      },
    };
    expect(isListPaymentMethods(mockPaymentObject)).toBeFalsy();
  });
});

describe('hasValidPaymentMethod', () => {
  it('should return true when valid mollie payment method enum is set', () => {
    ['paypal', 'creditcard', 'voucher', 'mybank'].forEach(method => {
      expect(hasValidPaymentMethod(method)).toBeTruthy();
    });
  });

  it('should return false if invalid payment method is set (i.e. not a mollie payment method)', () => {
    ['payfriend', 'notcorrect', '', '---'].forEach(method => {
      expect(hasValidPaymentMethod(method)).toBeFalsy();
    });
  });

  it('should return false if the payment method is not set', () => {
    expect(hasValidPaymentMethod(undefined)).toBeFalsy();
  });
});

describe('isPayLater', () => {
  it('should return true when the method is a pay later method', () => {
    expect(isPayLater('klarnasliceit' as PaymentMethod)).toBeTruthy();
  });

  it('should return false when the method is a pay now method', () => {
    expect(isPayLater('paypal' as PaymentMethod)).toBeFalsy();
  });
});

describe('determineAction', () => {
  // Payment Methods
  it('should return GetPaymentMethods action if the correct custom fields are set', () => {
    const mockPaymentObject = {
      paymentMethodInfo: {
        paymentInterface: 'mollie',
      },
      custom: {
        fields: {
          paymentMethodsRequest: 'local:de_DE',
        },
      },
    };

    const action = determineAction(mockPaymentObject);
    expect(action).toBe(ControllerAction.GetPaymentMethods);
  });

  // Create Order

  // Create Shipment

  // Cancel Order
});

describe.only('handlePayLaterFlow', () => {
  // No action
  it('should return no action when transaction should not trigger anything in mollie', () => {
    const authorizationPending = {
      key: 'ord_1234',
      transactions: [
        {
          type: 'Authorization',
          state: 'Pending',
        },
      ],
    };
    expect(handlePayLaterFlow(authorizationPending as CTPayment)).toBe(ControllerAction.NoAction);
  });
  // Error
  it('should return error action when invalid combination of transactions is passed', () => {
    const chargeWhenAuthorizationPending = {
      key: 'ord_1234',
      transactions: [
        {
          type: 'Authorization',
          state: 'Pending',
        },
        {
          type: 'Charge',
          state: 'Intial',
        },
      ],
    };
    expect(handlePayLaterFlow(chargeWhenAuthorizationPending as CTPayment)).toBe(ControllerAction.Error);

    const cancelWhenAuthorizationHasFailed = {
      key: 'ord_1234',
      transactions: [
        {
          type: 'Authorization',
          state: 'Failure',
        },
        {
          type: 'CancelAuthorization',
          state: 'Intial',
        },
      ],
    };
    expect(handlePayLaterFlow(cancelWhenAuthorizationHasFailed as CTPayment)).toBe(ControllerAction.Error);

    const chargeWhenAuthorizationHasFailed = {
      key: 'ord_1234',
      transactions: [
        {
          type: 'Authorization',
          state: 'Failure',
        },
        {
          type: 'Charge',
          state: 'Intial',
        },
      ],
    };
    expect(handlePayLaterFlow(chargeWhenAuthorizationHasFailed as CTPayment)).toBe(ControllerAction.Error);

    const chargeWithoutAuthorization = {
      key: 'ord_1234',
      transactions: [
        {
          type: 'Charge',
          state: 'Intial',
        },
      ],
    };
    expect(handlePayLaterFlow(chargeWithoutAuthorization as CTPayment)).toBe(ControllerAction.Error);

    const authorizationCreatedInPendingState = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Pending',
        },
      ],
    };
    expect(handlePayLaterFlow(authorizationCreatedInPendingState as CTPayment)).toBe(ControllerAction.Error);
  });
  // Create Order
  it('should return create order action when correct combination of transactions is sent', () => {
    const initialAuthorization = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Intial',
        },
      ],
    };
    expect(handlePayLaterFlow(initialAuthorization as CTPayment)).toBe(ControllerAction.CreateOrder);
  });
  // Create Shipment
  it('should return create shipment action when correct combination of transactions is sent', () => {
    const successfulAuthorizationAndInitialCharge = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Success',
        },
        {
          type: 'Charge',
          state: 'Intial',
        },
      ],
    };
    expect(handlePayLaterFlow(successfulAuthorizationAndInitialCharge as CTPayment)).toBe(ControllerAction.CreateShipment);

    const successfulAuthorizationAndMultipleCharges = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Success',
        },
        {
          type: 'Charge',
          state: 'Success',
        },
        {
          type: 'Charge',
          state: 'Intial',
        },
      ],
    };
    expect(handlePayLaterFlow(successfulAuthorizationAndMultipleCharges as CTPayment)).toBe(ControllerAction.CreateShipment);

    const chargeWhenRefundAlsoPresent = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Success',
        },
        {
          type: 'Charge',
          state: 'Success',
        },
        {
          type: 'Refund',
          state: 'Pending',
        },
        {
          type: 'Charge',
          state: 'Intial',
        },
      ],
    };
    expect(handlePayLaterFlow(chargeWhenRefundAlsoPresent as CTPayment)).toBe(ControllerAction.CreateShipment);
  });
  // Cancel Order / Order Line
  it('should return CancelOrder action when correct transactions are passed', () => {
    const cancelPendingAuthorization = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Pending',
        },
        {
          type: 'CancelAuthorization',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayLaterFlow(cancelPendingAuthorization as CTPayment)).toBe(ControllerAction.CancelOrder);

    const cancelSuccessfulAuthorization = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Success',
        },
        {
          type: 'CancelAuthorization',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayLaterFlow(cancelSuccessfulAuthorization as CTPayment)).toBe(ControllerAction.CancelOrder);
  });
  // Create Refund
  it('should return Refund action when correct transactions are passed', () => {
    const refundWithSuccessfulCharge = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Success',
        },
        {
          type: 'Charge',
          state: 'Success',
        },
        {
          type: 'Refund',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayLaterFlow(refundWithSuccessfulCharge as CTPayment)).toBe(ControllerAction.CreateCustomRefund);

    const multipleRefunds = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Success',
        },
        {
          type: 'Charge',
          state: 'Success',
        },
        {
          type: 'Refund',
          state: 'Success',
        },
        {
          type: 'Refund',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayLaterFlow(multipleRefunds as CTPayment)).toBe(ControllerAction.CreateCustomRefund);

    // Imagine an order created, some lines cancelled, then it was all shipped.
    // Now we want to create a refund
    const refundWhereACancelAuthorizationIsAlsoPresent = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Success',
        },
        {
          type: 'CancelAuthorization',
          state: 'Success',
        },
        {
          type: 'Charge',
          state: 'Success',
        },
        {
          type: 'Refund',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayLaterFlow(refundWhereACancelAuthorizationIsAlsoPresent as CTPayment)).toBe(ControllerAction.CreateCustomRefund);
  });
});

describe('handlePayNowFlow', () => {
  // No action - Default
  it('should return no action no changes or API calls should be triggered', () => {
    const paymentPending = {
      key: 'ord_1234',
      transactions: [
        {
          type: 'Charge',
          state: 'Pending',
        },
      ],
    };
    expect(handlePayNowFlow(paymentPending as CTPayment)).toBe(ControllerAction.NoAction);

    const refundPending = {
      transactions: [
        {
          type: 'Charge',
          state: 'Success',
        },
        {
          type: 'Refund',
          state: 'Pending',
        },
      ],
    };
    expect(handlePayNowFlow(refundPending as CTPayment)).toBe(ControllerAction.NoAction);
  });
  // Error
  it('should return error action when an incorrect combination of Transactions is presented', () => {
    const authorizationPayment = {
      transactions: [
        {
          type: 'Authorization',
          state: 'Intial',
        },
      ],
    };
    expect(handlePayNowFlow(authorizationPayment as CTPayment)).toBe(ControllerAction.Error);

    const cancelAuthorizationPayment = {
      transactions: [
        {
          type: 'CancelAuthorization',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayNowFlow(cancelAuthorizationPayment as CTPayment)).toBe(ControllerAction.Error);

    const refundWithoutCharge = {
      transactions: [
        {
          type: 'Refund',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayNowFlow(refundWithoutCharge as CTPayment)).toBe(ControllerAction.Error);

    const pendingChargeWithoutKey = {
      transactions: [
        {
          type: 'Charge',
          state: 'Pending',
        },
      ],
    };
    expect(handlePayNowFlow(pendingChargeWithoutKey as CTPayment)).toBe(ControllerAction.Error);
  });
  // Create Order
  it('should return create order action when the correct combination of Transactions is presented', () => {
    const initialChargePayment = {
      transactions: [
        {
          type: 'Charge',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayNowFlow(initialChargePayment as CTPayment)).toBe(ControllerAction.CreateOrder);
  });
  // Cancel Order
  it('should return cancel order action when the correct combination of Transactions is presented', () => {
    const refundAndPendingChargePayment = {
      key: 'ord_12345',
      transactions: [
        {
          type: 'Charge',
          state: 'Pending',
        },
        {
          type: 'Refund',
          state: 'Initial',
        },
      ],
    };

    expect(handlePayNowFlow(refundAndPendingChargePayment as CTPayment)).toBe(ControllerAction.CancelOrder);
  });
  // Refund Order
  it('should return refund action when the correct combination of Transactions is presented', () => {
    const oneRefundAgainstPayment = {
      transactions: [
        {
          type: 'Charge',
          state: 'Success',
        },
        {
          type: 'Refund',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayNowFlow(oneRefundAgainstPayment as CTPayment)).toBe(ControllerAction.CreateCustomRefund);

    const multipleRefundsAgainstPayment = {
      transactions: [
        {
          type: 'Charge',
          state: 'Success',
        },
        {
          type: 'Refund',
          state: 'Success',
        },
        {
          type: 'Refund',
          state: 'Failure',
        },
        {
          type: 'Refund',
          state: 'Initial',
        },
      ],
    };
    expect(handlePayNowFlow(multipleRefundsAgainstPayment as CTPayment)).toBe(ControllerAction.CreateCustomRefund);
  });
});
