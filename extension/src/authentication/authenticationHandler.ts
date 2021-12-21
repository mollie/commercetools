import config from '../../config/config';

export const checkAuthorizationHeader = (headers: Map<string, string>) => {
  let response = {
    isValid: true,
    message: '',
  };
  const isAuthEnabled = isBasicAuthEnabled();
  const authHeader = getAuthorizationHeader(headers);

  switch (true) {
    case !isAuthEnabled:
      break;
    case !authHeader:
      response = {
        isValid: false,
        message: 'No authorization header present',
      };
      break;
    case authHeader && !isAuthorizationHeaderValid(authHeader):
      response = {
        isValid: false,
        message: 'Authorization header is invalid',
      };
      break;
    default:
      break;
  }
  return response;
};

const getAuthorizationHeader = (headers: Map<string, string>) => {
  return headers.get('authorization');
};

const isBasicAuthEnabled = () => {
  const {
    commercetools: {
      authentication: { isBasicAuth },
    },
  } = config;
  return isBasicAuth;
};

export const isAuthorizationHeaderValid = (authHeaderString: string) => {
  const {
    commercetools: {
      authentication: { username: storedUsername, password: storedPassword },
    },
  } = config;

  const encodedToken = authHeaderString.split('Basic ');
  const decodedToken = Buffer.from(encodedToken[1] ?? '', 'base64').toString();
  const credentials = decodedToken.split(':');

  const incomingUsername = credentials[0];
  const incomingPassword = credentials[1];

  return incomingUsername === storedUsername && incomingPassword === storedPassword;
};
