import {
  ArangoCollection,
  BaseCollection,
  CollectionType,
  DocumentHandle,
  DocumentReadOptions,
  DOCUMENT_NOT_FOUND,
  EdgeCollection,
  isArangoCollection
} from "./collection.ts";
import { Connection } from "./connection.ts";
import { isArangoError } from "./error.ts";

export interface InsertOptions {
  waitForSync?: boolean;
  returnNew?: boolean;
}

export interface ReplaceOptions extends InsertOptions {
  waitForSync?: boolean;
  keepNull?: boolean;
  returnOld?: boolean;
  returnNew?: boolean;
  rev?: string;
}

export interface RemoveOptions {
  waitForSync?: boolean;
  returnOld?: boolean;
  rev?: string;
}

export interface UpdateOptions extends ReplaceOptions {}

export class GraphVertexCollection extends BaseCollection {
  type = CollectionType.DOCUMENT_COLLECTION;

  graph: Graph;

  constructor(connection: Connection, name: string, graph: Graph) {
    super(connection, name);
    this.graph = graph;
  }

  document(documentHandle: DocumentHandle, graceful: boolean): Promise<any>;
  document(
    documentHandle: DocumentHandle,
    opts?: DocumentReadOptions
  ): Promise<any>;
  document(
    documentHandle: DocumentHandle,
    opts: boolean | DocumentReadOptions = {}
  ): Promise<any> {
    if (typeof opts === "boolean") {
      opts = { graceful: opts };
    }
    const { allowDirtyRead = undefined, graceful = false } = opts;
    const result = this._connection.request(
      {
        path: `/_api/gharial/${this.graph.name}/vertex/${this._documentHandle(
          documentHandle
        )}`,
        allowDirtyRead
      },
      res => res.body.vertex
    );
    if (!graceful) return result;
    return result.catch(err => {
      if (isArangoError(err) && err.errorNum === DOCUMENT_NOT_FOUND) {
        return null;
      }
      throw err;
    });
  }

  vertex(documentHandle: DocumentHandle, graceful: boolean): Promise<any>;
  vertex(
    documentHandle: DocumentHandle,
    opts?: DocumentReadOptions
  ): Promise<any>;
  vertex(
    documentHandle: DocumentHandle,
    opts: boolean | DocumentReadOptions = {}
  ): Promise<any> {
    if (typeof opts === "boolean") {
      opts = { graceful: opts };
    }
    return this.document(documentHandle, opts);
  }

  save(data: Object | Array<Object>, opts?: InsertOptions) {
    return this._connection.request(
      {
        method: "POST",
        path: `/_api/gharial/${this.graph.name}/vertex/${this.name}`,
        body: data,
        qs: opts
      },
      res => res.body.vertex
    );
  }

  replace(
    documentHandle: DocumentHandle,
    newValue: Object | Array<Object>,
    opts: ReplaceOptions | string = {}
  ) {
    const headers: { [key: string]: string } = {};
    if (typeof opts === "string") {
      opts = { rev: opts };
    }
    if (opts.rev) {
      let rev: string;
      ({ rev, ...opts } = opts);
      headers["if-match"] = rev;
    }
    return this._connection.request(
      {
        method: "PUT",
        path: `/_api/gharial/${this.graph.name}/vertex/${this._documentHandle(
          documentHandle
        )}`,
        body: newValue,
        qs: opts,
        headers
      },
      res => res.body.vertex
    );
  }

  update(
    documentHandle: DocumentHandle,
    newValue: Object | Array<Object>,
    opts: UpdateOptions | string = {}
  ) {
    const headers: { [key: string]: string } = {};
    if (typeof opts === "string") {
      opts = { rev: opts };
    }
    if (opts.rev) {
      let rev: string;
      ({ rev, ...opts } = opts);
      headers["if-match"] = rev;
    }
    return this._connection.request(
      {
        method: "PATCH",
        path: `/_api/gharial/${this.graph.name}/vertex/${this._documentHandle(
          documentHandle
        )}`,
        body: newValue,
        qs: opts,
        headers
      },
      res => res.body.vertex
    );
  }

