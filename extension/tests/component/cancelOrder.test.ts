import nock from 'nock';
import request from 'supertest';
import { CTTransactionState, CTTransactionType } from '../../src/types';
import _ from 'lodash';
import app from '../../src/app';
import Logger from '../../src/logger/logger';
import { mockAuthorizedOrder, wholeOrderCanceled, cancelOrderError } from './mockResponses/mollieData/cancelOrder.data';

describe('Cancel Order', () => {
  const mockLogError = jest.fn();

  const ctPaymentId = 'dfc2dcb0-10b8-4091-8334-687ce9db16ed';
  const mollieOrderId = 'ord_8wmqcHMN4U';
  const molliePaymentId = 'tr_GrP6dJRf3U';

  const baseMockCTPayment: any = {
    resource: {
      obj: {
        id: ctPaymentId,
        key: mollieOrderId,
        paymentMethodInfo: {
          paymentInterface: 'mollie',
        },
        amountPlanned: {
          currencyCode: 'EUR',
          centAmount: 50000,
        },
        custom: {
          fields: {
            createPayment: '{}',
          },
        },
      },
    },
  };

  beforeAll(() => {
    // Prevent logs from cluttering test output
    Logger.error = mockLogError;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Happy Path', () => {
    describe('Cancel Whole Order', () => {
      it('should cancel whole order when "Refund" transaction is added to an unpaid pay now order', async () => {
        const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}`).reply(200, wholeOrderCanceled);

        const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
        mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'ideal';
        mockCTPaymentObj.resource.obj.transactions = [
          {
            id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
            type: CTTransactionType.Charge,
            state: CTTransactionState.Pending,
            amount: {
              currencyCode: 'EUR',
              centAmount: 90000,
            },
            interactionId: molliePaymentId,
          },
          // Transaction added to trigger Cancel flow
          {
            id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
            type: CTTransactionType.Refund,
            state: CTTransactionState.Initial,
            amount: {
              currencyCode: 'EUR',
              centAmount: 90000,
            },
          },
        ];

        const res = await request(app).post('/').send(mockCTPaymentObj);
        const { status, body } = res;
        expect(status).toBe(200);

        // Check actions
        const { actions } = body;
        expect(actions).toHaveLength(4);
        const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
        expect(updateStateAction.state).toBe('Success');
        const interfaceInteraction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
        expect(interfaceInteraction.fields.actionType).toBe('cancelOrder');

        expect(cancelOrderScope.isDone()).toBeTruthy();
      });

      it('should cancel whole order when "CancelAuthorization" transaction is added to an unauthorized pay later order', async () => {
        const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}`).reply(200, wholeOrderCanceled);

        const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
        mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
        mockCTPaymentObj.resource.obj.transactions = [
          {
            id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Pending,
            amount: {
              currencyCode: 'EUR',
              centAmount: 90000,
            },
            interactionId: molliePaymentId,
          },
          // Transaction added to trigger Cancel flow
          {
            id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
            type: CTTransactionType.CancelAuthorization,
            state: CTTransactionState.Initial,
            amount: {
              currencyCode: 'EUR',
              centAmount: 90000,
            },
          },
        ];

        const res = await request(app).post('/').send(mockCTPaymentObj);
        const { status, body } = res;
        expect(status).toBe(200);

        // Check actions
        const { actions } = body;
        expect(actions).toHaveLength(4);
        const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
        expect(updateStateAction.state).toBe('Success');
        const interfaceInteraction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
        expect(interfaceInteraction.fields.actionType).toBe('cancelOrder');

        expect(cancelOrderScope.isDone()).toBeTruthy();
      });

      it('should cancel whole order when "CancelAuthorization" transaction is added to an authorized, but not captured, pay later order', async () => {
        const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}`).reply(200, wholeOrderCanceled);

        const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
        mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
        mockCTPaymentObj.resource.obj.transactions = [
          {
            id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
            amount: {
              currencyCode: 'EUR',
              centAmount: 90000,
            },
            interactionId: molliePaymentId,
          },
          // Transaction added to trigger Cancel flow
          {
            id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
            type: CTTransactionType.CancelAuthorization,
            state: CTTransactionState.Initial,
            amount: {
              currencyCode: 'EUR',
              centAmount: 90000,
            },
          },
        ];

        const res = await request(app).post('/').send(mockCTPaymentObj);
        const { status, body } = res;
        expect(status).toBe(200);

        // Check actions
        const { actions } = body;
        expect(actions).toHaveLength(4);
        const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
        expect(updateStateAction.state).toBe('Success');
        const interfaceInteraction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
        expect(interfaceInteraction.fields.actionType).toBe('cancelOrder');

        expect(cancelOrderScope.isDone()).toBeTruthy();
      });
    });
    describe('Cancel partial order', () => {
      it('should cancel partial order line when a "CancelAuthorization" transaction is added, with lineIds field is set with quantity and amount, to an authorized pay later order', async () => {
        const expectedDeleteParams = '{"lines":[{"id":"odl_1.pdue8w","quantity":1,"amount":{"value":"2.50","currency":"EUR"}}]}';
        const getOrderScope = nock('https://api.mollie.com/v2')
          .get(uri => uri.includes(mollieOrderId))
          .reply(200, mockAuthorizedOrder);
        const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}/lines`, expectedDeleteParams).reply(204);

        const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
        mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
        mockCTPaymentObj.resource.obj.transactions = [
          {
            id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
            amount: {
              currencyCode: 'EUR',
              centAmount: 674,
            },
            interactionId: molliePaymentId,
          },
          // Transaction added to trigger Cancel flow
          {
            id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
            type: CTTransactionType.CancelAuthorization,
            state: CTTransactionState.Initial,
            amount: {
              currencyCode: 'EUR',
              centAmount: 250,
            },
            custom: {
              fields: {
                lineIds: '[{"id":"d102ef48-89dd-428c-bad5-edbe2ef0bbca","quantity": 1,"totalPrice": {"currencyCode": "EUR","centAmount": 250,"fractionDigits": 2 } }]',
                includeShipping: false,
              },
            },
          },
        ];

        const res = await request(app).post('/').send(mockCTPaymentObj);
        const { status, body } = res;
        expect(status).toBe(200);

        // Check actions
        const { actions } = body;
        expect(actions).toHaveLength(4);
        const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
        expect(updateStateAction.state).toBe('Success');
        const interfaceInteraction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
        expect(interfaceInteraction.fields.actionType).toBe('cancelOrder');

        expect(cancelOrderScope.isDone()).toBe(true);
        expect(getOrderScope.isDone()).toBe(true);
        expect(cancelOrderScope.isDone()).toBe(true);
      });
      it('should cancel whole order line when lineIds contains id strings, shipping is included and "CancelAuthorization" transaction is added to an authorized pay later order', async () => {
        const expectedDeleteParams = '{"lines":[{"id":"odl_1.pdue8w"},{"id":"odl_1.vfuxoy"}]}';
        const getOrderScope = nock('https://api.mollie.com/v2')
          .get(uri => uri.includes(mollieOrderId))
          .reply(200, mockAuthorizedOrder);
        const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}/lines`, expectedDeleteParams).reply(204);

        const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
        mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
        mockCTPaymentObj.resource.obj.transactions = [
          {
            id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
            type: CTTransactionType.Authorization,
            state: CTTransactionState.Success,
            amount: {
              currencyCode: 'EUR',
              centAmount: 674,
            },
            interactionId: molliePaymentId,
          },
          // Transaction added to trigger Cancel flow
          {
            id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
            type: CTTransactionType.CancelAuthorization,
            state: CTTransactionState.Initial,
            amount: {
              currencyCode: 'EUR',
              centAmount: 250,
            },
            custom: {
              fields: {
                lineIds: 'd102ef48-89dd-428c-bad5-edbe2ef0bbca',
                includeShipping: true,
              },
            },
          },
        ];

        const res = await request(app).post('/').send(mockCTPaymentObj);
        const { status, body } = res;
        expect(status).toBe(200);

        // Check actions
        const { actions } = body;
        expect(actions).toHaveLength(4);
        const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
        expect(updateStateAction.state).toBe('Success');
        const interfaceInteraction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
        expect(interfaceInteraction.fields.actionType).toBe('cancelOrder');

        expect(cancelOrderScope.isDone()).toBe(true);
        expect(getOrderScope.isDone()).toBe(true);
        expect(cancelOrderScope.isDone()).toBe(true);
      });
    });
  });

  describe('Unhappy Path', () => {
    it('should return error "CancelAuthorization" transaction is added to an already paid, (i.e. authorized and captured), pay later order', async () => {
      const cancelOrderScope = nock('https://api.mollie.com/v2').delete(`/orders/${mollieOrderId}`).reply(400, cancelOrderError);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Authorization,
          state: CTTransactionState.Success,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
          interactionId: molliePaymentId,
        },
        {
          id: '2b5f68ad-ae94-4bf1-ae41-7096e5142f89',
          type: CTTransactionType.Charge,
          state: CTTransactionState.Success,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
        },
        // Transaction added to trigger Cancel flow
        {
          id: '55936871-55ed-484d-ab4c-7c1ce944a07d',
          type: CTTransactionType.CancelAuthorization,
          state: CTTransactionState.Initial,
          amount: {
            currencyCode: 'EUR',
            centAmount: 90000,
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;
      expect(status).toBe(400);

      const error = body.errors[0];
      expect(error).toEqual({
        code: 'SyntaxError',
        message: 'The order cannot be canceled from state: completed',
        extensionExtraInfo: {
          title: 'Bad Request',
          originalStatusCode: 400,
          links: {
            documentation: {
              href: 'https://docs.mollie.com/overview/handling-errors',
              type: 'text/html',
            },
          },
        },
      });

      expect(cancelOrderScope.isDone()).toBeTruthy();
    });
  });
});
