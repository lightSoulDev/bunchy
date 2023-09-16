import { Errorlike, Server } from "bun";
import RadixRouter from "../router/router";
import { RouteTreeNode } from "../tree/tree";
import { Handler, HttpMethod, RequestRouter, SSLOptions } from "../types";
import { responseProxy } from "../response";
import { MethodNotAllowedError, NotFoundError } from "../router/errors";
import { MiddlewareChain } from "./chain";
import { BunchyRequest } from "../request";

export default function bunchy() {
  return Bunchy.instance;
}

type RouteResolver = {
  result: {
    routePath: string;
    middlewares: Handler[];
    requestHandler: Handler | null;
    params: Record<string, string[]>;
  } | null;
  error: Error | null;
};

class Bunchy implements RequestRouter {
  // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  // =-             S I N G L E T O N E             -=
  // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

  private static _instance: Bunchy;

  private constructor() {
    if (Bunchy._instance) {
      throw new Error(
        "Error: Instantiation failed: Use server() instead of creating BunServer instance."
      );
    }
    Bunchy._instance = this;
  }

  public static get instance(): Bunchy {
    return Bunchy._instance || (Bunchy._instance = new this());
  }

  // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  // =-    R O O T   R O U T E R   M E T H O D S    -=
  // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

  private rootRouter = new RadixRouter();

  /**
   * Add middleware on global level
   * @param middleware
   */
  use(middleware: Handler): void;

  /**
   * Add middleware on path
   * @param path
   * @param middleware
   */
  use(path: string, middleware: Handler): void;

  /**
   * Attach router
   * @param path
   * @param router
   */
  use(path: string, router: RadixRouter): void;

  use(arg1: string | Handler, arg2?: Handler | RadixRouter): void {
    this.rootRouter.use(arg1 as any, arg2 as any);
  }

  get(path: string, ...handlers: Handler[]): void {
    this.rootRouter.get(path, ...handlers);
  }

  post(path: string, ...handlers: Handler[]): void {
    this.rootRouter.post(path, ...handlers);
  }

  put(path: string, ...handlers: Handler[]): void {
    this.rootRouter.put(path, ...handlers);
  }

  delete(path: string, ...handlers: Handler[]): void {
    this.rootRouter.delete(path, ...handlers);
  }

  patch(path: string, ...handlers: Handler[]): void {
    this.rootRouter.patch(path, ...handlers);
  }

  options(path: string, ...handlers: Handler[]): void {
    this.rootRouter.options(path, ...handlers);
  }

  // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  // =-             B U N   S E R V E R             -=
  // =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
  private _routeTree: RouteTreeNode | null = null;

  serve(port: number, hostname?: string, options?: SSLOptions): Server {
    this._routeTree = new RouteTreeNode();
    const map = this.rootRouter.attach();
    for (const path in map) {
      const routeHandlers = map[path];
      this._routeTree.set(path, routeHandlers);
    }

    this._routeTree.print();

    const that = this;
    return Bun.serve({
      port,
      hostname,
      keyFile: options?.keyFile,
      certFile: options?.certFile,
      passphrase: options?.passphrase,
      caFile: options?.caFile,
      dhParamsFile: options?.dhParamsFile,
      lowMemoryMode: options?.lowMemoryMode,
      development: process.env.SERVER_ENV !== "production",
      async fetch(_req: Request): Promise<Response> {
        const { searchParams, pathname } = new URL(_req.url);
        const method = _req.method as HttpMethod;
        const res = responseProxy();

        const resolver = that.resolve(method, pathname);
        if (resolver.error) {
          throw resolver.error;
        }
        const { routePath, middlewares, requestHandler, params } = resolver.result!;
        const req = {
          ..._req,
          routePath,
          params,
          searchParams,
        } as BunchyRequest;

        if (middlewares.length) {
          const chain = new MiddlewareChain(req, res, middlewares);
          chain.next();

          if (res.isReady) {
            return res.response!;
          }

          if (chain.length) {
            return new Response("Middleware chain was stuck", {
              status: 500,
            });
          }
        }

        if (!requestHandler) {
          return new Response("Method not allowed", {
            status: 405,
          });
        }

        const response = requestHandler.apply(that, [req, res]);
        if (response instanceof Promise) {
          await response;
          if (res.isReady) {
            return res.response!;
          }
        }

        if (!res.isReady) {
          return new Response("Response was not sent", {
            status: 500,
          });
        }

        return res.response!;
      },
      async error(err: Errorlike): Promise<Response> {
        return new Response(err.message, {
          status: 500,
        });
      },
    });
  }

  private resolve(method: HttpMethod, path: string): RouteResolver {
    if (!this._routeTree) throw new Error("Route tree is not initialized");

    const node = this._routeTree.get(path);
    if (!node.value) return { result: null, error: NotFoundError };

    return {
      result: {
        routePath: node.routePath,
        middlewares: node.allMiddlewares ?? [],
        requestHandler: node.value?.requestHandlers[method] ?? null,
        params: node.params ?? {},
      },
      error: null,
    };
  }
}
