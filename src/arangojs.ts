import { aql } from "./aql-query.ts";
import { CollectionType } from "./collection.ts";
import { Config } from "./connection.ts";
import { Database } from "./database.ts";
import { ArangoError } from "./error.ts";

export default function arangojs(config: Config) {
  return new Database(config);
}

Object.assign(arangojs, { CollectionType, ArangoError, Database, aql });
export { DocumentCollection, EdgeCollection } from "./collection.ts";
export { Graph } from "./graph.ts";
export { Database, aql };
