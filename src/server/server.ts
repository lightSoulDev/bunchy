import { Server } from "bun";
import RadixRouter from "../router/router";
import { RouteTreeNode } from "../tree/tree";
import { Handler, HttpMethod, RequestRouter } from "../types";
import { responseProxy } from "../response";
import { MethodNotAllowedError, NotFoundError } from "../router/errors";
import { MiddlewareChain } from "./chain";

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

  serve(port: number, options: any): Server {
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
      async fetch(req: Request): Promise<Response> {
        const { searchParams, pathname } = new URL(req.url);
        const method = req.method as HttpMethod;
        const res = responseProxy();

        const resolver = that.resolve(method, pathname);
        if (resolver.error) {
          return new Response(resolver.error.message, {
            status: 404,
          });
        }

        const { routePath, middlewares, requestHandler, params } = resolver.result!;
        if (middlewares.length) {
          const chain = new MiddlewareChain(req, res, params, routePath, middlewares);
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

        const response = requestHandler.apply(that, [req, res, params, routePath]);
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
    });
  }

  private resolve(method: HttpMethod, path: string): RouteResolver {
    if (!this._routeTree) throw new Error("Route tree is not initialized");

    const node = this._routeTree.get(path);
    if (!node) return { result: null, error: NotFoundError };

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
