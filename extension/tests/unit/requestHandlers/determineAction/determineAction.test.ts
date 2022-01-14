import { determineAction } from '../../../../src/requestHandlers/determineAction/determineAction';
import { ControllerAction } from '../../../../src/types';

describe('determineAction', () => {
  describe('No Action', () => {
    // Happy
    it('should return no action if the interface is set to mollie but there are no transactions', () => {
      const mockPaymentObject = {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
        },
        custom: {
          fields: {
            createPayment: '{"redirectUrl": "webshop.com"}',
          },
        },
      };

      const { action } = determineAction(mockPaymentObject);
      expect(action).toBe(ControllerAction.NoAction);
    });

    // Unhappy
    it('should error if payment method provided is invalid', () => {
      const mockPaymentObject = {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
          method: 'payfriend',
        },
        key: 'ord_1234',
        transactions: [
          {
            type: 'Charge',
            state: 'Initial',
          },
        ],
      };
      const { errorMessage } = determineAction(mockPaymentObject);
      expect(errorMessage).toEqual('Invalid paymentMethodInfo.method "payfriend"');
    });

    it('should error message if payment method is not set', () => {
      const mockPaymentObject = {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
        },
        key: 'ord_1234',
        transactions: [
          {
            type: 'Charge',
            state: 'Initial',
          },
        ],
      };
      const { errorMessage } = determineAction(mockPaymentObject);
      expect(errorMessage).toEqual('Payment method must be set in order to make and manage payment transactions');
    });
  });
  describe('getPaymentMethods', () => {
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

      const { action } = determineAction(mockPaymentObject);
      expect(action).toBe(ControllerAction.GetPaymentMethods);
    });
  });

  describe('createOrder', () => {
    it('should return Create Order action when there is an Initial Authorization transaction and method is pay later', () => {
      const mockPaymentObject = {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
          method: 'klarnasliceit',
        },
        custom: {
          fields: {
            paymentMethodsRequest: 'local:de_DE',
            paymentMethodsResponse: '"count":5,"methods":[{}]',
          },
        },
        transactions: [
          {
            type: 'Authorization',
            state: 'Initial',
          },
        ],
      };

      const { action } = determineAction(mockPaymentObject);
      expect(action).toBe(ControllerAction.CreateOrder);
    });

    it.skip('should return Create Order action when there is an Initial Charge transaction and method is pay now', () => {
      const mockPaymentObject = {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
          method: 'ideal,ideal_ASNBNL21',
        },
        key: 'ord_1234',
        transactions: [
          {
            type: 'Charge',
            state: 'Initial',
          },
        ],
      };

      const { action } = determineAction(mockPaymentObject);
      expect(action).toBe(ControllerAction.CreateOrder);
    });
  });

  describe('createShipment', () => {
    // Check - can you ship a pay now ?
    it('should return Create Shipment action when there is a successful authorization followed by an iniital charge transaction and method is pay later', () => {
      const mockPaymentObject = {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
          method: 'klarnasliceit',
        },
        key: 'ord_1234',
        transactions: [
          {
            type: 'Authorization',
            state: 'Success',
          },
          {
            type: 'Charge',
            state: 'Initial',
          },
        ],
      };

      const { action } = determineAction(mockPaymentObject);
      expect(action).toBe(ControllerAction.CreateShipment);
    });
  });
});
