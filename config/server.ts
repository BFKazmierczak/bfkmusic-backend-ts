export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
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
          "https://bfkmusic.vercel.app,https://bfkmusic-api.up.railway.app"
        ).split(","), // Specify the allowed origin(s) here
        // headers: ["Content-Type", "Authorization"],
      },
    },
  },
});
