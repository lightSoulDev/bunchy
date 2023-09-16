import BunchyResponse from "../response";
import { BunchyRequest, Handler } from "../types";

export class MiddlewareChain {
  private calls: Array<() => boolean> = [];
  private isReady = false;

  constructor(req: BunchyRequest, res: BunchyResponse, middlewares: Handler[]) {
    this.calls = middlewares.map((middleware) => {
      return () => {
        middleware(req, res, this.next);
        return this.isReady;
      };
    });

    this.next = this.next.bind(this);
  }

  next(err?: Error): void {
    if (err) {
      throw err;
    }

    if (this.calls.length === 0) {
      return;
    }

    const current = this.calls.shift();
    console.log("[ResponseChain] calling: ", current, "length: ", this.length);
    this.isReady = current!();

    if (this.isReady) {
      return;
    }
  }

  get length(): number {
    return this.calls.length;
  }
}
