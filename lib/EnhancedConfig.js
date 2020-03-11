"use strict"

const _ = require("lodash");
const FS = require("fs");
const Mustache = require("mustache");
const Path = require("path");

class EnhancedConfig {
  constructor(serverless) {
    this.sls = serverless;
    this.hooks = {
      "before:serverless:init": this.create.bind(this),
      "before:serverless:run": this.remove.bind(this)
    }
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
    // Configuration path
    let base = _.get(this.sls, "serverless.config.servicePath", process.cwd());
    if (_.has(this.sls, "processedInput.options.config")) {
      // Custom path (i.e. from '--config' option)
      base = Path.join(base, this.sls.processedInput.options.config);
      base = Path.dirname(base);
    }
    this.config.path = {
      base: base,
      enhanced: Path.join(base, ".enhanced-config.yml"),
      template: Path.join(base, this.config.template)
    }
    this.log("Plugin loaded");
    // Plugin tied to serverless to indicate it has been loaded
    this.sls._ecPlugin = this;
  }

  // Creates enhanced configuration file
  create() {
    const template = FS.readFileSync(this.config.path.template, "utf8");
    this.log("Template loaded: " + this.config.path.template);
    const config = Mustache.render(template, {});
    this.log("Configuration rendered");
    FS.writeFile(this.config.path.enhanced, config, "utf8");
    this.log("Configuration saved: " + this.config.path.enhanced);
    this.log("Enhanced configuration created");
  }

  // Removes enhanced configuration file
  remove() {
    FS.unlinkSync(this.config.path.enhanced);
    this.log("Enhanced configuration removed");
  }

  // Logs
  log(message, debug=true) {
    if (!debug || process.env.SLS_DEBUG) {
      message = "[EC] " + message;
      message = message.replace(/[\r\n\t]/g, "");
      message = message.replace(/\s+/g, " ");
      this.sls.cli.log(message);
    }
  }
}

module.exports = EnhancedConfig;
