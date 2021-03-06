import { CTPayment, CTTransaction } from '../../../../src/types/index';
import { handlePayLaterFlow, includesState } from '../../../../src/requestHandlers/determineAction/handlePayLaterFlow';
import { ControllerAction, CTTransactionState, CTTransactionType } from '../../../../src/types';

describe('includesState', () => {
  it('should return true when the given transaction array contains >=1 transaction of the given state', () => {
    const transactions = [
      {
        type: CTTransactionType.Charge,
        state: CTTransactionState.Pending,
      },
      {
        type: CTTransactionType.Charge,
        state: CTTransactionState.Pending,
      },
      {
        type: CTTransactionType.Charge,
        state: CTTransactionState.Failure,
      },
    ] as CTTransaction[];
    expect(includesState(transactions, CTTransactionState.Pending)).toBeTruthy();
  });

  it('should return false when the given transaction array contains 0 transactions of the given state', () => {
    const transactions = [
      {
        type: CTTransactionType.Charge,
        state: CTTransactionState.Pending,
      },
      {
        type: CTTransactionType.Charge,
        state: CTTransactionState.Pending,
      },
      {
        type: CTTransactionType.Charge,
        state: CTTransactionState.Failure,
      },
    ] as CTTransaction[];
    expect(includesState(transactions, CTTransactionState.Success)).toBeFalsy();
  });
});

describe('handlePayLaterFlow - Error Cases', () => {
  describe('should return no action and errorMessage:', () => {
    it('when there is more than one Initial transaction', () => {
      const multipleInitial = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Initial,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
        ],
      };
      const { action, errorMessage } = handlePayLaterFlow(multipleInitial as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Only one transaction can be in "Initial" state at any time');
    });

    it('when a Charge transaction is created and there is no Authorization transaction - cannot capture unauthorized funds', () => {
      const chargeWithoutAuthorization = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
        ],
      };
      const { action, errorMessage } = handlePayLaterFlow(chargeWithoutAuthorization as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Cannot add a refund, cancel or charge transaction without an Authorization transaction');
    });

    it('when a charge transaction is created when the Authorization transaction is still pending - cannot capture unauthorized funds', () => {
      const chargeWhenAuthorizationPending = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Pending,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
        ],
      };
      const { action, errorMessage } = handlePayLaterFlow(chargeWhenAuthorizationPending as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Cannot create a capture without a successful Authorization');
    });

    it('when a charge transaction is created when the Authorization transaction has failed - cannot capture unauthorized funds', () => {
      const chargeWhenAuthorizationHasFailed = {
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
      const { action, errorMessage } = handlePayLaterFlow(chargeWhenAuthorizationHasFailed as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Cannot create a capture without a successful Authorization');
    });

    it('when a Refund is created without a successful capture present', () => {
      const refundWithoutCapture = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Failure,
          },
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Initial,
          },
        ],
      };
      const { action, errorMessage } = handlePayLaterFlow(refundWithoutCapture as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Cannot create a Refund without a successful capture');
    });

    it('when an Authorization transaction is created in "Pending" state - this state is reserved for the API extension, to indicate that the payment service has accepted the transaction', () => {
      const authorizationCreatedInPendingState = {
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Pending,
          },
        ],
      };
      const { action, errorMessage } = handlePayLaterFlow(authorizationCreatedInPendingState as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
      expect(errorMessage).toBe('Cannot create a Transaction in state "Pending". This state is reserved to indicate the transaction has been accepted by the payment service provider');
    });
  });
});

