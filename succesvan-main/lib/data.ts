import mongoose from "mongoose";

const NEXT_PUBLIC_MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

const connect = async () => {
  const connectionStatus = mongoose.connection.readyState;
  
  
  if (connectionStatus === 1) {
    return;
  }
  
  if (!NEXT_PUBLIC_MONGODB_URI) {
    throw new Error("NEXT_PUBLIC_MONGODB_URI is not defined");
  }
  
  try {
    await mongoose.connect(NEXT_PUBLIC_MONGODB_URI);
  } catch (error) {
    throw error;
  }
};

export default connect;