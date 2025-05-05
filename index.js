// app.js
import express from "express";
import axios from "axios";
import cors from "cors";
import { rabbitMQProducer } from "./rabbitmq/producer.js";
import { getLogger } from "./logger/logger.js";

const app = express();
const port = 3000;
const logger = getLogger();

app.use(express.json());
app.use(cors());

app.get("/v1/events/users/home", (req, res) => {
  res.send("Hello World!");
});

app.post("/v1/events/users/register", async (req, res) => {
  const user = req.body;

  if (!user) {
    return res.status(400).send("User data is required");
  }

  try {
    const url = `http://mrpotato-adapter-service.mrpotato-adapter.svc.cluster.local:80/v1/adapter/validateCitizen/${user.id}`;
    logger.info(`Validating user with ID: ${user.id} at ${url}`);

    const validationResponse = await axios.get(url);

    if (
      validationResponse.data &&
      validationResponse.data.registered === true
    ) {
      logger.warn(`User with ID: ${user.id} is already registered`);
      return res.status(409).json({
        // 409 Conflict is appropriate here
        message: "Este usuario ya está registrado. Por favor valida tus datos.",
        id: user.id,
        status: 409,
      });
    }

    logger.info(
      `User with ID ${user.id} is not registered. Proceeding with registration.`
    );
    await rabbitMQProducer.sendToQueue("registration-queue", {
      documentType: user.documentType,
      id: user.id,
      firstName: user.firstName,
      secondName: user.secondName,
      lastName: user.lastName,
      secondLastName: user.secondLastName,
      email: user.email,
      confirmEmail: user.confirmEmail,
      phone: user.phone,
      country: user.country,
      department: user.department,
      city: user.city,
      address: user.address,
    });

    res.status(200).json({
      status: 200,
      message:
        "El usuario ha sido registrado correctamente. En breve recibirás un correo electrónico para que crees tu contraseña.",
      documentType: user.documentType,
      id: user.id,
    });
  } catch (error) {
    logger.error(
      `Error during registration process for ID ${user.id}: ${error.message}`
    );

    if (error.response) {
      logger.error(
        `Validation check failed: Status ${
          error.response.status
        }, Data: ${JSON.stringify(error.response.data)}`
      );
      return res.status(error.response.status || 500).json({
        message: "Failed to check user registration status.",
        error: error.response.data || error.message,
      });
    } else if (error.request) {
      logger.error(
        `Could not connect to validation endpoint: ${error.message}`
      );
      return res
        .status(502)
        .json({ message: "Failed to connect to validation service." });
    } else if (error.message.includes("sendToQueue")) {
      logger.error("Error sending message to queue:", error);
      return res.status(500).send("Error sending registration data");
    } else {
      logger.error("Generic error during registration:", error);
      res.status(500).send("Error processing registration");
    }
  }
});

app.listen(port, async () => {
  await rabbitMQProducer.connect();
  console.log(`Example app listening on port ${port}`);
});
