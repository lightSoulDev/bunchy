import { BunchyError } from "./types";

export const composeError = ({ code, message, key }: BunchyError): string => {
  return JSON.stringify({
    code: code,
    message: message,
    key: key,
  });
};

export const NotFoundError = composeError({
  code: 404,
  message: "route not found",
} as const);

export const MethodNotAllowedError = composeError({
  code: 405,
  message: "route not found",
} as const);
