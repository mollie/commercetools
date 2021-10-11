import * as ut from '../src/utils';

describe('Utils unit test', () => {
  describe('methodListMapper', () => {
    it('Should return empty object if no amountPlanned / use as list all', async () => {
      const mollieOptions = ut.methodListMapper({});
      expect(mollieOptions).toMatchObject({});
    });

    it('Should return properly formated amount for molie', async () => {
      const ctObj = {
        amountPlanned: {
          currencyCode: 'USD',
          centAmount: 1234,
        },
      };

      const mollieOptions = ut.methodListMapper(ctObj);
      expect(mollieOptions.amount).toHaveProperty('value', '12.34');
      expect(mollieOptions.amount).toHaveProperty('currency', 'USD');
    });

    it('Should return properly formated custom fields for molie', async () => {
      const ctObj = {
        amountPlanned: {
          currencyCode: 'EUR',
          centAmount: 100987,
          fractionDigits: 4,
        },
        custom: {
          fields: {
            paymentMethodsRequest: {
              locale: 'nl_NL',
              billingCountry: 'NL',
              includeWallets: 'applepay',
              orderLineCategories: 'eco,meal',
              issuers: false,
              pricing: false,
            },
          },
        },
      };

      const mollieOptions = ut.methodListMapper(ctObj);
      expect(mollieOptions.amount).toHaveProperty('value', '10.10');
      expect(mollieOptions.amount).toHaveProperty('currency', 'EUR');
      expect(mollieOptions).toHaveProperty('locale', 'nl_NL');
      expect(mollieOptions).toHaveProperty('billingCountry', 'NL');
      expect(mollieOptions).toHaveProperty('includeWallets', 'applepay');
      expect(mollieOptions).toHaveProperty('orderLineCategories', 'eco,meal');
      expect(mollieOptions.include).toBeUndefined();
    });

    it('Should properly parse includes and not have ', async () => {
      const ctObj = {
        amountPlanned: {
          currencyCode: 'EUR',
          centAmount: 1000,
        },
        custom: {
          fields: {
            paymentMethodsRequest: {
              locale: 'nl_NL',
              issuers: false,
              pricing: true,
            },
          },
        },
      };

      const mollieOptions = ut.methodListMapper(ctObj);
      expect(mollieOptions).toHaveProperty('locale', 'nl_NL');
      expect(mollieOptions).toHaveProperty('include', 'pricing');
      expect(mollieOptions.billingCountry).toBeUndefined();
    });
  });
});
