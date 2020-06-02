import { ClientRequest } from "http";
import { Errback } from "./types.ts";

export default require("xhr") as (
  options: any,
  cb: Errback<Response>
) => ClientRequest;
