import { checkAuthorizationHeader, isAuthorizationHeaderValid } from '../../../src/authentication/authenticationHandler';
import { HandleRequestInput } from '../../../src/types';
let commercetools = {} as any;

jest.mock('../../../config/config', () => {
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
  let req = {} as HandleRequestInput;
  req = new HandleRequestInput('/', 'POST', {});
  beforeEach(() => {
    req.headers.set('authorization', 'Basic dXNlcjpwYXNzd29yZA==');
    commercetools = {
      authentication: {
        isBasicAuth: true,
        username: 'user',
        password: 'password',
      },
    };
  });

  afterAll(() => {
    jest.unmock('../../../config/config');
  });

  it('should return isValid: true when basicAuth is enabled and the correct authorization header is passed', () => {
    const { isValid } = checkAuthorizationHeader(req.headers);
    expect(isValid).toBeTruthy();
  });
  it('should return isValid: true when basicAuth is disabled', () => {
    commercetools.authentication.isBasicAuth = false;
    const { isValid } = checkAuthorizationHeader(req.headers);
    expect(isValid).toBeTruthy();
  });

  it('should return isValid: false & correct message when basicAuth is enabled and the incorrect authorization header is passed', () => {
    req.headers.set('authorization', 'Basic incorrect');
    const { isValid, message } = checkAuthorizationHeader(req.headers);
    expect(isValid).toBeFalsy();
    expect(message).toBe('Authorization header is invalid');
  });

  it('should return isValid: false & correct message when basicAuth is enabled and the no authorization header is passed', () => {
    req.headers.clear();
    const { isValid, message } = checkAuthorizationHeader(req.headers);
    expect(isValid).toBeFalsy();
    expect(message).toBe('No authorization header present');
  });
});

describe('isAuthorizationHeaderValid', () => {
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
