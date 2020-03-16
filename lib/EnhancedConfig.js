"use strict"

const _ = require("lodash");
const CoreHooks = require("serverless-core-hooks");
const Mustache = require("mustache");
const Path = require("path");
const File = require("./utils/File");

// Prevent character escape on render
Mustache.escape = function (text) {
  return text;
};

class EnhancedConfig extends CoreHooks {
  constructor(sls) {
    super(sls);
    if (_.get(this, "sls._ecPlugin.active", false)) {
      // Register hooks when plugin loaded and active
      _.merge(this.hooks, {
        "before:pluginManager:loadConfigFile": this.create.bind(this),
        "before:pluginManager:loadAllPlugins": this.remove.bind(this)
      });
    }
  }

  // Sets up plugin configuration
  configure() {
    super.configure();
    this.config.logPrefix = "[EC] ";
    this.config.core.push("pluginManager");
    this.ec = {
      // Serverless configuration
      config: _.get(this, "sls.service.custom.enhancedConfig", {}),
      // Base paths
      path: {
        service: _.get(this.sls, "config.servicePath", process.cwd()),
        config: Path.dirname(
          _.get(this.sls, "processedInput.options.config", ".")
        )
      }
    };
    const [config, path] = [this.ec.config, this.ec.path];
    // Template path
    path.template = Path.join(path.config, config.template);
    // Enhanced path
    path.enhanced = Path.join(
      path.config,
      ".enhanced-config" + Path.extname(config.template)
    );
    // Absolute paths
    path.abs = {
      template: Path.join(path.service, path.template),
      enhanced: Path.join(path.service, path.enhanced),
      partials: {}
    };
    // Partials paths (relative and absolute)
    path.partials = {};
    _.each(config.partials, (file, partial) => {
      path.partials[partial] = Path.join(path.config, file);
      path.abs.partials[partial] = Path.join(path.service, file);
    });
  }

  // Loads plugin
  load() {
    // Core hooks load
    super.load();
    // Plugin requirements validation
    const [config, path] = [this.ec.config, this.ec.path];
    if (!config.template || !_.isString(config.template)) {
      this.log("Skipped: no template path at 'custom.enhancedConfig.template'");
    } else if (!File.exists(path.abs.template)) {
      this.log("Skipped: template not found at " + path.abs.template);
    } else if (
      config.delimiters &&
      (!_.isArray(config.delimiters) || _.size(config.delimiters) != 2))
    {
      this.log("Skipped: invalid delimiters");
    } else {
      // Activate
      this.active = true;
      this.log("Plugin loaded successfully", false, true);
    }
    // Plugin bound to serverless
    this.sls._ecPlugin = this;
  }

  // Creates enhanced configuration file
  create() {
    const [config, path] = [this.ec.config, this.ec.path];
    const template = File.read(path.abs.template);
    this.log("Template loaded from " + path.abs.template, false, true);
    const partials = {};
    _.each(path.abs.partials, (file, partial) => {
      this.log("Partial loaded from " + file + "("+ partial +")", false, true);
      partials[partial] = File.read(file);
    });
    const rendered = Mustache.render(
      template, config.variables, partials, config.delimiters
    );
    this.log("Configuration rendered", false, true);
    // Creating file (and updating its paths)
    path.abs.enhanced = File.write(path.abs.enhanced, rendered);
    path.enhanced = Path.join(path.config, Path.basename(path.abs.enhanced));
    this.log("Configuration created at " + path.abs.enhanced, false, true);
    // Switch serverless configuration to the generated one (enhanced)
    this.sls.processedInput.options.config = path.enhanced;
  }

  // Removes enhanced configuration file
  remove() {
    const path = this.ec.path;
    File.remove(path.abs.enhanced);
    this.log("Configuration removed from " + path.abs.enhanced, false, true);
  }

  // Logs
  log(message, internal = false, debug = true) {
    if (!debug || process.env.SLS_EC_DEBUG || process.env.SLS_DEBUG) {
      super.log(message, internal);
    }
  }
}

module.exports = EnhancedConfig;
