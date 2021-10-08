import { CTUpdatesRequestedResponse, CTError } from '../../src/types';
import { formatMollieErrorResponse } from "../../src/errorHandlers/formatMollieErrorResponse"

describe('formatMollieErrorResponse', () => {
  it("should return Forbidden when error's status is 403 or 4O1", () => {
    const mockError = {
      status: 401,
      title: "Unauthorized Request",
      links: { 
        documentation: 
          { href: "https://docs.mollie.com/overview/authentication", type:"text/html"}
      } 
    }
    const { status, errors } = formatMollieErrorResponse(mockError);
    expect(status).toBe(400);
    expect(errors?.length).toBe(1)
    errors?.forEach((error) => {
      expect(error).toMatchSnapshot();
    })
  });

  it("should return Bad request when error's status is 400", () => {
    const mockError = {
      status: 400,
      title: "Bad Request",
      links: { 
        documentation: 
          { href: "https://docs.mollie.com/another-link", type:"text/html"}
      } 
    }
    const { status, errors } = formatMollieErrorResponse(mockError);
    expect(status).toBe(400);
    expect(errors?.length).toBe(1)
    errors?.forEach((error) => {
      expect(error).toMatchSnapshot();
    })
  });

  it("should return General error when the error's status is greater or equal to 500", () => {
    const mockError = {
      status: 503,
      title: "Server Error",
      field: "",
      links: { 
        documentation: 
          { href: "https://docs.mollie.com/another-general-error-link", type:"text/html"}
      } 
    }
    const { status, errors } = formatMollieErrorResponse(mockError);
    expect(status).toBe(400);
    expect(errors?.length).toBe(1)
    errors?.forEach((error) => {
      expect(error).toMatchSnapshot();
    })
  });
});
