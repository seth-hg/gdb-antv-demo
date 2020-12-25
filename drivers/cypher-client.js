const neo4j = require("neo4j-driver");
const neo4j_types = require("neo4j-driver/lib/graph-types");
const BaseClient = require("./client");

class Observer {
  constructor(session) {
    this.session = session;
    this.graph = { nodes: {}, edges: {}, pending: {} };
    this.rows = [];
    this.error = null;
  }

  onNext = (record) => {
    var row = {};
    record.keys.forEach((key) => {
      var element = record.get(key);
      if (neo4j_types.isNode(element)) {
        row[key] = this.parseNode(element);
      } else if (neo4j_types.isRelationship(element)) {
        row[key] = this.parseRelationship(element);
      } else if (neo4j_types.isPath(element)) {
        row[key] = this.parsePath(element);
      } else if (Array.isArray(element)) {
        row[key] = this.parseArray(element);
      } else {
        row[key] = element;
      }
    });
    this.rows.push(row);
  };

  onCompleted = (summary) => {
    this.session.close().then(() => { });
  };

  onError = (error) => {
    console.log("query failed:", error);
    this.error = error;
  };

  parseProperties = (element) => {
    var properties = [];
    Object.keys(element.properties).forEach((k) => {
      var value = element.properties[k].toString();
      properties.push({ name: k, value: value });
    });
    return properties;
  };

  parseNode = (element) => {
    var node_id = element.identity.toString();
    var node = this.graph.nodes[node_id];
    if (node == undefined) {
      node = {
        id: node_id,
        originalLabel: element.labels[0],
        properties: this.parseProperties(element),
      };
      this.graph.nodes[node.id] = node;
    }
    return node;
  };

  parseRelationship = (element) => {
    var rel_id = element.identity.toString();
    var rel = this.graph.edges[rel_id];
    if (rel == undefined) {
      var source = element.start.toString();
      var target = element.end.toString();
      rel = {
        id: rel_id,
        originalLabel: element.type,
        source: source,
        target: target,
        properties: this.parseProperties(element),
      };
      // check if element.start & element.end exists
      if (this.graph.nodes[source] == undefined) {
        this.graph.pending[source] = true;
      }
      if (this.graph.nodes[target] == undefined) {
        this.graph.pending[target] = true;
      }
      this.graph.edges[rel.id] = rel;
    }
    return rel;
  };

  parsePath = (path) => {
    var current = path.start.identity;
    var s = path.start.toString();
    path.segments.forEach((seg) => {
      this.parseNode(seg.start);
      this.parseRelationship(seg.relationship);
      this.parseNode(seg.end);
      var relationshipStr =
        seg.relationship.identity.toString() + ":" + seg.relationship.type;
      if (seg.start.identity == current) {
        s += "-[" + relationshipStr + "]->" + seg.end.toString();
      } else {
        s += "<-[" + relationshipStr + "]-" + seg.end.toString();
      }
    });
    return s;
  };

  parseArray = (array) => {
    var result = [];
    array.forEach(e => {
      if (neo4j_types.isNode(e)) {
        result.push(this.parseNode(e));
      } else if (neo4j_types.isRelationship(e)) {
        result.push(this.parseRelationship(e));
      } else if (neo4j_types.isPath(e)) {
        result.push(this.parsePath(e));
      }
    });
    return result;
  };

  nodeToString = (node) => { };

  relationshipToString = () => { };
}

class CypherClient extends BaseClient {
  constructor(endpoint, username, password) {
    super();
    this.client = neo4j.driver(endpoint, neo4j.auth.basic(username, password));
  }

  open() { }

  run = async function (query, bindings) {
    const session = this.client.session();
    var observer = new Observer(session);
    await session
      .run(query, bindings)
      .then((results) => {
        results.records.forEach((record) => {
          observer.onNext(record);
        });
      })
      .catch((error) => {
        observer.onError(error);
      });
    session.close();
    if (observer.error != null) {
      return { error: error };
    }
    var graph = {
      nodes: Object.values(observer.graph.nodes),
      edges: Object.values(observer.graph.edges),
    };
    Object.keys(observer.graph.pending).forEach((key) => {
      if (observer.graph.nodes[key] == undefined) {
        // add a node as placeholder
        graph.nodes.push({ id: key, originalLabel: "", properties: {} });
      }
    });
    return { graph: graph, raw: observer.rows };
  };

  close() {
    return this.client.close();
  }

  parseRecord = (record) => {
    var row = {};
    var graph = { nodes: {}, edges: {} };
    record.keys.forEach((key) => {
      var element = record.get(key);
      if (neo4j_types.isNode(element)) {
        if (graph.nodes[element.identity] == undefined) {
          var node = this.parseNode(element);
          graph.nodes[node.id] = node;
        }
      } else if (neo4j_types.isRelationship(element)) {
        if (graph.edges[element.identity] == undefined) {
          var rel = this.parseRelationship(element);
          graph.edges[rel.id] = rel;
        }
      } else if (neo4j_types.isPath(element)) {
      }

      row[key] = element;
    });
    return row;
  };

  parseNode = (node) => {
    return {
      id: node.identity,
      originalLabel: node.labels[0],
      properties: node.properties,
    };
  };

  parseRelationship = (relationship) => { };

  parsePath = (path) => { };
}

module.exports = CypherClient;
