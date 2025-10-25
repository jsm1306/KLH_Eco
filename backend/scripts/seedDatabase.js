import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Club from '../models/Club.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import LostFound from '../models/LostFound.js';
import Feedback from '../models/Feedback.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONG_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await Club.deleteMany({});
    // await Event.deleteMany({});
    // await LostFound.deleteMany({});
    // await Feedback.deleteMany({});
    console.log('📦 Starting to seed database...');

    // Check existing clubs
    const existingClubs = await Club.find({});
    console.log(`📋 Found ${existingClubs.length} existing clubs`);

    // Create sample clubs (only if they don't exist)
    const clubsToCreate = [
      { name: 'Technical Club', description: 'Focused on technical skills, coding competitions, and hackathons' },
      { name: 'Cultural Club', description: 'Organizing cultural events, festivals, and performances' },
      { name: 'Sports Club', description: 'Promoting sports activities and tournaments' },
      { name: 'Literary Club', description: 'For book lovers, debates, and writing competitions' },
      { name: 'Music Club', description: 'For music enthusiasts and band performances' },
      { name: 'Dance Club', description: 'Dance performances and choreography workshops' },
    ];

    const clubs = [];
    for (const clubData of clubsToCreate) {
      let club = await Club.findOne({ name: clubData.name });
      if (!club) {
        club = await Club.create(clubData);
        console.log(`  ✅ Created club: ${club.name}`);
      } else {
        console.log(`  ⏭️  Club already exists: ${club.name}`);
      }
      clubs.push(club);
    }
    console.log(`✅ Total clubs: ${clubs.length}`);

    // Create sample events (mix of past, current, and future)
    const today = new Date();
    const eventsToCreate = [
      {
        title: 'Tech Fest 2025',
        description: 'Annual technical festival with coding competitions, hackathons, and tech talks',
        date: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        location: 'Main Auditorium',
        club: clubs[0]._id,
        status: 'Upcoming',
      },
      {
        title: 'Cultural Night',
        description: 'A night of music, dance, and drama performances',
        date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Open Air Theatre',
        club: clubs[1]._id,
        status: 'Upcoming',
      },
      {
        title: 'Cricket Tournament',
        description: 'Inter-department cricket championship',
        date: new Date(today.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        location: 'Sports Ground',
        club: clubs[2]._id,
        status: 'Upcoming',
      },
      {
        title: 'Book Reading Session',
        description: 'Discussion on contemporary literature',
        date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        location: 'Library Hall',
        club: clubs[3]._id,
        status: 'Upcoming',
      },
      {
        title: 'Battle of Bands',
        description: 'Live music competition featuring student bands',
        date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        location: 'Main Stage',
        club: clubs[4]._id,
        status: 'Upcoming',
      },
      {
        title: 'Dance Workshop',
        description: 'Learn contemporary and hip-hop dance styles',
        date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        location: 'Dance Studio',
        club: clubs[5]._id,
        status: 'Upcoming',
      },
      {
        title: 'Hackathon 2025',
        description: '24-hour coding marathon',
        date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        location: 'CS Lab',
        club: clubs[0]._id,
        status: 'Upcoming',
      },
      {
        title: 'Annual Day Celebration',
        description: 'Grand celebration with awards and performances',
        date: new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        location: 'Main Auditorium',
        club: clubs[1]._id,
        status: 'Upcoming',
      },
    ];

    const events = [];
    for (const eventData of eventsToCreate) {
      let event = await Event.findOne({ title: eventData.title });
      if (!event) {
        event = await Event.create(eventData);
        console.log(`  ✅ Created event: ${event.title}`);
        
        // Link event to club
        const club = await Club.findById(event.club);
        if (club && !club.events.includes(event._id)) {
          club.events.push(event._id);
          await club.save();
        }
      } else {
        console.log(`  ⏭️  Event already exists: ${event.title}`);
      }
      events.push(event);
    }
    console.log(`✅ Total events: ${events.length}`);

    // Create sample lost & found items
    // Note: Skipping Lost & Found as it requires a valid user reference
    // You can create these manually through the frontend after logging in
    console.log('⏭️  Skipping Lost & Found items (requires authenticated users)');
    const lostFoundItems = [];

    // Create sample feedback
    const feedbackData = [
      {
        subject: 'Programming Course Practical Sessions',
        message: 'Need more practical sessions for programming courses',
        type: 'feedback',
        status: 'open',
        name: 'Anonymous Student',
        email: 'student1@klh.edu',
      },
      {
        subject: 'Library AC Issue',
        message: 'AC in library is not working properly',
        type: 'grievance',
        status: 'open',
        name: 'Anonymous Student',
        email: 'student2@klh.edu',
      },
      {
        subject: 'Cafeteria Food Quality',
        message: 'Cafeteria food quality has improved significantly!',
        type: 'feedback',
        status: 'closed',
        name: 'Anonymous Student',
        email: 'student3@klh.edu',
      },
      {
        subject: 'Sports Equipment Request',
        message: 'Request for new badminton nets in sports complex',
        type: 'grievance',
        status: 'open',
        name: 'Anonymous Student',
        email: 'student4@klh.edu',
      },
      {
        subject: 'Wi-Fi Connectivity',
        message: 'Wi-Fi connectivity issues in hostel blocks',
        type: 'grievance',
        status: 'in_progress',
        name: 'Anonymous Student',
        email: 'student5@klh.edu',
      },
      {
        subject: 'Guest Lectures',
        message: 'Please organize more guest lectures from industry experts',
        type: 'feedback',
        status: 'open',
        name: 'Anonymous Student',
        email: 'student6@klh.edu',
      },
      {
        subject: 'Library Charging Points',
        message: 'Need more charging points in library',
        type: 'feedback',
        status: 'open',
        name: 'Anonymous Student',
        email: 'student7@klh.edu',
      },
    ];

    let feedbackCreated = 0;
    for (const fbData of feedbackData) {
      const existing = await Feedback.findOne({ subject: fbData.subject });
      if (!existing) {
        await Feedback.create(fbData);
        feedbackCreated++;
        console.log(`  ✅ Created feedback: ${fbData.subject}`);
      }
    }
    const totalFeedback = await Feedback.countDocuments();
    console.log(`✅ Total feedback items: ${totalFeedback} (${feedbackCreated} new)`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${clubs.length} Clubs`);
    console.log(`   • ${events.length} Events (all upcoming)`);
    console.log(`   • Lost & Found: Create via frontend after login`);
    console.log(`   • ${totalFeedback} Feedback Items`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