  remove(documentHandle: DocumentHandle, opts: RemoveOptions | string = {}) {
    const headers: { [key: string]: string } = {};
    if (typeof opts === "string") {
      opts = { rev: opts };
    }
    if (opts.rev) {
      let rev: string;
      ({ rev, ...opts } = opts);
      headers["if-match"] = rev;
    }
    return this._connection.request(
      {
        method: "DELETE",
        path: `/_api/gharial/${this.graph.name}/vertex/${this._documentHandle(
          documentHandle
        )}`,
        qs: opts,
        headers
      },
      res => res.body.removed
    );
  }
}

export class GraphEdgeCollection extends EdgeCollection {
  type = CollectionType.EDGE_COLLECTION;

  graph: Graph;

  constructor(connection: Connection, name: string, graph: Graph) {
    super(connection, name);
    this.type = CollectionType.EDGE_COLLECTION;
    this.graph = graph;
  }

  document(documentHandle: DocumentHandle, graceful: boolean): Promise<any>;
  document(
    documentHandle: DocumentHandle,
    opts?: DocumentReadOptions
  ): Promise<any>;
  document(
    documentHandle: DocumentHandle,
    opts: boolean | DocumentReadOptions = {}
  ): Promise<any> {
    if (typeof opts === "boolean") {
      opts = { graceful: opts };
    }
    const { allowDirtyRead = undefined, graceful = false } = opts;
    const result = this._connection.request(
      {
        path: `/_api/gharial/${this.graph.name}/edge/${this._documentHandle(
          documentHandle
        )}`,
        allowDirtyRead
      },
      res => res.body.edge
    );
    if (!graceful) return result;
    return result.catch(err => {
      if (isArangoError(err) && err.errorNum === DOCUMENT_NOT_FOUND) {
        return null;
      }
      throw err;
    });
  }

  save(
    data: Object | Array<Object>,
    opts?: InsertOptions
  ): Promise<any>;
  save(
    data: Object | Array<Object>,
    fromId: DocumentHandle,
    toId: DocumentHandle,
    opts?: InsertOptions
  ): Promise<any>;
  save(
    data: Object | Array<Object>,
    fromIdOrOpts?: DocumentHandle | InsertOptions,
    toId?: DocumentHandle,
    opts?: InsertOptions
  ) {
    if (toId !== undefined) {
      const fromId = this._documentHandle(fromIdOrOpts as DocumentHandle);
      toId = this._documentHandle(toId);
      if (Array.isArray(data)) {
        data = data.map(data => ({ ...data, _from: fromId, _to: toId }));
      } else {
        data = { ...data, _from: fromId, _to: toId };
      }
    } else {
      if (fromIdOrOpts !== undefined) {
        opts = fromIdOrOpts as InsertOptions;
      }
    }
    return this._connection.request(
      {
        method: "POST",
        path: `/_api/gharial/${this.graph.name}/edge/${this.name}`,
        body: data,
        qs: opts
      },
      res => res.body.edge
    );
  }

  replace(
    documentHandle: DocumentHandle,
    newValue: Object | Array<Object>,
    opts: ReplaceOptions | string = {}
  ) {
    const headers: { [key: string]: string } = {};
    if (typeof opts === "string") {
      opts = { rev: opts };
    }
    if (opts.rev) {
      let rev: string;
      ({ rev, ...opts } = opts);
      headers["if-match"] = rev;
    }
    return this._connection.request(
      {
        method: "PUT",
        path: `/_api/gharial/${this.graph.name}/edge/${this._documentHandle(
          documentHandle
        )}`,
        body: newValue,
        qs: opts,
        headers
      },
      res => res.body.edge
    );
  }

  update(
    documentHandle: DocumentHandle,
    newValue: Object | Array<Object>,
    opts: UpdateOptions | string = {}
  ) {
    const headers: { [key: string]: string } = {};
    if (typeof opts === "string") {
      opts = { rev: opts };
    }
    if (opts.rev) {
      let rev: string;
      ({ rev, ...opts } = opts);
      headers["if-match"] = rev;
    }
    return this._connection.request(
      {
        method: "PATCH",
        path: `/_api/gharial/${this.graph.name}/edge/${this._documentHandle(
          documentHandle
        )}`,
        body: newValue,
        qs: opts,
        headers
      },
      res => res.body.edge
    );
  }

