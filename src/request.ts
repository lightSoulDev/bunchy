export type BunchyRequest = Request & {
  routePath?: string;
  params?: Record<string, string[]>;
  searchParams?: URLSearchParams;
};

// export default class BunchyRequest implements Request {
//   private _request: Request;
//   private _routePath: string;
//   private _pathname: string;
//   private _params: Record<string, string[]>;
//   private _searchParams: URLSearchParams;

//   constructor(request: Request, routePath: string, params: Record<string, string[]>) {
//     const { searchParams, pathname } = new URL(request.url);

//     this._request = request;
//     this._searchParams = new URLSearchParams();
//     this._pathname = pathname;
//     this._params = params;
//     this._routePath = routePath;
//   }

//   get url(): string {
//     return this._request.url;
//   }

//   get method(): string {
//     return this._request.method;
//   }

//   get headers(): Headers {
//     return this._request.headers;
//   }

//   get params(): Record<string, string[]> {
//     return this._params;
//   }

//   get searchParams(): URLSearchParams {
//     return this._searchParams;
//   }

//   get pathname(): string {
//     return this._pathname;
//   }

//   get routePath(): string {
//     return this._routePath;
//   }

//   get body(): ReadableStream<Uint8Array> | null {
//     return this._request.body;
//   }
// }
