export default ({ env }) => ({
  host: env("HOST", "127.0.0.1"),
  port: env.int("PORT", 1337),
  app: {
    keys: env.array("APP_KEYS"),
  },
  webhooks: {
    populateRelations: env.bool("WEBHOOKS_POPULATE_RELATIONS", false),
  },
  middleware: {
    settings: {
      cors: {
        enabled: true,
        origin: env(
          "CORS_ORIGIN",
          "http://localhost:3000,http://127.0.0.1:3000,http://localhost:1337,http://192.168.0.104:3000"
        ).split(","), // Specify the allowed origin(s) here
        // headers: ["Content-Type", "Authorization"],
      },
    },
  },
});
