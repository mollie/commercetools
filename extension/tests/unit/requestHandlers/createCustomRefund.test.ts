import { MollieClient, Refund } from '@mollie/api-client';
import _ from 'lodash';
import { mocked } from 'ts-jest/utils';
import PaymentRefundsBinder from '@mollie/api-client/dist/types/src/binders/payments/refunds/PaymentRefundsBinder';
import { ControllerAction, CTPayment, CTTransaction, CTTransactionState, CTTransactionType } from '../../../src/types';
import Logger from '../../../src/logger/logger';
import { makeActions } from '../../../src/makeActions';
import { createCustomRefund } from '../../../src/requestHandlers/createCustomRefund';

jest.mock('../../../src/makeActions');

describe('createCustomRefund', () => {
  const mockLogError = jest.fn();

  const mockMollieClient = {} as MollieClient;
  const mockPaymentRefunds = {} as PaymentRefundsBinder;

  const paymentIdToBeRefunded = 'db041620-b9da-4b3a-82e6-5d8730a389bd';
  const interactionId = '8b9b918f-c838-4faa-a717-e355ce39466f';
  const refundTransactionId = 'f0f2feda-864a-4701-b323-2f1472ba30f0';

  const mockRefund = { id: '066fc1ad-7dfb-4f85-9d60-5ba26b22f0fa', paymentId: paymentIdToBeRefunded, createdAt: '2022-01-12T08:51:18.558' } as Refund;
  mockMollieClient.payments_refunds = mockPaymentRefunds;

  const baseCTPayment: CTPayment = {
    id: '6ebc82eb-a004-4328-b4e2-995bf4e3b3c2',
    paymentMethodInfo: {
      method: 'ideal',
    },
    key: 'ord_12345',
    amountPlanned: {
      centAmount: 2000,
      currencyCode: 'EUR',
      fractionDigits: 2,
    },
    transactions: [
      {
        id: '6f117c5e-eeef-4190-b3be-28380430521b',
        type: CTTransactionType.Charge,
        amount: {
          centAmount: 2000,
          currencyCode: 'EUR',
        },
        state: 'Success',
      },
    ],
  };

  const mockCreate = jest.fn().mockResolvedValue(mockRefund);
  beforeEach(() => {
    jest.clearAllMocks();
    Logger.error = mockLogError;
    mockPaymentRefunds.create = mockCreate;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('201 - Success', () => {
    // Stub makeActions
    mocked(makeActions.changeTransactionInteractionId).mockReturnValue({
      action: 'changeTransactionInteractionId',
      transactionId: 'f0f2feda-864a-4701-b323-2f1472ba30f0',
      interactionId: mockRefund.id,
    });
    mocked(makeActions.changeTransactionState).mockReturnValue({
      action: 'changeTransactionState',
      transactionId: refundTransactionId,
      state: CTTransactionState.Pending,
    });
    mocked(makeActions.changeTransactionTimestamp).mockReturnValue({
      action: 'changeTransactionTimestamp',
      transactionId: refundTransactionId,
      timestamp: mockRefund.createdAt,
    });
    mocked(makeActions.addInterfaceInteraction).mockReturnValue({
      action: 'addInterfaceInteraction',
      type: {
        key: 'ct-mollie-integration-interface-interaction-type',
      },
      fields: {
        id: interactionId,
        actionType: ControllerAction.CreateCustomRefund,
        createdAt: mockRefund.createdAt,
        request: 'requestValue',
        response: 'responseValue',
      },
    });

    it('should successfully call mollie create payment refund and return stub 201 response', async () => {
      const ctPayment = _.cloneDeep(baseCTPayment);
      ctPayment.transactions!.push({
        id: refundTransactionId,
        type: CTTransactionType.Refund,
        amount: {
          centAmount: 450,
          currencyCode: 'EUR',
        },
        interactionId: paymentIdToBeRefunded,
        state: 'Initial',
      });

      const response = await createCustomRefund(ctPayment, mockMollieClient);

      expect(mockPaymentRefunds.create).toHaveBeenLastCalledWith({ paymentId: paymentIdToBeRefunded, amount: { currency: 'EUR', value: '4.50' } });
      expect(response.status).toEqual(201);
      expect(response.actions).toHaveLength(4);
    });

    it('should successfully call mollie create payment refund with description and metadata if provided as custom fields', async () => {
      const ctPayment = _.cloneDeep(baseCTPayment);
      ctPayment.transactions!.push({
        id: refundTransactionId,
        type: CTTransactionType.Refund,
        amount: {
          centAmount: 450,
          currencyCode: 'EUR',
        },
        interactionId: paymentIdToBeRefunded,
        state: 'Initial',
        custom: {
          fields: {
            description: 'Refund due to late delivery',
            metadata: '{"code": "DL_63", "authorized": true}',
          },
        },
      });

      const response = await createCustomRefund(ctPayment, mockMollieClient);

      expect(mockPaymentRefunds.create).toHaveBeenLastCalledWith({
        paymentId: paymentIdToBeRefunded,
        amount: { currency: 'EUR', value: '4.50' },
        description: 'Refund due to late delivery',
        metadata: { authorized: true, code: 'DL_63' },
      });
      expect(response.status).toEqual(201);
      expect(response.actions).toHaveLength(4);
    });

    it('should handle string metadata from the Transaction custom field', async () => {
      const ctPayment = _.cloneDeep(baseCTPayment);
      ctPayment.transactions!.push({
        id: refundTransactionId,
        type: CTTransactionType.Refund,
        amount: {
          centAmount: 450,
          currencyCode: 'EUR',
        },
        interactionId: paymentIdToBeRefunded,
        state: 'Initial',
        custom: {
          fields: {
            metadata: 'metadata can be a string',
          },
        },
      } as CTTransaction);
      const response = await createCustomRefund(ctPayment, mockMollieClient);

      expect(response.status).toBe(201);
    });
  });

  describe('400 - Error', () => {
    it('should return error response with status 400 when the call to mollie fails', async () => {
      mockPaymentRefunds.create = jest.fn().mockRejectedValue(() => new Error('Cannot refund'));
      const ctPayment = _.cloneDeep(baseCTPayment);
      ctPayment.transactions!.push({
        id: refundTransactionId,
        type: CTTransactionType.Refund,
        amount: {
          centAmount: 450,
          currencyCode: 'EUR',
        },
        interactionId: paymentIdToBeRefunded,
        state: 'Initial',
      });
      const response = await createCustomRefund(ctPayment, mockMollieClient);

      expect(response.status).toBe(400);
    });

    it('should return error response if the transaction does not contain the required fields', async () => {
      const ctPayment = _.cloneDeep(baseCTPayment);
      ctPayment.transactions!.push({
        id: refundTransactionId,
        type: CTTransactionType.Refund,
        amount: {},
        interactionId: paymentIdToBeRefunded,
        state: 'Initial',
      } as CTTransaction);
      const response = await createCustomRefund(ctPayment, mockMollieClient);

      expect(response.status).toBe(400);
    });
  });
});
