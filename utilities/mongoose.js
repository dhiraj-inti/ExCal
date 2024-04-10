// utilities/mongoose.js

import mongoose from 'mongoose';

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log('Database already connected');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw new Error('Error connecting to MongoDB');
  }
};

export default connectToDatabase;
