import { Request, Response } from 'express';
import { mocked } from 'ts-jest/utils';
import actions from '../../src/requestHandlers/actions';
import handleRequest from '../../src/requestHandlers/handleRequest';

jest.mock('../../src/requestHandlers/actions');

describe('handleRequest', () => {
  const req = {} as Request;
  const res = {} as Response;

  const mockStatus = jest.fn().mockReturnValue(res);
  const mockSend = jest.fn().mockReturnValue(res);
  const mockEnd = jest.fn();
  const mockConsoleWarn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    res.status = mockStatus;
    res.send = mockSend;
    res.end = mockEnd;
    req.path = '/';
    console.warn = mockConsoleWarn;
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should return a list of actions and status 200 when processed action returns successfully', async () => {
    mocked(actions.getPaymentMethods).mockResolvedValue({ status: 200, actions: [{ action: 'update' }] });

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockSend).toHaveBeenCalledWith({ actions: [{ action: 'update' }] });
  });

  it('should return status 400 if the request path is not /', async () => {
    req.path = '/something';

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenCalledWith(400);
  });

  it('should return status 400 and an array of formatted errors if an error happens whilst processing actions', async () => {
    mocked(actions.getPaymentMethods).mockResolvedValue({
      status: 400,
      errors: [
        {
          code: 'Unauthorized',
          message: 'API Key error',
        },
      ],
    });

    await handleRequest(req, res);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockSend).toHaveBeenCalledWith({
      errors: [
        {
          code: 'Unauthorized',
          message: 'API Key error',
        },
      ],
    });
  });

  it('should catch and handle errors and return a general error response to CT', async () => {
    const mockError = new Error('Something went wrong');
    mockError.name = 'Big error';
    mocked(actions.getPaymentMethods).mockRejectedValue({ name: 'Big error', message: 'Something went wrong' });

    await handleRequest(req, res);
    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockSend).toHaveBeenCalledWith({
      errors: [
        {
          code: 'General',
          message: 'error_name: Big error, error_message: Something went wrong',
        },
      ],
    });
    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
  });
});
