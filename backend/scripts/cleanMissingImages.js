import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import LostFound from '../models/LostFound.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function cleanMissingImages() {
  try {
    await mongoose.connect(process.env.MONG_URI);
    console.log('✅ Connected to MongoDB');

    const items = await LostFound.find();
    console.log(`📦 Found ${items.length} lost & found items`);

    let removedCount = 0;
    let keptCount = 0;

    for (const item of items) {
      if (item.image) {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        const imagePath = path.join(__dirname, '..', item.image);
        
        // Check if image file exists locally
        if (!fs.existsSync(imagePath)) {
          console.log(`❌ Missing image file: ${item.image}`);
          console.log(`   Item: ${item.tag} (ID: ${item._id})`);
          console.log(`   Description: ${item.description?.substring(0, 50)}...`);
          
          // Option 1: Remove the item entirely
          // await LostFound.findByIdAndDelete(item._id);
          // console.log(`   🗑️  Deleted item ${item._id}`);
          
          // Option 2: Just remove the image reference (keep the item)
          item.image = null;
          await item.save();
          console.log(`   🔧 Removed image reference, kept the item\n`);
          
          removedCount++;
        } else {
          keptCount++;
        }
      } else {
        keptCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Items with valid images: ${keptCount}`);
    console.log(`   🔧 Items with missing images (fixed): ${removedCount}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanMissingImages();
