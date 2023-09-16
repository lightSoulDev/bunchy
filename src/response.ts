export default class ServerResponse {
  private _response: Response | null = null;
  private _options: ResponseInit = {};

  json(body: any): void {
    this._response = Response.json(body, this._options);
  }

  send(body: any): void {
    this._response = new Response(body, this._options);
  }

  end(): void {
    this._response = new Response(undefined, this._options);
  }

  setStatus(status: number): ServerResponse {
    this._options.status = status;
    return this;
  }

  get status(): number {
    return this._options.status as number;
  }

  set status(status: number) {
    this._options.status = status;
  }

  setStatusText(statusText: string): ServerResponse {
    this._options.statusText = statusText;
    return this;
  }

  get statusText(): string {
    return this._options.statusText as string;
  }

  set statusText(statusText: string) {
    this._options.statusText = statusText;
  }

  setHeader(key: string, value: string): ServerResponse {
    if (!key || !value) {
      throw new Error("header key and value are required");
    }

    if (!this._options.headers) {
      this._options.headers = {} as Record<string, string>;
    }
    (this._options.headers as Record<string, string>)[key] = value;
    return this;
  }

  setHeaders(headers: Record<string, string>): ServerResponse {
    this._options.headers = headers;
    return this;
  }

  get headers(): Record<string, string> {
    return this._options.headers as Record<string, string>;
  }
  set headers(headers: Record<string, string>) {
    this._options.headers = headers;
  }

  get response(): Response | null {
    return this._response;
  }

  get isReady(): boolean {
    return !!this.response;
  }
}
