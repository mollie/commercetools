import { determineAction } from '../../../../src/requestHandlers/determineAction/determineAction';
import { ControllerAction } from '../../../../src/types';

describe('determineAction', () => {
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

    it('should return Create Order action when there is an Initial Charge transaction and method is pay now', () => {
      const mockPaymentObject = {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
          method: 'paypal',
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

    it('should error if issuer is present on an incompatible payment method', () => {
      const mockPaymentObject = {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
          method: 'paypal,ideal_ASNBNL21',
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
      expect(errorMessage).toEqual('Invalid paymentMethodInfo.method "paypal,ideal_ASNBNL21". PaymentMethod "paypal" does not support issuers.');
    });

    it('should error if too many payment methods', () => {
      const mockPaymentObject = {
        paymentMethodInfo: {
          paymentInterface: 'mollie',
          method: 'paypal,ideal,creditcard',
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
      expect(errorMessage).toEqual('Invalid paymentMethodInfo.method "paypal,ideal,creditcard". Payment method must be set with a one method in order to make and manage payment transactions.');
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
