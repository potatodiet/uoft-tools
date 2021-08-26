const path = require("path");

module.exports = {
  entry: {
    timetable_utm: "./dst/timetable_utm.js",
    timetable_stg: "./dst/timetable_stg.js",
    background: "./dst/background.js"
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "./build")
  }
};
