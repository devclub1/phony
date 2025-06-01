module.exports = {
    apps : [
        {
          name: "phony",
          instances: 1,
          script: "./dist/main.js",
          env: {
              "NODE_ENV": "production"
          }
        }
    ]
  }
  