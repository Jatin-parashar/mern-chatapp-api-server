import pino from "pino";

// Use process.env directly to avoid circular dependency with envConfig
const NODE_ENV = process.env.NODE_ENV || "development";
const isDevelopment = NODE_ENV === "development";

const productionLogger = pino({
  level: "info",
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
    bindings: (bindings) => {
      return {
        pid: bindings.pid,
        // Remove useless hostname in production
      };
    },
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  base: {
    env: NODE_ENV,
  },
});

const developmentLogger = pino(
  {
    level: "debug",
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  },
  pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "yyyy-mm-dd HH:MM:ss.l",
      ignore: "pid,hostname",
      messageFormat: "{msg}",
      singleLine: true,
    },
  })
);

const logger = isDevelopment ? developmentLogger : productionLogger;

export default logger;
