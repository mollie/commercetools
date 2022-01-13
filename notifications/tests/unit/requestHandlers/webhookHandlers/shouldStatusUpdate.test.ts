import { PaymentStatus, RefundStatus } from '@mollie/api-client';
import { CTTransactionState } from '../../../../src/types/ctPayment';
import { shouldPaymentStatusUpdate, shouldRefundStatusUpdate } from '../../../../src/requestHandlers/webhookHandlers/shouldStatusUpdate';

describe('shouldPaymentStatusUpdate', () => {
  it('should return true when the status should update, based on the mollie and ct transaction states', () => {
    const cases = [
      { mollieStatus: PaymentStatus.paid, ctStatus: CTTransactionState.Pending, expectedResult: true },
      { mollieStatus: PaymentStatus.authorized, ctStatus: CTTransactionState.Pending, expectedResult: true },
      { mollieStatus: PaymentStatus.canceled, ctStatus: CTTransactionState.Pending, expectedResult: true },
      { mollieStatus: PaymentStatus.failed, ctStatus: CTTransactionState.Pending, expectedResult: true },
      { mollieStatus: PaymentStatus.expired, ctStatus: CTTransactionState.Pending, expectedResult: true },
    ];
    cases.forEach(({ mollieStatus, ctStatus, expectedResult }) => {
      expect(shouldPaymentStatusUpdate(mollieStatus, ctStatus)).toBe(expectedResult);
    });
  });

  it('should return false when the status should not update, based on the mollie and ct transaction states', () => {
    const cases = [
      { mollieStatus: PaymentStatus.paid, ctStatus: CTTransactionState.Success, expectedResult: false },
      { mollieStatus: PaymentStatus.authorized, ctStatus: CTTransactionState.Success, expectedResult: false },
      { mollieStatus: PaymentStatus.canceled, ctStatus: CTTransactionState.Failure, expectedResult: false },
      { mollieStatus: PaymentStatus.failed, ctStatus: CTTransactionState.Failure, expectedResult: false },
      { mollieStatus: PaymentStatus.expired, ctStatus: CTTransactionState.Failure, expectedResult: false },
    ];

    cases.forEach(({ mollieStatus, ctStatus, expectedResult }) => {
      expect(shouldPaymentStatusUpdate(mollieStatus, ctStatus)).toBe(expectedResult);
    });
  });

  it('should handle incorrect input by returning shouldUpdate: false', () => {
    expect(shouldPaymentStatusUpdate('' as PaymentStatus, '' as CTTransactionState)).toBeFalsy();
  });
});

describe('shouldRefundStatusUpdate', () => {
  it('should return boolean shouldUpdate based on the mollie and ct transaction states', () => {
    const cases = [
      // should update
      { mollieStatus: RefundStatus.queued, ctStatus: CTTransactionState.Initial, expectedResult: true },
      { mollieStatus: RefundStatus.pending, ctStatus: CTTransactionState.Initial, expectedResult: true },
      { mollieStatus: RefundStatus.processing, ctStatus: CTTransactionState.Initial, expectedResult: true },
      { mollieStatus: RefundStatus.refunded, ctStatus: CTTransactionState.Initial, expectedResult: true },
      { mollieStatus: RefundStatus.failed, ctStatus: CTTransactionState.Initial, expectedResult: true },
      // should not update
      { mollieStatus: RefundStatus.queued, ctStatus: CTTransactionState.Pending, expectedResult: false },
      { mollieStatus: RefundStatus.pending, ctStatus: CTTransactionState.Pending, expectedResult: false },
      { mollieStatus: RefundStatus.processing, ctStatus: CTTransactionState.Pending, expectedResult: false },
      { mollieStatus: RefundStatus.refunded, ctStatus: CTTransactionState.Success, expectedResult: false },
      { mollieStatus: RefundStatus.failed, ctStatus: CTTransactionState.Failure, expectedResult: false },
    ];

    cases.forEach(({ mollieStatus, ctStatus, expectedResult }) => {
      expect(shouldRefundStatusUpdate(mollieStatus, ctStatus)).toBe(expectedResult);
    });
  });

  it('should handle incorrect input by returning shouldUpdate: false', () => {
    expect(shouldRefundStatusUpdate('' as RefundStatus, '' as CTTransactionState)).toBeFalsy();
  });
});