  remove(documentHandle: DocumentHandle, opts: RemoveOptions | string = {}) {
    const headers: { [key: string]: string } = {};
    if (typeof opts === "string") {
      opts = { rev: opts };
    }
    if (opts.rev) {
      let rev: string;
      ({ rev, ...opts } = opts);
      headers["if-match"] = rev;
    }
    return this._connection.request(
      {
        method: "DELETE",
        path: `/_api/gharial/${this.graph.name}/edge/${this._documentHandle(
          documentHandle
        )}`,
        qs: opts,
        headers
      },
      res => res.body.removed
    );
  }
}

const GRAPH_NOT_FOUND = 1924;
export class Graph {
  name: string;

  private _connection: Connection;

  constructor(connection: Connection, name: string) {
    this.name = name;
    this._connection = connection;
  }

  get() {
    return this._connection.request(
      { path: `/_api/gharial/${this.name}` },
      res => res.body.graph
    );
  }

  exists(): Promise<boolean> {
    return this.get().then(
      () => true,
      err => {
        if (isArangoError(err) && err.errorNum === GRAPH_NOT_FOUND) {
          return false;
        }
        throw err;
      }
    );
  }

  create(properties: any = {}, opts?: { waitForSync?: boolean }) {
    return this._connection.request(
      {
        method: "POST",
        path: "/_api/gharial",
        body: {
          ...properties,
          name: this.name
        },
        qs: opts
      },
      res => res.body.graph
    );
  }

  drop(dropCollections: boolean = false) {
    return this._connection.request(
      {
        method: "DELETE",
        path: `/_api/gharial/${this.name}`,
        qs: { dropCollections }
      },
      res => res.body.removed
    );
  }

  vertexCollection(collectionName: string) {
    return new GraphVertexCollection(this._connection, collectionName, this);
  }

  listVertexCollections(opts?: { excludeOrphans?: boolean }) {
    return this._connection.request(
      { path: `/_api/gharial/${this.name}/vertex`, qs: opts },
      res => res.body.collections
    );
  }

  async vertexCollections(opts?: { excludeOrphans?: boolean }) {
    const names = await this.listVertexCollections(opts);
    return names.map(
      (name: any) => new GraphVertexCollection(this._connection, name, this)
    );
  }

  addVertexCollection(collection: string | ArangoCollection) {
    if (isArangoCollection(collection)) {
      collection = collection.name;
    }
    return this._connection.request(
      {
        method: "POST",
        path: `/_api/gharial/${this.name}/vertex`,
        body: { collection }
      },
      res => res.body.graph
    );
  }

  removeVertexCollection(
    collection: string | ArangoCollection,
    dropCollection: boolean = false
  ) {
    if (isArangoCollection(collection)) {
      collection = collection.name;
    }
    return this._connection.request(
      {
        method: "DELETE",
        path: `/_api/gharial/${this.name}/vertex/${collection}`,
        qs: {
          dropCollection
        }
      },
      res => res.body.graph
    );
  }

  edgeCollection(collectionName: string) {
    return new GraphEdgeCollection(this._connection, collectionName, this);
  }

  listEdgeCollections() {
    return this._connection.request(
      { path: `/_api/gharial/${this.name}/edge` },
      res => res.body.collections
    );
  }

  async edgeCollections() {
    const names = await this.listEdgeCollections();
    return names.map(
      (name: any) => new GraphEdgeCollection(this._connection, name, this)
    );
  }

  addEdgeDefinition(definition: any) {
    return this._connection.request(
      {
        method: "POST",
        path: `/_api/gharial/${this.name}/edge`,
        body: definition
      },
      res => res.body.graph
    );
  }

  replaceEdgeDefinition(definitionName: string, definition: any) {
    return this._connection.request(
      {
        method: "PUT",
        path: `/_api/gharial/${this.name}/edge/${definitionName}`,
        body: definition
      },
      res => res.body.graph
    );
  }

  removeEdgeDefinition(
    definitionName: string,
    dropCollection: boolean = false
  ) {
    return this._connection.request(
      {
        method: "DELETE",
        path: `/_api/gharial/${this.name}/edge/${definitionName}`,
        qs: {
          dropCollection
        }
      },
      res => res.body.graph
    );
  }

  traversal(startVertex: DocumentHandle, opts: any) {
    return this._connection.request(
      {
        method: "POST",
        path: `/_api/traversal`,
        body: {
          ...opts,
          startVertex,
          graphName: this.name
        }
      },
      res => res.body.result
    );
  }
}
