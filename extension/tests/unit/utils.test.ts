import * as ut from '../../src/utils';
import { Amount } from '@mollie/api-client/dist/types/src/data/global';

describe('Utils', () => {
  beforeAll(() => {
    jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => '2021-11-10T14:02:45.858Z');
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('isMolliePaymentInterface', () => {
    it('must return true when payment interface is mollie', () => {
      const mockedCtObject = {
        paymentMethodInfo: {
          paymentInterface: 'Mollie',
        },
      };
      expect(ut.isMolliePaymentInterface(mockedCtObject)).toBe(true);
    });
    it('should return false if payment interface is not mollie', () => {
      const mockedCtObject = {
        paymentMethodInfo: {
          paymentInterface: 'NotMollie',
        },
      };
      expect(ut.isMolliePaymentInterface(mockedCtObject)).toBe(false);
    });
    it('should return false if payment interface is not set', () => {
      const mockedCtObject = {
        paymentMethodInfo: {},
      };
      expect(ut.isMolliePaymentInterface(mockedCtObject)).toBe(false);
    });
  });
});
describe('convertMollieToCTPaymentAmount', () => {
  it('should return correct centAmount from mollie payment amount', () => {
    const testCases = [
      { mollieAmount: '10.00', expectedCentAmount: 1000 },
      { mollieAmount: '-15.00', expectedCentAmount: -1500 },
      { mollieAmount: '0.50', expectedCentAmount: 50 },
      { mollieAmount: '-19.99', expectedCentAmount: -1999 },
      { mollieAmount: '0.01', expectedCentAmount: 1 },
    ];
    testCases.forEach(({ mollieAmount, expectedCentAmount }) => {
      const expectedResult = {
        currencyCode: 'EUR',
        centAmount: expectedCentAmount,
        fractionDigits: 2,
        type: 'centPrecision',
      };
      expect(ut.convertMollieAmountToCTMoney({ value: mollieAmount, currency: 'EUR' } as Amount)).toStrictEqual(expectedResult);
      const expectedResult2 = { currencyCode: 'USD', centAmount: -9, fractionDigits: 1, type: 'centPrecision' };
      expect(ut.convertMollieAmountToCTMoney({ value: '-0.9', currency: 'USD' } as Amount)).toStrictEqual(expectedResult2);
      const expectedResult3 = { currencyCode: 'USD', centAmount: -995, fractionDigits: 6, type: 'centPrecision' };
      expect(ut.convertMollieAmountToCTMoney({ value: '-0.000995', currency: 'USD' } as Amount)).toStrictEqual(expectedResult3);
    });
  });
  it('should return correct centAmount with currency without digits', () => {
    const expectedResult = { currencyCode: 'ISK', centAmount: 1050, fractionDigits: 0, type: 'centPrecision' };
    expect(ut.convertMollieAmountToCTMoney({ value: '1050', currency: 'ISK' } as Amount)).toStrictEqual(expectedResult);
  });
});

describe('convert CT to mollie amount value', () => {
  it('should convert ct to mollie amount value', () => {
    const testCases = [
      { expectedMollieAmount: '10.00', centAmount: 1000, fractionDigits: 2 },
      { expectedMollieAmount: '10.10', centAmount: 100987, fractionDigits: 4 },
      { expectedMollieAmount: '-15.00', centAmount: -15, fractionDigits: 0 },
      { expectedMollieAmount: '0.50', centAmount: 5, fractionDigits: 1 },
      { expectedMollieAmount: '-19.99', centAmount: -1999, fractionDigits: 2 },
      { expectedMollieAmount: '0.01', centAmount: 1 },
    ];
    testCases.forEach(({ expectedMollieAmount, centAmount, fractionDigits }) => {
      expect(ut.convertCTToMollieAmountValue(centAmount, fractionDigits)).toStrictEqual(expectedMollieAmount);
    });
  });
});

// describe('isPaymentMethodValidWithIssuer', () => {
//   it('should validate correct issuer with payment method', () => {
//     const testCases = [
//       { method: PaymentMethod.ideal, result: true },
//       { method: PaymentMethod.applepay, result: false },
//       { method: PaymentMethod.giftcard, result: true },
//       { method: 'something else' as PaymentMethod, result: false },
//     ];
//     testCases.forEach(({ method, result }) => {
//       expect(ut.isPaymentMethodValidWithIssuer(method)).toBe(result);
//     });
//   });
// });
