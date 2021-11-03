import { getPaymentByKey } from '../../../src/requestHandlers/commercetools/getPaymentByKey';
import { CTPayment } from '../../../src/types/ctPaymentTypes';
import Logger from '../../../src/logger/logger';

jest.mock('../../../src/logger/logger');

describe('getPaymentByKey', () => {
  const mockProjectKey = 'test';
  const mockPaymentKey = 'ord_123345';
  const mockCTPayment: CTPayment = {
    id: '46f0a44d-76c3-40ec-9068-b1cec46b64d8',
    version: 2,
    key: mockPaymentKey,
    amountPlanned: {
      centAmount: 1000,
      currencyCode: 'EUR',
    },
    paymentStatus: {},
  };
  const mockResponseBody = {
    body: mockCTPayment,
  };

  const mockExecute = jest.fn().mockImplementation(() => mockResponseBody);
  const mockLogError = jest.fn();
  const mockCommerceToolsClient = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
    Logger.error = mockLogError;
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should return a CT payment when given correct variables', async () => {
    mockCommerceToolsClient.execute = mockExecute;
    const ctPayment = await getPaymentByKey(mockPaymentKey, mockCommerceToolsClient, mockProjectKey);
    expect(ctPayment).toEqual(mockCTPayment);
    expect(mockLogError).not.toHaveBeenCalled();
  });
  it('should return and log the error if an error occurs', async () => {
    const ctError = new Error('CommerceTools exception');
    const mockExecuteFailure = jest.fn().mockRejectedValue(ctError);
    mockCommerceToolsClient.execute = mockExecuteFailure;

    await expect(getPaymentByKey(mockPaymentKey, mockCommerceToolsClient, mockProjectKey)).rejects.toThrow(ctError);
    expect(mockLogError).toHaveBeenCalledTimes(1);
  });
});
