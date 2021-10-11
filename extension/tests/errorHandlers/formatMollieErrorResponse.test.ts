import { CTUpdatesRequestedResponse, CTError } from '../../src/types';
import { formatMollieErrorResponse } from '../../src/errorHandlers/formatMollieErrorResponse';

describe('formatMollieErrorResponse', () => {
  it("should return Forbidden when error's status is 403 or 4O1", () => {
    const mockError = {
      status: 401,
      title: 'Unauthorized Request',
      links: {
        documentation: { href: 'https://docs.mollie.com/overview/authentication', type: 'text/html' },
      },
    };
    const { status, errors } = formatMollieErrorResponse(mockError);
    expect(status).toBe(400);
    expect(errors?.length).toBe(1);
    errors?.forEach(error => {
      expect(error).toMatchSnapshot();
    });
  });

  it("should return Bad request when error's status is 400", () => {
    const mockError = {
      status: 400,
      title: 'Bad Request',
      field: 'amount.value',
      links: {
        documentation: { href: 'https://docs.mollie.com/overview/handling-errors', type: 'text/html' },
      },
    };
    const { status, errors } = formatMollieErrorResponse(mockError);
    expect(status).toBe(400);
    expect(errors?.length).toBe(1);
    errors?.forEach(error => {
      expect(error).toMatchSnapshot();
    });
  });

  it("should return a general 4xx error when the error's status is 4xx, but not 400, 401 or 403", () => {
    const mockError422 = {
      status: 422,
      title: 'Unprocessable Entity',
      field: 'amount.value',
      links: {
        documentation: { href: 'https://docs.mollie.com/overview/handling-errors', type: 'text/html' },
      },
    };
    const { status: status422, errors: errors422 } = formatMollieErrorResponse(mockError422);
    expect(status422).toBe(400);
    expect(errors422?.length).toBe(1);
    errors422?.forEach(error => {
      expect(error).toMatchSnapshot();
    });

    const mockError402 = {
      status: 402,
      title: 'Payment Required',
      field: 'amount.value',
      links: {
        documentation: { href: 'https://docs.mollie.com/overview/handling-errors', type: 'text/html' },
      },
    };
    const { status: status402, errors: errors402 } = formatMollieErrorResponse(mockError402);
    expect(status402).toBe(400);
    expect(errors402?.length).toBe(1);
    errors402?.forEach(error => {
      expect(error).toMatchSnapshot();
    });
  });

  it("should return General error when the error's status is greater or equal to 500", () => {
    const mockError = {
      status: 503,
      title: 'Server Error',
      field: '',
      links: {
        documentation: { href: 'https://docs.mollie.com/overview/handling-errors', type: 'text/html' },
      },
    };
    const { status, errors } = formatMollieErrorResponse(mockError);
    expect(status).toBe(400);
    expect(errors?.length).toBe(1);
    errors?.forEach(error => {
      expect(error).toMatchSnapshot();
    });
  });
});
