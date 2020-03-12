"use strict"

const _ = require("lodash");
const FS = require("fs");
const Path = require("path");

const File = {
  // Tests if file exists
  exists(path) {
    return FS.existsSync(path);
  },

  // Reads content of file
  read(path) {
    return FS.readFileSync(path, "utf8");
  },

  // Deletes file
  remove(path) {
    FS.unlinkSync(path);
  },

  // Writes content to file
  write(path, content, override = false) {
    if (!override) {
      const dir = Path.dirname(path);
      const ext = Path.extname(path);
      const base = Path.basename(path, ext);
      let counter = 1;
      while (File.exists(path)) {
        // Finds an alternative file name with '-<N>' suffix
        path = Path.join(dir, base + "-" + counter + ext);
        counter++;
      }
    }
    FS.writeFileSync(path, content, "utf8");
    return path;
  }
}

module.exports = File;
