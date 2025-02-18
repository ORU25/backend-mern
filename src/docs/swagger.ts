import swaggerAutogen from "swagger-autogen";

const doc = {
  info: {
    version: "v0.0.1",
    title: "Dokumentasi API MERN",
    description: "Dokumentasi API MERN",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Local server",
    },
    {
      url: "https://backend-mern-bay.vercel.app/api",
      description: "Deploy Server",
    },
  ],
  components: {
    securitySchemas: {
        bearerAuth: {
            type: "http",
            scheme: "bearer",
        }
    },
    schemas: {
        LoginRequest: {
            identifier: "abimanyu",
            password: "12345678"
        }
    }
  }
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["../routes/api.ts"];

swaggerAutogen({openapi: "3.0.0"})(outputFile,endpointsFiles,doc);