class BaseClient {
  open() {
    throw new Error("open() must be implemented");
  }

  run(query, bindings) {
    throw new Error("run() must be implemented");
  }

  close() {
    throw new Error("close() must be implemented");
  }
}

module.exports = BaseClient;
