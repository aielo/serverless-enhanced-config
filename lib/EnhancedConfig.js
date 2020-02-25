"use strict"

class EnhancedConfig {
  constructor(serverless) {
    this.serverless = serverless;
    this.log("EnhancedConfig plugin loaded", true);
  }

  log(message, debug=false) {
    if (debug && process.env.SLS_DEBUG) {
      this.serverless.cli.log(message);
    }
  }
}

module.exports = EnhancedConfig;
