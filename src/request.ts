export type BunchyRequest = Request & {
  get params(): Record<string, string[]>;
  get searchParams(): URLSearchParams;
  get routePath(): string;
};