import FastifyCors from "@fastify/cors";

const DEFAULT_ORIGINS = [
  "http://localhost:9000",
  "http://localhost:8100",
  "http://localhost:4200",
];

export const setFastifyCors = function (fastify) {
  // CORS_ORIGINS is a comma separated allowlist, e.g. for a containerised
  // frontend published on another port or a deployed environment.
  const configured = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  fastify.register(FastifyCors, {
    origin: configured.length ? configured : DEFAULT_ORIGINS,
  });
};
