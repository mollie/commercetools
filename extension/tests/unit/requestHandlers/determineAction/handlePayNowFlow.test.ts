import { CTPayment } from '../../../../src/types/index';
import { handlePayNowFlow } from '../../../../src/requestHandlers/determineAction/handlePayNowFlow';
import { ControllerAction } from '../../../../src/types';

describe('handlePayNowFlow - Error Cases', () => {
  describe('should return NoAction and errorMessage:', () => {
    it.skip('when an Authorization transaction type is created on a Payment with a "pay now" method', () => {
      const authorizationPayment = {
        transactions: [
          {
            type: 'Authorization',
            state: 'Intial',
          },
        ],
      };
      const { action, errorMessage } = handlePayNowFlow(authorizationPayment as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Authorization and CancelAuthorization transactions are invalid for pay now methods');
    });
    it.skip('when an CancelAuthorization transaction type is created on a Payment with a "pay now" method', () => {
      const cancelAuthorizationPayment = {
        transactions: [
          {
            type: 'CancelAuthorization',
            state: 'Intial',
          },
        ],
      };
      const { action, errorMessage } = handlePayNowFlow(cancelAuthorizationPayment as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Authorization and CancelAuthorization transactions are invalid for pay now methods');
    });
    it('when a Refund transaction is created and there is no Charge transaction', () => {
      const refundWithoutCharge = {
        transactions: [
          {
            type: 'Refund',
            state: 'Initial',
          },
        ],
      };
      const { action, errorMessage } = handlePayNowFlow(refundWithoutCharge as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Cannot create a Refund with no Charge');
    });
    it('when a Charge is created in a "Pending" state (the Pending state should only be set by the API extension as it means that the transaction was accepted by the payment service provider)', () => {
      const pendingChargeWithoutKey = {
        transactions: [
          {
            type: 'Charge',
            state: 'Pending',
          },
        ],
      };
      const { action, errorMessage } = handlePayNowFlow(pendingChargeWithoutKey as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Cannot create a Transaction in state "Pending". This state is reserved to indicate the transaction has been accepted by the payment service provider');
    });
  });
});

describe('handlePayNowFlow - actions', () => {
  describe('NoAction', () => {
    it('should return no action when there is a Pending Charge transaction the Payment key is set - this means the order has been created in mollie and is awaiting customer payment', () => {
      const paymentPending = {
        key: 'ord_1234',
        transactions: [
          {
            type: 'Charge',
            state: 'Pending',
          },
        ],
      };
      expect(handlePayNowFlow(paymentPending as CTPayment).action).toBe(ControllerAction.NoAction);
    });
    it('should return no action shen there is a Successful Charge and a pending Refund transaction - this means the refund has been created in mollie and its status will be updated by the notifications module once the Refund is completed', () => {
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
      expect(handlePayNowFlow(refundPending as CTPayment).action).toBe(ControllerAction.NoAction);
    });
  });

  describe('CreateOrder', () => {
    it('should return create order action when an Initial Charge transaction is present on the Payment', () => {
      const initialChargePayment = {
        transactions: [
          {
            type: 'Charge',
            state: 'Initial',
          },
        ],
      };

      const { action } = handlePayNowFlow(initialChargePayment as CTPayment);
      expect(action).toBe(ControllerAction.CreateOrder);
    });
  });

  describe('CancelOrder', () => {
    it('should return cancel order action when a Refund transaction is added and the Charge transaction is still in a "Pending" state - this means the customer has not completed the payment', () => {
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

      expect(handlePayNowFlow(refundAndPendingChargePayment as CTPayment).action).toBe(ControllerAction.CancelOrder);
    });
  });

  describe('RefundOrder', () => {
    it('should return refund action when a Refund transaction is added and the Charge transaction is Successful - this means the customer has paid, so the funds should be returned to customer', () => {
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
      expect(handlePayNowFlow(oneRefundAgainstPayment as CTPayment).action).toBe(ControllerAction.CreateCustomRefund);
    });
    it('should handle mutliple refund transactions being present on the payment, there can be previous refunds which have succeeded or failed', () => {
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
      expect(handlePayNowFlow(multipleRefundsAgainstPayment as CTPayment).action).toBe(ControllerAction.CreateCustomRefund);
    });
  });
});
