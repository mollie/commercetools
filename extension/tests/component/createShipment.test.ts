import _ from 'lodash';
import nock from 'nock';
import request from 'supertest';
import { CTTransactionState, CTTransactionType } from '../../src/types';
import app from '../../src/app';
import Logger from '../../src/logger/logger';
import { orderAuthorized, orderShipmentSuccess, shipmentError } from './mockResponses/mollieData/createShipment.data';

describe('Capture Funds', () => {
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
          centAmount: 224,
        },
      },
    },
  };

  beforeAll(() => {
    Logger.error = mockLogError;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Happy Path', () => {
    it('should capture funds for the whole order when charge transaction is added to authorized order and no custom fields are specified', async () => {
      const createShipmentScope = nock('https://api.mollie.com/v2').post(`/orders/${mollieOrderId}/shipments`).reply(200, orderShipmentSuccess);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '1a345dcd-17a2-4662-bf58-4c086bb4bbe2',
          timestamp: '2022-01-19T10:41:21.000Z',
          type: CTTransactionType.Authorization,
          amount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 224,
            fractionDigits: 2,
          },
          interactionId: molliePaymentId,
          state: CTTransactionState.Success,
        },
        // Transaction added to trigger create shipment flow
        {
          type: CTTransactionType.Charge,
          amount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 224,
            fractionDigits: 2,
          },
          state: CTTransactionState.Initial,
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;
      expect(status).toBe(201);

      // Check actions
      const { actions } = body;
      expect(actions).toHaveLength(5);
      const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
      expect(updateStateAction.state).toBe('Success');
      const interfaceInteraction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
      expect(interfaceInteraction.fields.actionType).toBe('createShipment');

      expect(createShipmentScope.isDone()).toBe(true);
    });
    it('should capture funds for part of an order when charge transaction is added to authorized order and valid cart lineIds are specified', async () => {
      const getOrderScope = nock('https://api.mollie.com/v2').get(`/orders/${mollieOrderId}`).reply(200, orderAuthorized);
      const createShipmentScope = nock('https://api.mollie.com/v2').post(`/orders/${mollieOrderId}/shipments`).reply(200, orderShipmentSuccess);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '1a345dcd-17a2-4662-bf58-4c086bb4bbe2',
          timestamp: '2022-01-19T10:41:21.000Z',
          type: CTTransactionType.Authorization,
          amount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 224,
            fractionDigits: 2,
          },
          interactionId: molliePaymentId,
          state: CTTransactionState.Success,
        },
        // Transaction added to trigger create shipment flow
        {
          type: CTTransactionType.Charge,
          amount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 112,
            fractionDigits: 2,
          },
          state: CTTransactionState.Initial,
          custom: {
            fields: {
              lineIds:
                '[{"id":"83bdde2b-99fb-4e60-a172-00e0b694be72","quantity": 1,"totalPrice": {"currencyCode": "EUR","centAmount": 112,"fractionDigits": 2 }},{"id":"bc49e041-539b-4127-b813-ba52b7728c71","quantity": 2,"totalPrice": {"currencyCode": "EUR","centAmount": 820,"fractionDigits": 2 }}]',
              includeShipping: true,
            },
          },
        },
      ];

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;
      expect(status).toBe(201);

      // Check actions
      const { actions } = body;
      expect(actions).toHaveLength(5);
      const updateStateAction = actions.find((action: any) => action.action === 'changeTransactionState');
      expect(updateStateAction.state).toBe('Success');
      const interfaceInteraction = actions.find((action: any) => action.action === 'addInterfaceInteraction');
      expect(interfaceInteraction.fields.actionType).toBe('createShipment');

      expect(getOrderScope.isDone()).toBe(true);
      expect(createShipmentScope.isDone()).toBe(true);
    });
  });

  describe('Unhappy Path', () => {
    it('should return mollie error when attempting to capture funds that have already been captured', async () => {
      const createShipmentScope = nock('https://api.mollie.com/v2').post(`/orders/${mollieOrderId}/shipments`).reply(422, shipmentError);

      const mockCTPaymentObj = _.cloneDeep(baseMockCTPayment);
      mockCTPaymentObj.resource.obj.paymentMethodInfo.method = 'klarnapaylater';
      mockCTPaymentObj.resource.obj.transactions = [
        {
          id: '1a345dcd-17a2-4662-bf58-4c086bb4bbe2',
          timestamp: '2022-01-19T10:41:21.000Z',
          type: CTTransactionType.Authorization,
          amount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 224,
            fractionDigits: 2,
          },
          interactionId: molliePaymentId,
          state: CTTransactionState.Success,
        },
        // Transaction added to trigger create shipment flow
        {
          type: CTTransactionType.Charge,
          amount: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 112,
            fractionDigits: 2,
          },
          state: CTTransactionState.Initial,
        },
      ];
      const expectedResponseBody = {
        errors: [
          {
            code: 'SemanticError',
            message: 'This order cannot be shipped.',
            extensionExtraInfo: {
              originalStatusCode: 422,
              links: {
                documentation: {
                  href: 'https://docs.mollie.com/reference/v2/shipments-api/create-shipment',
                  type: 'text/html',
                },
              },
              title: 'Unprocessable Entity',
            },
          },
        ],
      };

      const res = await request(app).post('/').send(mockCTPaymentObj);
      const { status, body } = res;

      expect(status).toBe(400);
      expect(body).toEqual(expectedResponseBody);
      expect(createShipmentScope.isDone()).toBe(true);
    });
  });
});
