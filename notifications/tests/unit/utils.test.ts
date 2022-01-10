import { Amount } from '@mollie/api-client/dist/types/src/data/global';
import { isOrderOrPayment, convertMollieAmountToCTMoney } from '../../src/utils';

describe('isOrderOrPayment', () => {
  it("should return order when the resource id starts with 'ord_'", () => {
    const result = isOrderOrPayment('ord_td5h6f');
    expect(result).toBe('order');
  });
  it("should return payment when the resource id starts with 'tr_'", () => {
    const result = isOrderOrPayment('tr_td5h6f');
    expect(result).toBe('payment');
  });
  it('should return error when the resource id does not match an expected pattern', () => {
    const result = isOrderOrPayment('invalid_string');
    expect(result).toBe('invalid');
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
      expect(convertMollieAmountToCTMoney({ value: mollieAmount, currency: 'EUR' } as Amount)).toStrictEqual(expectedResult);
      const expectedResult2 = { currencyCode: 'USD', centAmount: -9, fractionDigits: 1, type: 'centPrecision' };
      expect(convertMollieAmountToCTMoney({ value: '-0.9', currency: 'USD' } as Amount)).toStrictEqual(expectedResult2);
      const expectedResult3 = { currencyCode: 'USD', centAmount: -995, fractionDigits: 6, type: 'centPrecision' };
      expect(convertMollieAmountToCTMoney({ value: '-0.000995', currency: 'USD' } as Amount)).toStrictEqual(expectedResult3);
    });
  });
  it('should return correct centAmount with currency without digits', () => {
    const expectedResult = { currencyCode: 'ISK', centAmount: 1050, fractionDigits: 0, type: 'centPrecision' };
    expect(convertMollieAmountToCTMoney({ value: '1050', currency: 'ISK' } as Amount)).toStrictEqual(expectedResult);
  });
});
