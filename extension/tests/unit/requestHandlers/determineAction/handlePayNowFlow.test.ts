import { CTPayment, CTTransactionState, CTTransactionType } from '../../../../src/types/index';
import { handlePayNowFlow } from '../../../../src/requestHandlers/determineAction/handlePayNowFlow';
import { ControllerAction } from '../../../../src/types';

describe('handlePayNowFlow - Error Cases', () => {
  describe('should return NoAction and errorMessage:', () => {
    it('when there is more than one Initial transaction present', () => {
      const manyInitialTransactions = {
        transactions: [
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Initial,
          },
        ],
      };
      const { action, errorMessage } = handlePayNowFlow(manyInitialTransactions as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Only one transaction can be in "Initial" state at any time');
    });

    it('when a CancelAuthorization transaction type is created on a Payment with a "pay now" method', () => {
      const authorizationPayment = {
        transactions: [
          {
            type: CTTransactionType.CancelAuthorization,
            state: CTTransactionState.Initial,
          },
        ],
      };
      const { action, errorMessage } = handlePayNowFlow(authorizationPayment as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('CancelAuthorization transaction type is invalid for pay now methods');
    });

    it('when a Refund transaction is created and there is no Charge transaction', () => {
      const refundWithoutCharge = {
        transactions: [
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Initial,
          },
        ],
      };
      const { action, errorMessage } = handlePayNowFlow(refundWithoutCharge as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Cannot create a Refund with no Charge');
    });

    it('when a there is a "Pending" and "Initial" state charge at the same time', () => {
      const pendingAndInitial = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Pending,
          },
        ],
      };
      const { action, errorMessage } = handlePayNowFlow(pendingAndInitial as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Must only have one Charge transaction processing (i.e. in state "Initial" or "Pending") at a time');
    });

    it('when a Charge is created in a "Pending" state (the Pending state should only be set by the API extension as it means that the transaction was accepted by the payment service provider)', () => {
      const pendingChargeWithoutKey = {
        transactions: [
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Pending,
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
            type: CTTransactionType.Charge,
            state: CTTransactionState.Pending,
          },
        ],
      };
      expect(handlePayNowFlow(paymentPending as CTPayment).action).toBe(ControllerAction.NoAction);
    });
    it('should return no action shen there is a Successful Charge and a pending Refund transaction - this means the refund has been created in mollie and its status will be updated by the notifications module once the Refund is completed', () => {
      const refundPending = {
        transactions: [
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Pending,
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
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
        ],
      };

      const { action } = handlePayNowFlow(initialChargePayment as CTPayment);
      expect(action).toBe(ControllerAction.CreateOrder);
    });
  });

  describe('CreateOrderPayment', () => {
    // Example case - payment method changed from 'ideal' to 'paypal'
    it('should return create order payment action when payment has key, an Initial Charge transaction and a previously failed Charge transaction', () => {
      const initialChargePayment = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Failure,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
        ],
      };

      const { action } = handlePayNowFlow(initialChargePayment as CTPayment);
      expect(action).toBe(ControllerAction.CreateOrderPayment);
    });

    // Example case - payment method changed from 'ideal' to 'klarnapaylater'
    it('should return create order payment action when payment has key, an Initial Charge transaction and a previously failed Authorizaton transaction', () => {
      const initialChargePayment = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Failure,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
        ],
      };

      const { action } = handlePayNowFlow(initialChargePayment as CTPayment);
      expect(action).toBe(ControllerAction.CreateOrderPayment);
    });
  });

  describe('CancelOrder', () => {
    it('should return cancel order action when a Refund transaction is added and the Charge transaction is still in a "Pending" state - this means the customer has not completed the payment', () => {
      const refundAndPendingChargePayment = {
        key: 'ord_12345',
        transactions: [
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Pending,
          },
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Initial,
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
            type: CTTransactionType.Charge,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayNowFlow(oneRefundAgainstPayment as CTPayment).action).toBe(ControllerAction.CreateCustomRefund);
    });
    it('should handle mutliple refund transactions being present on the payment, there can be previous refunds which have succeeded or failed', () => {
      const multipleRefundsAgainstPayment = {
        transactions: [
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Failure,
          },
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayNowFlow(multipleRefundsAgainstPayment as CTPayment).action).toBe(ControllerAction.CreateCustomRefund);
    });
  });
});
