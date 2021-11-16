import { Request } from 'express';
import { checkAuthorizationHeader, isAuthorizationHeaderValid } from '../../src/authentication/authenticationHandler';

jest.mock('../../config/config', () => {
  return {
    commercetools: {
      authentication: {
        isBasicAuth: true,
        username: 'user',
        password: 'password',
      },
    },
  };
});

describe('checkAuthorizationHeader', () => {
  const req = {} as Request;
  beforeEach(() => {
    req.headers = {
      authorization: 'Basic dXNlcjpwYXNzd29yZA==',
    };
  });

  afterAll(() => {
    jest.unmock('../../config/config');
  });

  it('should return isValid: true when basicAuth is enabled and the correct authorization header is passed', () => {
    const { isValid } = checkAuthorizationHeader(req.headers);
    expect(isValid).toBeTruthy();
  });

  it('should return isValid: false & correct message when basicAuth is enabled and the incorrect authorization header is passed', () => {
    req.headers.authorization = 'Basic incorrect';
    const { isValid, message } = checkAuthorizationHeader(req.headers);
    expect(isValid).toBeFalsy();
    expect(message).toBe('Authorization header is invalid');
  });

  it('should return isValid: false & correct message when basicAuth is enabled and the no authorization header is passed', () => {
    req.headers = {};
    const { isValid, message } = checkAuthorizationHeader(req.headers);
    expect(isValid).toBeFalsy();
    expect(message).toBe('No authorization header present');
  });
});

describe('isAuthorizationHeaderValid', () => {
  beforeEach(() => {});
  it('should return true if the decoded username and password match those in config', () => {
    const result = isAuthorizationHeaderValid('Basic dXNlcjpwYXNzd29yZA==');
    expect(result).toBeTruthy();
  });

  it('should return false if the decoded username and password do not match those in config', () => {
    const result = isAuthorizationHeaderValid('Basic dXNlcjpub3RwYXNzd29yZA==');
    expect(result).toBeFalsy();
  });

  it('should return false if the decoded header is invalid', () => {
    const result = isAuthorizationHeaderValid('   ');
    expect(result).toBeFalsy();
  });
});
