import { connect } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoURI = process.env.MONGO_URI as string;

if (!mongoURI) {
  console.error("No Mongo URI was defined in the .env file.");
  process.exit(1);
}

const connectToDatabase = async () => {
  try {
    await connect(mongoURI, {
      bufferCommands: true,
      autoCreate: false,
      autoIndex: true,
      serverSelectionTimeoutMS: 30000,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(`Couldn't connect to MongoDB\n${error}`);
    process.exit(1);
  }
};

export default connectToDatabase;
