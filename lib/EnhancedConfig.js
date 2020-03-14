"use strict"

const _ = require("lodash");
const Mustache = require("mustache");
const Path = require("path");
const File = require("./utils/File");

// Prevent escape on render
Mustache.escape = function (text) {
  return text;
};

class EnhancedConfig {
  constructor(serverless) {
    this.sls = serverless;
    // Plugin not previously loaded
    if (!_.has(this.sls, "_ecPlugin")) {
      this.load();
    }
    // Plugin loaded and active
    if (_.get(this.sls, "_ecPlugin.active", false)) {
      this.hooks = {
        "before:pluginManager:loadConfigFile": this.create.bind(this),
        "before:pluginManager:loadAllPlugins": this.remove.bind(this)
      };
    }
  }

  // Loads plugin
  load() {
    // Plugin bound to serverless
    this.sls._ecPlugin = this;
    // Plugin configuration
    this.config = _.get(this.sls, "service.custom.enhancedConfig", {});
    if (!this.config.template || !_.isString(this.config.template)) {
      this.log("No template provided ('custom.enhancedConfig.template')");
      return;
    }
    // Plugin paths
    this.path = {
      service: _.get(this.sls, "config.servicePath", process.cwd()),
      config: Path.dirname(
        _.get(this.sls, "processedInput.options.config", ".")
      )
    };
    this.path.template = Path.join(this.path.config, this.config.template);
    this.path.enhanced = Path.join(
      this.path.config, ".enhanced-config" + Path.extname(this.config.template)
    );
    this.path.abs = {
      template: Path.join(this.path.service, this.path.template),
      enhanced: Path.join(this.path.service, this.path.enhanced),
    };
    if (!File.exists(this.path.abs.template)) {
      this.log("Cannot find template: " + this.path.abs.template);
      return;
    }
    // Activate
    this.active = true;
    this.log("Plugin loaded successfully");
  }

  // Creates enhanced configuration file
  create() {
    const template = File.read(this.path.abs.template);
    this.log("Template loaded: " + this.path.abs.template);
    const config = Mustache.render(template, this.config.variables);
    this.log("Configuration rendered");
    this.path.abs.enhanced = File.write(this.path.abs.enhanced, config);
    this.log("Configuration created: " + this.path.abs.enhanced);
    // Switch serverless configuration to the generated one (enhanced)
    this.sls.processedInput.options.config = this.path.enhanced;
  }

  // Removes enhanced configuration file
  remove() {
    File.remove(this.path.abs.enhanced);
    this.log("Configuration removed: " + this.path.abs.enhanced);
  }

  // Logs
  log(message, debug = true) {
    if (!debug || process.env.SLS_EC_DEBUG || process.env.SLS_DEBUG) {
      message = "[EC] " + message;
      message = message.replace(/[\r\n\t]/g, "");
      message = message.replace(/\s+/g, " ");
      this.sls.cli.log(message);
    }
  }
}

module.exports = EnhancedConfig;
