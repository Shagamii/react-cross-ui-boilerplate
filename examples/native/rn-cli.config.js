const path = require("path");
// const getConfig = require("metro-bundler-config-yarn-workspaces");
const blacklist = require("metro/src/blacklist");
const fs = require("fs");

const options = {
  nodeModules: path.resolve(__dirname, "..", "..")
};

// const config = getConfig(__dirname, options)

// const workspacesBlacklist = ["native", "../.."];

// const workspaces = fs
//   .readdirSync("..")
  // .filter(w => !workspacesBlacklist.includes(w));

// workspaces.push("../..")

const workspaces = ["../.."]

module.exports = {
  extraNodeModules: {
    "react-native": path.resolve(__dirname, "node_modules/react-native"),
    "react-native-linear-gradient": path.resolve(__dirname, "node_modules/expo"),
  },
  getBlacklistRE() {
    return blacklist(
      workspaces.reduce((acc, workspacePath) => {
        return acc.concat([
          new RegExp(
            path.join(__dirname, workspacePath, "node_modules", "react-native", ".*")
          ),
          new RegExp(
            path.join(__dirname, workspacePath, "node_modules", ".*", "react-native", ".*")
          ),
          new RegExp(
            path.join(__dirname, workspacePath, "node_modules", "react-native-linear-gradient", ".*")
          ),
        ]);
      }, [])
    );
  },
  getProjectRoots() {
    return [__dirname, path.resolve(__dirname, "..", "..")];
  }
};
