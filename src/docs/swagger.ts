import { name } from "ejs";
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
      url: "https://acara-backend-mern-oru.vercel.app/api",
      description: "Deploy Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
      },
    },
    schemas: {
      LoginRequest: {
        identifier: "abimanyu",
        password: "12345678",
      },
      RegisterRequest: {
        fullname: "abimanyu",
        username: "abimanyu",
        email: "abimanyu@gmail.com",
        password: "12345678",
        confirmPassword: "12345678",
      },
      ActivationRequest: {
        code: "12345678",
      },
      UpdateProfileRequest: {
        fullname: "abimanyu",
        profilePicture: "fileUrl",
      },
      UpdatePasswordRequest: {
        oldPassword: "12345678",
        password: "12345678",
        confirmPassword: "12345678",
      },
      CreateCategoryRequest: {
        name: "",
        description: "",
        icon: "",
      },
      CreateEventRequest: {
        name: "",
        banner: "fileUrl",
        category: "category ObjectID",
        description: "",
        startDate: "yyyy-mm-dd hh:mm:ss",
        endDate: "yyyy-mm-dd hh:mm:ss",
        location: {
          region: 3273,
          coordinates: [0, 0],
          address: "",
        },
        isOnline: false,
        isFeatured: false,
        isPublish: false,
      },
      CreateBannerRequest: {
        title: "phoebe banner 3",
        image:
          "https://res.cloudinary.com/djdz9inbp/image/upload/v1753184101/brm7qezcyez6wcf1rl6f.jpg",
        isShow: false,
      },
      CreateTicketRequest: {
        price: 10000,
        name: "Ticket Standar",
        events: "687e0e1fda5852ff833ea496",
        description: "ini ticket standar",
        quantity: 100,
      },
      RemoveMediaRequest: {
        fileUrl: "",
      },
      CreateOrderRequest: {
        events: "event_objectId",
        ticket: "ticket_objectId",
        quantity: 5,
      },
    },
  },
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["../routes/api.ts"];

swaggerAutogen({ openapi: "3.0.0" })(outputFile, endpointsFiles, doc);
