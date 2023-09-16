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
  req: BunchyRequest | null,
  res: BunchyResponse | null,
  next?: (err?: Error) => void
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
