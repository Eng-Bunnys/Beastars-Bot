import express, { Application } from "express";
import { json, urlencoded } from "body-parser";
import connectToDatabase from "./config/database";

// Route Imports
import welcomeRoutes from "./routes/welcomeMessageRouter";
import imageRoutes from "./routes/imageRoutes";

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(json());
app.use(urlencoded({ extended: true }));

app.use("/api", welcomeRoutes);
app.use("/api", imageRoutes);

const startServer = async () => {
  await connectToDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${process.env.URL}:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Error starting the server:", error);
  process.exit(1);
});
