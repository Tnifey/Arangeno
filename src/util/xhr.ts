import { Errback } from "./types.ts";

// import _xhr from "https://dev.jspm.io/npm:sw-xhr";

// const xhr = _xhr as (options: any, cb: Errback<Response>) => Request;

const xhr = (
  { url, ...options }: any,
  cb: Errback<Response & { data?: any }>,
) => {
  const req = new Request(url, options);

  fetch(req)
    .catch(err => err)
    .then(async res => {
      if (res instanceof Error) {
        throw res;
      } else {
        // @ts-ignore
        const data = await res.text();

        if (data?.error) {
          data.request = req;
          cb(data);
        } else {
          res.body.text = () => data;
          cb(null, res);
        }
      }
    });

  return req;
};

export default xhr;
