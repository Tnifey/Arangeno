import { format as formatUrl, parse as parseUrl } from "url";
import {
  Agent as HttpAgent,
  ClientRequest,
  ClientRequestArgs,
  IncomingMessage,
  request as httpRequest,
} from "https://deno.land/std/http/server.ts";

import { joinPath } from "./joinPath.ts";
import { Errback } from "./types.ts";
import xhr from "./xhr.ts";

export type ArangojsResponse = IncomingMessage & {
  request: ClientRequest;
  body?: any;
  arangojsHostId?: number;
};

export type ArangojsError = Error & {
  request: ClientRequest;
};

export interface RequestOptions {
  method: string;
  url: { pathname: string; search?: string };
  headers: { [key: string]: string };
  body: any;
  expectBinary: boolean;
  timeout?: number;
}

export const isBrowser = true;

function omit<T>(obj: T, keys: (keyof T)[]): T {
  const result = {} as T;
  for (const key of Object.keys(obj)) {
    if (keys.includes(key as keyof T)) continue;
    result[key as keyof T] = obj[key as keyof T];
  }
  return result;
}

export function createRequest(baseUrl: string, agentOptions: any) {
  const { auth, ...baseUrlParts } = parseUrl(baseUrl);
  const options = omit(agentOptions, [
    "keepAlive",
    "keepAliveMsecs",
    "maxSockets"
  ]);
  return function request(
    { method, url, headers, body, timeout, expectBinary }: RequestOptions,
    cb: Errback<ArangojsResponse>
  ) {
    const urlParts = {
      ...baseUrlParts,
      pathname: url.pathname
        ? baseUrlParts.pathname
          ? joinPath(baseUrlParts.pathname, url.pathname)
          : url.pathname
        : baseUrlParts.pathname,
      search: url.search
        ? baseUrlParts.search
          ? `${baseUrlParts.search}&${url.search.slice(1)}`
          : url.search
        : baseUrlParts.search
    };
    if (!headers["authorization"]) {
      headers["authorization"] = `Basic ${btoa(auth || "root:")}`;
    }

    let callback: Errback<ArangojsResponse> = (err, res) => {
      callback = () => undefined;
      cb(err, res);
    };
    const req = xhr(
      {
        responseType: expectBinary ? "blob" : "text",
        ...options,
        url: formatUrl(urlParts),
        withCredentials: true,
        useXDR: true,
        body,
        method,
        headers,
        timeout
      },
      (err: Error | null, res?: any) => {
        if (!err) {
          if (!res.body) res.body = "";
          callback(null, res as ArangojsResponse);
        } else {
          const error = err as ArangojsError;
          error.request = req;
          callback(error);
        }
      }
    );
  };
}
