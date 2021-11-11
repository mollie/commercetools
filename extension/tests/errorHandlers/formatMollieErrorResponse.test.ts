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
    expect(errors).toMatchSnapshot();
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
    expect(errors).toMatchSnapshot();
  });

  it("should return Unprocessable Entity when error's status is 422", () => {
    const mockError422 = {
      status: 422,
      message: 'The maximum number of payments has been reached for this order',
      title: 'Unprocessable Entity',
      links: {
        documentation: { href: 'https://docs.mollie.com/reference/v2/orders-api/create-order-payment', type: 'text/html' },
      },
    };
    const { status: status422, errors: errors422 } = formatMollieErrorResponse(mockError422);
    expect(status422).toBe(400);
    expect(errors422?.length).toBe(1);
    expect(errors422).toMatchSnapshot();
  });

  it("should return Not Found when error's status is 404", () => {
    const mockError404 = {
      status: 404,
      title: 'Not Found',
      message: 'No order exists with token ord_xxxxx.',
      links: {
        documentation: { href: 'https://docs.mollie.com/overview/handling-errors', type: 'text/html' },
      },
    };
    const { status: status404, errors: errors404 } = formatMollieErrorResponse(mockError404);
    expect(status404).toBe(400);
    expect(errors404?.length).toBe(1);
    expect(errors404).toMatchSnapshot();
  });

  it("should return ERRRR when error's status is 409", () => {
    const mockError409 = {
      status: 409,
      title: 'Conflict',
      message: 'A duplicate refund has been detected',
      links: {
        documentation: {
            href: "https://docs.mollie.com/overview/handling-errors",
            type: "text/html"
        }
    }
    };
    const { status: status409, errors: errors409 } = formatMollieErrorResponse(mockError409);
    expect(status409).toBe(400);
    expect(errors409?.length).toBe(1);
    expect(errors409).toMatchSnapshot();
  });

  it("should return a general 4xx error when the error's status is 4xx, but not 400, 401 or 403", () => {
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
    expect(errors402).toMatchSnapshot();
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
    expect(errors).toMatchSnapshot();
  });
});
