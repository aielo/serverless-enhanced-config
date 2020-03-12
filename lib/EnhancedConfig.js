"use strict"

const _ = require("lodash");
const Mustache = require("mustache");
const Path = require("path");
const File = require("./utils/File");

class EnhancedConfig {
  constructor(serverless) {
    this.sls = serverless;
    this.config = _.get(this.sls, "service.custom.enhancedConfig", {});
    if (!_.has(this.config, "template") || !_.isString(this.config.template)) {
      // Skips plugin load: no template specified
      this.log("No template provided ('custom.enhancedConfig.template')");
    } else if (_.has(this.sls, "_ecPlugin")) {
      // Skips plugin load: already loaded (i.e. all set)
    } else {
      this.load();
    }
  }

  // Loads plugin settings
  load() {
    // Paths
    let base = _.get(this.sls, "serverless.config.servicePath", process.cwd());
    if (_.has(this.sls, "processedInput.options.config")) {
      // Custom path (i.e. from '--config' option)
      base = Path.join(base, this.sls.processedInput.options.config);
    } else {
      base = Path.join(base, this.sls.service.serviceFilename);
    }
    base = Path.dirname(base);
    const enhanced = ".enhanced-config" + Path.extname(this.config.template);
    this.config.path = {
      base: base,
      enhanced: Path.join(base, enhanced),
      template: Path.join(base, this.config.template)
    }
    // Validation
    if (!File.exists(this.config.path.template)) {
      this.log("Cannot find template: " + this.config.path.template);
      this.log("Plugin load failed");
      return;
    }
    // Create and remove hooks
    this.hooks = {
      "before:pluginManager:loadConfigFile": this.create.bind(this),
      "after:pluginManager:loadConfigFile": this.remove.bind(this)
    }
    // Plugin tied to serverless to indicate it has been loaded
    this.sls._ecPlugin = this;
    this.log("Plugin loaded successfully");
  }

  // Creates enhanced configuration file
  create() {
    const template = File.read(this.config.path.template);
    this.log("Template loaded: " + this.config.path.template);
    const config = Mustache.render(template, {});
    this.log("Configuration rendered");
    this.config.path.enhanced = File.write(this.config.path.enhanced, config);
    this.log("Configuration saved: " + this.config.path.enhanced);
    this.log("Enhanced configuration created");
  }

  // Removes enhanced configuration file
  remove() {
    File.remove(this.config.path.enhanced);
    this.log("Enhanced configuration removed: " + this.config.path.enhanced);
  }

  // Logs
  log(message, debug=true) {
    if (!debug || process.env.SLS_EC_DEBUG || process.env.SLS_DEBUG) {
      message = "[EC] " + message;
      message = message.replace(/[\r\n\t]/g, "");
      message = message.replace(/\s+/g, " ");
      this.sls.cli.log(message);
    }
  }
}

module.exports = EnhancedConfig;
