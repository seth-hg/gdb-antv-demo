const gremlin = require("gremlin");
const BaseClient = require("./client");

class GremlinClient extends BaseClient {
  constructor(endpoint, username, password) {
    super();
    const authenticator = new gremlin.driver.auth.PlainTextSaslAuthenticator(
      username,
      password
    );

    this.client = new gremlin.driver.Client(endpoint, {
      authenticator,
    });
  }

  open() {
    return this.client.open();
  }

  run = async function (query, bindings) {
    try {
      const result = await this.client.submit(query, bindings);
      return { graph: this.parse(result), raw: result };
    } catch (error) {
      console.log("error:", error);
      return { error: error };
    }
  };

  close() {
    return this.client.close();
  }

  parse = (result) => {
    var graph = {
      nodes: {},
      edges: {},
      pending: {},
    };
    for (const element of result) {
      if (element instanceof gremlin.structure.Vertex) {
        graph = this.parseVertex(graph, element);
      } else if (element instanceof gremlin.structure.Edge) {
        graph = this.parseEdge(graph, element);
      } else if (element instanceof gremlin.structure.Path) {
        graph = this.parsePath(graph, element);
      }
    }

    // add placeholders for missing vertices to draw the graph
    Object.keys(graph.pending).forEach((nodeId) => {
      if (graph.nodes[nodeId] == undefined) {
        graph.nodes[nodeId] = graph.pending[nodeId];
      }
    });

    return {
      nodes: Object.values(graph.nodes),
      edges: Object.values(graph.edges),
    };
  };

  parseVertex = (graph, vertex) => {
    if (graph.nodes[vertex.id] == undefined) {
      graph.nodes[vertex.id] = {
        id: vertex.id,
        originalLabel: vertex.label,
        properties: this.propertiesToList(vertex),
      };
    }
    return graph;
  };

  parseEdge = (graph, edge) => {
    if (graph.edges[edge.id] == undefined) {
      graph.edges[edge.id] = {
        id: edge.id,
        originalLabel: edge.label,
        source: edge.outV.id,
        target: edge.inV.id,
        properties: this.propertiesToList(edge),
      };
    }
    if (
      graph.nodes[edge.outV.id] == undefined &&
      graph.pending[edge.outV.id] == undefined
    ) {
      graph.pending[edge.outV.id] = {
        id: edge.outV.id,
        originalLabel: edge.outV.label,
        properties: [],
      };
    }
    if (
      graph.nodes[edge.inV.id] == undefined &&
      graph.pending[edge.inV.id] == undefined
    ) {
      graph.pending[edge.inV.id] = {
        id: edge.inV.id,
        originalLabel: edge.inV.label,
        properties: [],
      };
    }
    return graph;
  };

  parsePath = (graph, path) => {
    for (const obj of path.objects) {
      if (obj instanceof gremlin.structure.Vertex) {
        graph = this.parseVertex(graph, obj);
      } else if (obj instanceof gremlin.structure.Edge) {
        graph = this.parseEdge(graph, obj);
      } else {
        // skip other types
        console.log(obj.constructor.toString());
      }
    }
    return graph;
  };

  propertiesToList = (element) => {
    var properties = [];
    if (element.properties != undefined) {
      for (const key in element.properties) {
        const property = element.properties[key];
        if (property instanceof Array) {
          // vertex property
          for (const p of property) {
            properties.push({ name: p.label, value: p.value });
          }
        } else {
          // edge property
          properties.push({ name: key, value: property });
        }
      }
    }
    return properties;
  };
}

module.exports = GremlinClient;
