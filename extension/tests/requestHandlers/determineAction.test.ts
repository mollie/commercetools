import { PaymentMethod } from '@mollie/api-client';
import { hasValidPaymentMethod, isListPaymentMethods, isPayLater, determineAction } from '../../src/requestHandlers/determineAction';
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
});
