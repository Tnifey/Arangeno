import Multipart from "https://dev.jspm.io/npm:multi-part@3.0.0";

declare class MultiPart {
  append(key: string, value: ReadableStream | ArrayBuffer | string): void;
  getBoundary(): string;
  getStream(): ReadableStream;
}

export type Fields = {
  [key: string]: any;
};

export type MultipartRequest = {
  headers?: { [key: string]: string };
  body: ArrayBuffer | FormData;
};

var concatArrayBuffer = function (buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

export function toForm(fields: Fields): Promise<MultipartRequest> {
  return new Promise((resolve, reject) => {
    try {
      const multipart = Multipart as any;
      const form = new multipart();
      for (const key of Object.keys(fields)) {
        let value = fields[key];
        if (value === undefined) continue;
        if (
          !(value instanceof ReadableStream) &&
          !(value instanceof ArrayBuffer) &&
          (typeof value === "object" || typeof value === "function")
        ) {
          value = JSON.stringify(value);
        }
        form.append(key, value);
      }
      const stream = form.getStream();
      const bufs: ArrayBuffer[] = [];
      stream.on("data", (buf: any) => bufs.push(buf as ArrayBuffer));
      stream.on("end", () => {
        const rn = new TextEncoder().encode("\r\n");
        bufs.push(rn);

        const body = concatArrayBuffer(bufs[0], bufs[1]);
        const boundary = form.getBoundary();
        const headers = {
          "content-type": `multipart/form-data; boundary=${boundary}`,
          "content-length": String(body.byteLength),
        };
        resolve({ body, headers });
      });
      stream.on("error", (e: any) => {
        reject(e);
      });
    } catch (e) {
      reject(e);
    }
  });
}
