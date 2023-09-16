import { RouteTreeNode } from "../tree/tree";
import { Handler, HttpMethod, RequestRouter } from "../types";
import * as PATH from "path";

export interface RouteHandlers {
  middlewares: Array<Handler>;
  requestHandlers: {
    [key in HttpMethod]?: Handler;
  };
}

export type RouterMap = {
  [key: string]: RouteHandlers;
};

export default class RadixRouter implements RequestRouter {
  private _globalPath: string;
  private _map: RouterMap;
  private _tree: RouteTreeNode;
  private _attached: boolean = false;
  // private _middlewares: Array<{ path: string; middleware: Handler }> = [];

  constructor() {
    this._globalPath = "/";
    this._map = {};
    this._tree = new RouteTreeNode();
  }

  private delegate(method: HttpMethod, path: string, handlers: Handler[]): void {
    if (this._attached) {
      throw new Error(`Cannot add route after router is attached`);
    }

    const requestHandler = handlers.pop();
    if (!requestHandler) return;

    this.register(path, handlers, { method, requestHandler });
  }

  private register(
    path: string,
    middlewares: Handler[],
    routeHandler?: { method: HttpMethod; requestHandler: Handler }
  ): void {
    if (!this._map[path])
      this._map[path] = {
        middlewares: [],
        requestHandlers: {},
      };
    this._map[path].middlewares.push(...middlewares);
    if (routeHandler) {
      if (this._map[path].requestHandlers[routeHandler.method]) {
        throw new Error(`Route ${routeHandler.method} ${path} already exists`);
      }
      this._map[path].requestHandlers[routeHandler.method] = routeHandler.requestHandler;
    }
  }

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
    if (this._attached) {
      throw new Error(`Cannot add middleware after router is attached`);
    }

    let path: string;
    let middleware: Handler;
    let router: RadixRouter;

    if (typeof arg1 !== "string") {
      path = "/";
      if (typeof arg1 === "function") {
        middleware = arg1 as Handler;
        this.register(path, [middleware]);
      } else {
        throw new Error("Router must have a path");
      }
    } else {
      path = arg1;
      if (typeof arg2 === "function") {
        middleware = arg2 as Handler;
        this.register(PATH.join(this._globalPath, path), [middleware]);
      } else {
        router = arg2 as RadixRouter;
        // attach router
      }
    }
  }

  get(path: string, ...handlers: Handler[]): void {
    this.delegate("GET", path, handlers);
  }

  post(path: string, ...handlers: Handler[]): void {
    this.delegate("POST", path, handlers);
  }

  put(path: string, ...handlers: Handler[]): void {
    this.delegate("PUT", path, handlers);
  }

  delete(path: string, ...handlers: Handler[]): void {
    this.delegate("DELETE", path, handlers);
  }

  patch(path: string, ...handlers: Handler[]): void {
    this.delegate("PATCH", path, handlers);
  }

  options(path: string, ...handlers: Handler[]): void {
    this.delegate("OPTIONS", path, handlers);
  }

  resolve(path: string): any | null {
    // return this._radixTree.dig(path);
  }

  print(): void {
    console.log(this._map);
    this._tree.print();
  }

  attach() {
    this._attached = true;
    for (const path in this._map) {
      const routeHandlers = this._map[path];
      this._tree.set(path, routeHandlers);
    }
  }
}
