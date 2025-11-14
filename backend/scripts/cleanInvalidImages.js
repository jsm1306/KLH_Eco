import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import LostFound from '../models/LostFound.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const uploadsDir = path.join(__dirname, '..', 'uploads');

async function cleanInvalidImages() {
  try {
    await mongoose.connect(process.env.MONG_URI);
    console.log('Connected to MongoDB');

    // Get all files in uploads directory
    const existingFiles = fs.readdirSync(uploadsDir);
    console.log('\nExisting files in uploads:', existingFiles);

    // Check Lost & Found items
    console.log('\n--- Checking Lost & Found Items ---');
    const lostFoundItems = await LostFound.find().populate('user', 'name mail');
    let lostFoundDeleted = 0;
    
    for (const item of lostFoundItems) {
      if (item.image) {
        const filename = path.basename(item.image);
        if (!existingFiles.includes(filename)) {
          console.log(`❌ Item "${item.tag}" has missing image: ${filename}`);
          console.log(`   Posted by: ${item.user?.name || 'Unknown'}`);
          console.log(`   Deleting item...`);
          await LostFound.findByIdAndDelete(item._id);
          lostFoundDeleted++;
        } else {
          console.log(`✅ Item "${item.tag}" has valid image: ${filename}`);
        }
      }
    }

    // Check Events
    console.log('\n--- Checking Events ---');
    const events = await Event.find();
    let eventsUpdated = 0;
    
    for (const event of events) {
      if (event.image) {
        const filename = path.basename(event.image);
        if (!existingFiles.includes(filename)) {
          console.log(`❌ Event "${event.title}" has missing image: ${filename}`);
          console.log(`   Removing image reference...`);
          event.image = null;
          await event.save();
          eventsUpdated++;
        } else {
          console.log(`✅ Event "${event.title}" has valid image: ${filename}`);
        }
      }
    }

    console.log('\n--- Summary ---');
    console.log(`Lost & Found items deleted: ${lostFoundDeleted}`);
    console.log(`Events updated (image removed): ${eventsUpdated}`);
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanInvalidImages();
