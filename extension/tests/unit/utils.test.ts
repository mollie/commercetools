import * as ut from '../../src/utils';
import { Amount } from '@mollie/api-client/dist/types/src/data/global';
import { CTTransaction, CTTransactionType } from '../../src/types';
import { OrderLine } from '@mollie/api-client';

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

describe('makeMollieAmount', () => {
  it('should convert commercetools Money to mollie amount', () => {
    const testCases = [
      { ctMoney: { centAmount: 1000, fractionDigits: 2, currencyCode: 'EUR' }, mollie: { currency: 'EUR', value: '10.00' } },
      { ctMoney: { centAmount: -999, fractionDigits: 2, currencyCode: 'EUR' }, mollie: { currency: 'EUR', value: '-9.99' } },
      { ctMoney: { centAmount: 10089, fractionDigits: 2, currencyCode: 'EUR' }, mollie: { currency: 'EUR', value: '100.89' } },
      { ctMoney: { centAmount: 200, fractionDigits: 0, currencyCode: 'ISK' }, mollie: { currency: 'ISK', value: '200' } },
    ];
    testCases.forEach(({ ctMoney, mollie }) => {
      const amount = ut.makeMollieAmount(ctMoney);
      expect(amount.currency).toBe(mollie.currency);
      expect(amount.value).toBe(mollie.value);
    });
  });
});

describe('isPartialTransaction', () => {
  it('should return true if transaction has custom fields lineIds', () => {
    const mockTransaction = [
      {
        type: 'Charge',
        state: 'Initial',
        custom: {
          fields: {
            lineIds: '3e632c95-8dc6-459a-9edc-5e64760abf21',
          },
        },
      },
    ] as CTTransaction[];
    expect(ut.isPartialTransaction(mockTransaction, CTTransactionType.Charge)).toBe(true);
  });
  it('should return true if transaction has custom fields includeShipment', () => {
    const mockTransaction = [
      {
        type: 'Charge',
        state: 'Initial',
        custom: {
          fields: {
            includeShipping: true,
          },
        },
      },
    ] as CTTransaction[];
    expect(ut.isPartialTransaction(mockTransaction, CTTransactionType.Charge)).toBe(true);
  });
  it('should return false if no transaction is present', () => {
    const mockTransaction = undefined as any as CTTransaction[];
    expect(ut.isPartialTransaction(mockTransaction, CTTransactionType.Charge)).toBe(false);
  });
});

describe('ctToMollieLines', () => {
  it('should find mollie lines from commercetools partial lines', () => {
    const mockTransaction = {
      type: 'Charge',
      state: 'Initial',
      custom: {
        fields: {
          lineIds: '[{"id":"3e632c95-8dc6-459a-9edc-5e64760abf21","quantity": 1,"totalPrice": {"currencyCode": "EUR","centAmount": 250,"fractionDigits": 2 }}]',
          includeShipping: true,
        },
      },
    } as CTTransaction;
    const mockMollieOrderLines = [
      {
        id: 'odl_1.tlaa3w',
        metadata: { cartLineItemId: '3e632c95-8dc6-459a-9edc-5e64760abf21' },
        quantity: 2,
        totalAmount: { value: '5.00', currency: 'EUR' },
      },
      {
        id: 'odl_1.cgark2',
        name: 'Shipping - Standard Shipping',
        type: 'shipping_fee',
      },
    ] as any as OrderLine[];
    const expectedMollieLine = [{ id: 'odl_1.tlaa3w', quantity: 1, amount: { value: '2.50', currency: 'EUR' } }, { id: 'odl_1.cgark2' }];
    expect(ut.ctToMollieLines(mockTransaction, mockMollieOrderLines)).toEqual(expectedMollieLine);
  });
  it('should find mollie lines from commercetools whole lines', () => {
    const mockTransaction = {
      type: 'Charge',
      state: 'Initial',
      custom: {
        fields: {
          lineIds: '3e632c95-8dc6-459a-9edc-5e64760abf21',
          includeShipping: false,
        },
      },
    } as CTTransaction;
    const mockMollieOrderLines = [
      {
        id: 'odl_1.tlaa3w',
        metadata: { cartCustomLineItemId: '3e632c95-8dc6-459a-9edc-5e64760abf21' },
        quantity: 2,
        totalAmount: { value: '5.00', currency: 'EUR' },
      },
    ] as any as OrderLine[];
    const expectedMollieLine = [{ id: 'odl_1.tlaa3w' }];
    expect(ut.ctToMollieLines(mockTransaction, mockMollieOrderLines)).toEqual(expectedMollieLine);
  });
  it('should find shipping line even if no lineIds', () => {
    const mockTransaction = {
      type: 'Charge',
      state: 'Initial',
      custom: {
        fields: {
          includeShipping: true,
        },
      },
    } as CTTransaction;
    const mockMollieOrderLines = [
      {
        id: 'odl_1.cgark2',
        name: 'Shipping - Standard Shipping',
        type: 'shipping_fee',
      },
    ] as any as OrderLine[];
    const expectedMollieLine = [{ id: 'odl_1.cgark2' }];
    expect(ut.ctToMollieLines(mockTransaction, mockMollieOrderLines)).toEqual(expectedMollieLine);
  });
});

describe('mollieToCtLines', () => {
  it('should return commercetools line ids from mollie lines', () => {
    const mockMollieOrderLines = [
      {
        id: 'odl_1.tlaa3w',
        metadata: { cartLineItemId: '3e632c95-8dc6-459a-9edc-5e64760abf21' },
        quantity: 2,
        totalAmount: { value: '5.00', currency: 'EUR' },
      },
      {
        id: 'odl_1.cgark2',
        name: 'Shipping - Standard Shipping',
        type: 'shipping_fee',
      },
    ] as any as OrderLine[];
    const expectedCommercetoolsIds = '3e632c95-8dc6-459a-9edc-5e64760abf21,Shipping - Standard Shipping,';
    expect(ut.mollieToCtLines(mockMollieOrderLines)).toEqual(expectedCommercetoolsIds);
  });
});