describe('handlePayLaterFlow - actions', () => {
  describe('NoAction', () => {
    it('should return no action when transaction should not trigger anything in mollie', () => {
      const authorizationPending = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Pending,
          },
        ],
      };
      const { action } = handlePayLaterFlow(authorizationPending as CTPayment);
      expect(action).toBe(ControllerAction.NoAction);
    });
  });

  describe('CreateOrder', () => {
    it('should return create order action when an Initial Authorization transaction is added to the Payment object and there is no key set', () => {
      const initialAuthorization = {
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(initialAuthorization as CTPayment).action).toBe(ControllerAction.CreateOrder);
    });
  });

  describe('CreateOrderPayment', () => {
    it('should return create order payment action when payment has a key & one Initial Authorization transaction', () => {
      const ctPayment = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(ctPayment as CTPayment).action).toBe(ControllerAction.CreateOrderPayment);
    });

    // Case: payment method switched from pay now to pay later
    it('should return create order payment action when payment has a key, one Initial Authorization transaction and previously failed Charge transaction', () => {
      const ctPayment = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Failure,
          },
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(ctPayment as CTPayment).action).toBe(ControllerAction.CreateOrderPayment);
    });
  });

  describe('CreateShipment', () => {
    it('should return CreateShipment when a successful Authorization transaction is present and an Initial Charge transaction is created', () => {
      const successfulAuthorizationAndInitialCharge = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Failure,
          },
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(successfulAuthorizationAndInitialCharge as CTPayment).action).toBe(ControllerAction.CreateShipment);
    });

    it('should handle multiple "Charge" transactions on the same Payment, and return create shipment - this is used to capture part of the funds for a given Payment', () => {
      const successfulAuthorizationAndMultipleCharges = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(successfulAuthorizationAndMultipleCharges as CTPayment).action).toBe(ControllerAction.CreateShipment);
    });

    it('should return Create Shipment and still allow a manual capture after a refund has been created against a different part of the Payment', () => {
      const chargeWhenRefundAlsoPresent = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.Refund,
            state: CTTransactionState.Pending,
          },
          {
            type: CTTransactionType.Charge,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(chargeWhenRefundAlsoPresent as CTPayment).action).toBe(ControllerAction.CreateShipment);
    });
  });

  describe('CancelOrder - for when funds have not been captured yet', () => {
    it('should return CancelOrder action when a CancelAuthorization transaction is added, and there is a Successful Authorization transaction', () => {
      const cancelSuccessfulAuthorization = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.CancelAuthorization,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(cancelSuccessfulAuthorization as CTPayment).action).toBe(ControllerAction.CancelOrder);
    });

    it('should return CancelOrder action when a CancelAuthorization transaction is added, and there is a Pending Authorization transaction', () => {
      const cancelPendingAuthorization = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Pending,
          },
          {
            type: CTTransactionType.CancelAuthorization,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(cancelPendingAuthorization as CTPayment).action).toBe(ControllerAction.CancelOrder);
    });

    // Example case:
    // customer has failed to make a payment (Auth/Failure), create order payment has been triggered (Auth/Pending), then decides to cancel order (CancelAuth/Initial)
    it('should return CancelOrder action when a CancelAuthorization transaction is added, and there is a Pending Authorization transaction and a previously failed Authorization', () => {
      const cancelPendingAuthorization = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Failure,
          },
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Pending,
          },
          {
            type: CTTransactionType.CancelAuthorization,
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(cancelPendingAuthorization as CTPayment).action).toBe(ControllerAction.CancelOrder);
    });
  });

  describe('RefundOrder - for when funds have been captured and have to be returned to customer', () => {
    it('should return Refund action when there is a Successful Authorization and Charge transaction present', () => {
      const refundWithSuccessfulCharge = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
          },
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
      expect(handlePayLaterFlow(refundWithSuccessfulCharge as CTPayment).action).toBe(ControllerAction.CreateCustomRefund);
    });

    it('should allow multiple refunds to be created against the same payment', () => {
      const multipleRefunds = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
          },
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
            state: CTTransactionState.Initial,
          },
        ],
      };
      expect(handlePayLaterFlow(multipleRefunds as CTPayment).action).toBe(ControllerAction.CreateCustomRefund);
    });

    it('should allow a refund action when there are successful Authorization and Charge transactions, even if a CancelAuthorization transaction is also present', () => {
      // For example, an order is created in mollie.
      // Some order lines are 'captured', i.e. shipped and some are canceled
      // Now the merchant wishes to partially refund the order
      const refundWhereACancelAuthorizationIsAlsoPresent = {
        key: 'ord_1234',
        transactions: [
          {
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
          },
          {
            type: CTTransactionType.CancelAuthorization,
            state: CTTransactionState.Success,
          },
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
      expect(handlePayLaterFlow(refundWhereACancelAuthorizationIsAlsoPresent as CTPayment).action).toBe(ControllerAction.CreateCustomRefund);
    });
  });
});
