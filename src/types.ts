import { BunchyRequest } from "./request";
import BunchyResponse from "./response";

export const HttpMethods = new Set([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "OPTIONS",
  "HEAD",
  "TRACE",
  "CONNECT",
] as const);

type SetType<S> = S extends Set<infer T> ? T : never;
export type HttpMethod = SetType<typeof HttpMethods>;

export type Handler = (
  req: BunchyRequest,
  res: BunchyResponse,
  next?: (err?: Error) => void
) => void | Promise<void>;

export type ErrorHandler = (
  req: BunchyRequest,
  res: BunchyResponse,
  err: BunchyError
) => void | Promise<void>;

export type RequestHandler = (path: string, ...handlers: Handler[]) => void;

export interface RequestRouter {
  get: RequestHandler;
  post: RequestHandler;
  put: RequestHandler;
  delete: RequestHandler;
  patch: RequestHandler;
  options: RequestHandler;
}

export interface SSLOptions {
  keyFile: string;
  certFile: string;
  passphrase?: string;
  caFile?: string;
  dhParamsFile?: string;
  lowMemoryMode?: boolean;
}

export type HandleWrapper = {
  pre?: (req: BunchyRequest) => any;
  post: (req: BunchyRequest, res: BunchyResponse, data?: any) => void;
};

export type BunchyError = {
  code: number;
  message: string;
  key?: string;
};
