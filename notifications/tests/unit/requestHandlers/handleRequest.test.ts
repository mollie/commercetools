import { Payment, Order } from '@mollie/api-client';
import { mocked } from 'ts-jest/utils';
import { CTPayment } from '../../../src/types/ctPayment';
import handleRequest from '../../../src/requestHandlers/handleRequest';
import Logger from '../../../src/logger/logger';
import { HandleRequestInput } from '../../../src/types/requestHandler';
import { handleOrderWebhook } from '../../../src/requestHandlers/webhookHandlers/handleOrderWebhook';
import { handlePaymentWebhook } from '../../../src/requestHandlers/webhookHandlers/handlePaymentWebhook';

jest.mock('../../../src/requestHandlers/webhookHandlers/handleOrderWebhook');
jest.mock('../../../src/requestHandlers/webhookHandlers/handlePaymentWebhook');

describe('handleRequest', () => {
  const mockPaymentId = 'tr_1234';
  const mockOrderId = 'ord_1234';

  const mockCTPayment = {
    id: '85fdcccf-bfa1-4d4d-82fb-0350e494824a',
    key: mockOrderId,
    version: 2,
    custom: {
      fields: {
        mollieOrderStatus: 'created',
      },
    },
    transactions: [
      {
        id: 'b83b650d-a579-4a53-a74c-e1911b0feacd',
        state: 'Initial',
        interactionId: mockPaymentId,
      },
    ],
  } as CTPayment;

  const mockLogError = jest.fn();
  const mockLogDebug = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Logger.error = mockLogError;
    Logger.debug = mockLogDebug;

    mocked(handleOrderWebhook).mockResolvedValue(mockCTPayment);
    mocked(handlePaymentWebhook).mockResolvedValue(mockCTPayment);
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  describe('Error responses', () => {
    it('should return 400 if webhook is called with a path that is not /', async () => {
      const mockInput = {
        httpPath: '/another-path',
      } as HandleRequestInput;

      const res = await handleRequest(mockInput);
      expect(res.status).toBe(400);
    });

    it('should return 405 if webhook is called with a method other than POST', async () => {
      const mockInput = {
        httpPath: '/',
        httpMethod: 'DELETE',
      } as HandleRequestInput;

      const res = await handleRequest(mockInput);
      expect(res.status).toBe(405);
    });

    it('should return 400 if there is an error when calling mollie (except 404) or calling commercetools', async () => {
      const mockUpdateRejected = jest.fn().mockRejectedValue(new Error('Update rejected'));
      mocked(handleOrderWebhook).mockRejectedValueOnce(mockUpdateRejected);

      const mockInput: HandleRequestInput = {
        httpPath: '/',
        httpMethod: 'POST',
        httpBody: {
          id: 'ord_1234',
        },
      };

      const res = await handleRequest(mockInput);
      expect(res.status).toBe(400);
    });
  });

  describe('Payload invalid or not found', () => {
    it('should log 400 when webhook is triggered with an invalid resource id and return 200', async () => {
      const mockInput: HandleRequestInput = {
        httpPath: '/',
        httpMethod: 'POST',
        httpBody: {
          id: 'resource',
        },
      };

      const res = await handleRequest(mockInput);
      expect(res.status).toBe(200);
    });

    it('should log error and return 200 when webhook is triggered with an unknown mollie id', async () => {
      mocked(handleOrderWebhook).mockRejectedValueOnce({ status: 404, message: 'Order not found', source: 'mollie' });

      const mockInput: HandleRequestInput = {
        httpPath: '/',
        httpMethod: 'POST',
        httpBody: {
          id: 'ord_1234',
        },
      };

      const res = await handleRequest(mockInput);
      expect(res.status).toBe(200);
    });
  });

  describe('Webhook updates successful', () => {
    it('should return 200 when the webhook is triggered with a valid mollie payment id', async () => {
      const mockInput: HandleRequestInput = {
        httpPath: '/',
        httpMethod: 'POST',
        httpBody: {
          id: 'tr_1234',
        },
      };

      const res = await handleRequest(mockInput);
      expect(res.status).toBe(200);
      expect(mockLogDebug).toHaveBeenLastCalledWith('Commercetools Payment id 85fdcccf-bfa1-4d4d-82fb-0350e494824a updated to version 2');
    });

    it('should return 200 when the webhook is triggered with a valid mollie order id', async () => {
      const mockInput: HandleRequestInput = {
        httpPath: '/',
        httpMethod: 'POST',
        httpBody: {
          id: 'ord_1234',
        },
      };

      const res = await handleRequest(mockInput);
      expect(res.status).toBe(200);
      expect(mockLogDebug).toHaveBeenLastCalledWith('Commercetools Payment id 85fdcccf-bfa1-4d4d-82fb-0350e494824a updated to version 2');
    });
  });
});
