import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dropOldIndex = async () => {
  try {
    await mongoose.connect(process.env.MONG_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Check if the index exists
    const indexes = await collection.indexes();
    const emailIndex = indexes.find(index => index.name === 'email_1');

    if (emailIndex) {
      await collection.dropIndex('email_1');
      console.log('Dropped old email_1 index');
    } else {
      console.log('email_1 index not found');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error dropping index:', error);
  }
};

dropOldIndex();
