const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My Auth & App API",
      version: "1.0.0",
      description: "Interactive documentation for backend REST APIs",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
  },
  // Points to where you write your documentation comments
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;