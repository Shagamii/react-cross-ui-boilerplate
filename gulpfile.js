const fs = require("fs");
const path = require("path");

const eventStream = require("event-stream");
const gulp = require("gulp");
const gutil = require("gulp-util");
const argv = require("yargs").argv;
const cached = require("gulp-cached");
const babel = require("gulp-babel");
const ts = require("gulp-typescript");
const typescript = require("typescript");
const del = require("del");
const eol = require("gulp-eol");
const shell = require("gulp-shell");
const watch = require("gulp-watch");
const runSequence = require("run-sequence");

const getBuildConfig = require("./buildconfig");
const babelrc = require("./.babelrc");

function handleError(err) {
  console.log(err);
}

const platformConfigs = {
  web: {
    extensions: [".web.tsx", ".web.ts", ".tsx", ".ts"]
  },
  ios: {
    extensions: [
      ".ios.tsx",
      ".ios.ts",
      ".native.tsx",
      ".native.ts",
      ".tsx",
      ".ts"
    ]
  },
  android: {
    extensions: [
      ".android.tsx",
      ".android.ts",
      ".native.tsx",
      ".native.ts",
      ".tsx",
      ".ts"
    ]
  }
};

function getPlatform() {
  const platform = argv.platform || "web";

  if (!Object.keys(platformConfigs).includes(platform)) {
    throw `Unsupported platform: ${platform}`;
  }
  return platform;
}

// Handle args
const platform = getPlatform();
gutil.log(gutil.colors.yellow(`platform: ${platform}`));

const paths = {
  src: path.resolve(__dirname, "src"),
  dist: path.resolve(__dirname, "dist"),
  tmp: path.resolve(__dirname, "tmp")
};

const getTempPath = () => {
  return path.resolve(paths.tmp, platform);
};

const srcGlob = path.resolve(paths.src, "**/*");

function copyFileForPlatform(origFile) {
  const file = origFile.clone({ contents: false });
  if (file.isDirectory()) {
    return false;
  }
  // Check the file is exactly for the platform
  const { extensions } = platformConfigs[platform];
  const fileName = path.basename(file.path);
  const [baseName, ...extNames] = fileName.split(".");
  const extName = "." + extNames.join(".");
  if (!extensions.includes(extName)) {
    return false;
  }
  file.path = file.path
    .replace(paths.src, getTempPath())
    .replace(
      new RegExp(`${fileName}$`),
      `${baseName}.${extNames[extNames.length - 1]}`
    );
  // Map to tmp path for each platform
  return file;
}

function platformify() {
  return eventStream.map((origFile, cb) => {
    // console.log(file.path);
    const file = copyFileForPlatform(origFile);
    if (!file) {
      return cb();
    }
    cb(null, file);
  });
}

const tsProject = ts.createProject(`tsconfig.${platform}.json`);

gulp.task("copy", () => {
  return gulp
    .src(srcGlob)
    .pipe(platformify())
    .pipe(gulp.dest(paths.dist))
    .on("error", handleError);
});

gulp.task("watch-copy", () => {
  return watch(srcGlob)
    .pipe(platformify())
    .pipe(gulp.dest(paths.dist))
    .on("error", handleError);
});

gulp.task(
  "tsc-check",
  shell.task(`node_modules/.bin/tsc -p tsconfig.${platform}.json`)
);

gulp.task(
  "tsc-watch",
  shell.task(`node_modules/.bin/tsc -p tsconfig.${platform}.json --watch`)
);

gulp.task(
  "webpack-build",
  shell.task(`node_modules/.bin/webpack --env.platform=${platform}`)
);

gulp.task("build", cb =>
  runSequence(["copy", "tsc-check", "webpack-build"], cb)
);

gulp.task(
  "webpack-watch",
  shell.task(`node_modules/.bin/webpack --watch --env.platform=${platform}`)
);

gulp.task("watch", ["watch-copy", "tsc-watch", "webpack-watch"]);
