import { ControllerAction } from '../src/types';
import { mocked } from 'ts-jest/utils';
import * as ut from '../src/utils';

describe('Utils unit tests', () => {
  describe('methodListMapper', () => {
    it('Should return empty object if no amountPlanned / use as list all', async () => {
      const mollieOptions = ut.methodListMapper({});
      expect(mollieOptions).toMatchObject({});
    });

    it('Should return properly formated amount for mollie', async () => {
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

    it('Should return properly formated custom fields for mollie', async () => {
      const ctObj = {
        amountPlanned: {
          currencyCode: 'EUR',
          centAmount: 100987,
          fractionDigits: 4,
        },
        custom: {
          fields: {
            paymentMethodsRequest: '{"locale":"nl_NL","billingCountry":"NL","includeWallets":"applepay","orderLineCategories":"eco,meal","issuers":false,"pricing":false}',
          },
        },
      };
      const expectedOptions = {
        amount: {
          value: '10.10',
          currency: 'EUR',
        },
        locale: 'nl_NL',
        billingCountry: 'NL',
        includeWallets: 'applepay',
        orderLineCategories: 'eco,meal',
        resource: 'orders',
      };

      const mollieOptions = ut.methodListMapper(ctObj);
      expect(mollieOptions).toEqual(expectedOptions);
    });

    it('Should properly parse includes and not have ', async () => {
      const ctObj = {
        amountPlanned: {
          currencyCode: 'EUR',
          centAmount: 1000,
        },
        custom: {
          fields: {
            paymentMethodsRequest: '{"locale":"nl_NL","issuers":false,"pricing":true}',
          },
        },
      };

      const mollieOptions = ut.methodListMapper(ctObj);
      expect(mollieOptions).toHaveProperty('locale', 'nl_NL');
      expect(mollieOptions).toHaveProperty('include', 'pricing');
      expect(mollieOptions.billingCountry).toBeUndefined();
    });
  });

  describe('createResponseUpdateActions', () => {
    beforeEach(() => {
      jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => '2021-11-10T14:02:45.858Z');
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should return expected update actions based on the controlleraction', () => {
      const actions = ut.createResponseUpdateActions(
        '{"interactionId": "tr_wfW2KPHKrb", "amount": { "currencyCode": "EUR", "centAmount": 1800 }}',
        { id: 're_7897892', orderId: 'ord_1234' },
        ControllerAction.CreateCustomRefund,
        'createCustomRefundResponse',
      );
      expect(actions).toHaveLength(2);
      actions.forEach(action => {
        expect(action).toMatchSnapshot();
      });
    });
  });
});
