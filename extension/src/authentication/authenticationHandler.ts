import { Request } from 'express';
import config from '../../config/config';

export const checkAuthorizationHeader = (headers: Request['headers']) => {
  const response = {
    isValid: true,
    message: '',
  };
  const isAuthEnabled = isBasicAuthEnabled();
  if (isAuthEnabled) {
    const authHeader = getAuthorizationHeader(headers);
    if (!authHeader) {
      return {
        isValid: false,
        message: 'No authorization header present',
      };
    } else {
      const isValidHeader = isAuthorizationHeaderValid(authHeader);
      if (isValidHeader) {
        return response;
      } else {
        return {
          isValid: false,
          message: 'Authorization header is invalid',
        };
      }
    }
  }
  return response;
};

const getAuthorizationHeader = (headers: Request['headers']) => {
  return headers?.['authorization'];
};

const isBasicAuthEnabled = () => {
  const {
    commercetools: {
      authentication: { isBasicAuth },
    },
  } = config;
  return isBasicAuth;
};

const isAuthorizationHeaderValid = (authHeaderString: string) => {
  const {
    commercetools: {
      authentication: { username: storedUsername, password: storedPassword },
    },
  } = config;

  const encodedToken = authHeaderString.split('Basic ');
  const decodedToken = Buffer.from(encodedToken[1], 'base64').toString();
  const credentials = decodedToken.split(':');

  const incomingUsername = credentials[0];
  const incomingPassword = credentials[1];

  return incomingUsername === storedUsername && incomingPassword === storedPassword;
};
