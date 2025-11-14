import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import Club from '../models/Club.js';

dotenv.config();



const MONG_URI = process.env.MONG_URI || 'mongodb://localhost:27017/klh';


const mappings = [
  
  { eventTitle: 'Tech Fest 2025', clubName: 'Technical' },
];

const apply = process.argv.includes('--apply');
const autoApply = process.argv.includes('--apply-suggest');

function tokenize(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .replace(/[\W_]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function scoreMatch(event, club) {
  const clubTokens = new Set(tokenize(club.name));
  const eventTokens = tokenize(`${event.title} ${event.description || ''}`);
  let score = 0;
  eventTokens.forEach((t) => {
    if (clubTokens.has(t)) score += 1;
    // substring partial match bonus
    for (const ct of clubTokens) {
      if (ct.length > 3 && ct.includes(t)) score += 0.5;
      if (t.length > 3 && t.includes(ct)) score += 0.5;
    }
  });
  return score;
}

async function main() {
  console.log('Connecting to', MONG_URI);
  await mongoose.connect(MONG_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Load events and clubs for suggestion phase
  const allEvents = await Event.find().lean();
  const allClubs = await Club.find().lean();

  let suggestions = [];
  // Resolve any name-based mappings (eventTitle/clubName) into eventId/clubId
  const resolvedMappings = [];
  if (mappings.length) {
    for (const m of mappings) {
      if (m.eventId && m.clubId) {
        resolvedMappings.push({ eventId: m.eventId, clubId: m.clubId });
        continue;
      }
      if (m.eventTitle && m.clubName) {
        const titleLower = m.eventTitle.toString().toLowerCase();
        const clubLower = m.clubName.toString().toLowerCase();

        // try exact title match first
        let ev = allEvents.find(e => e.title && e.title.toString().toLowerCase() === titleLower);
        if (!ev) ev = allEvents.find(e => e.title && e.title.toString().toLowerCase().includes(titleLower));

        // try exact club name match first
        let cl = allClubs.find(c => c.name && c.name.toString().toLowerCase() === clubLower);
        if (!cl) cl = allClubs.find(c => c.name && c.name.toString().toLowerCase().includes(clubLower));

        if (!ev) {
          console.warn(`Mapping: event not found for title "${m.eventTitle}"`);
          continue;
        }
        if (!cl) {
          console.warn(`Mapping: club not found for name "${m.clubName}"`);
          continue;
        }

        resolvedMappings.push({ eventId: ev._id.toString(), clubId: cl._id.toString() });
      } else {
        console.warn('Unsupported mapping entry (provide eventId/clubId or eventTitle/clubName):', m);
      }
    }
  }

  if (!mappings.length) {
    console.log('No explicit mappings provided — computing suggestions using name/title matching...');
    // For each event, find best matching club by token overlap
    for (const ev of allEvents) {
      let best = { clubId: null, score: 0 };
      for (const cl of allClubs) {
        const s = scoreMatch(ev, cl);
        if (s > best.score) best = { clubId: cl._id.toString(), score: s, clubName: cl.name };
      }
      if (best.clubId && best.score > 0) {
        suggestions.push({ eventId: ev._id.toString(), eventTitle: ev.title, clubId: best.clubId, clubName: best.clubName, score: best.score });
      }
    }

    if (suggestions.length === 0) {
      console.log('No suggestions could be generated automatically. You should create mappings manually in the script.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Print suggestions sorted by score
    suggestions.sort((a, b) => b.score - a.score);
    console.log('\nSuggested mappings (eventId -> clubId)');
    suggestions.forEach((s) => {
      console.log(`  ${s.eventId} -> ${s.clubId}  (score: ${s.score.toFixed(2)})  // ${s.eventTitle}  => ${s.clubName}`);
    });

    if (!apply && !autoApply) {
      console.log('\nDRY RUN: no changes made. Re-run with --apply-suggest to apply these suggested mappings, or edit the mappings array to customize.');
      await mongoose.disconnect();
      process.exit(0);
    }
  }
  // Determine the list of mappings to process:
  // - If resolvedMappings exist (from name-based or id-based entries) use them
  // - Else if explicit id-based mappings were provided (and not resolved above), use mappings as-is
  // - Else if --apply-suggest passed, use suggestions
  let toProcess = [];
  if (resolvedMappings.length) {
    toProcess = resolvedMappings;
  } else if (mappings.length && mappings[0].eventId && mappings[0].clubId) {
    toProcess = mappings;
  } else if (autoApply) {
    toProcess = suggestions.map(s => ({ eventId: s.eventId, clubId: s.clubId }));
  }

  for (const { eventId, clubId } of toProcess) {
    console.log('\nProcessing mapping:', eventId, '->', clubId);
    const event = await Event.findById(eventId);
    const club = await Club.findById(clubId);

    if (!event) {
      console.warn('  Event not found:', eventId);
      continue;
    }
    if (!club) {
      console.warn('  Club not found:', clubId);
      continue;
    }

    console.log(`  Event title: ${event.title}`);
    console.log(`  Club name: ${club.name}`);
    console.log('  Current event.club:', event.club ? event.club.toString() : '(none)');
    console.log('  Club.events contains this event:', club.events && club.events.find(e => e.toString() === event._id.toString()) ? 'yes' : 'no');

    if (!apply) {
      console.log('  DRY RUN: no changes made. Re-run with --apply to persist.');
      continue;
    }

    // Apply mapping: set event.club and push event id into club.events (if not present)
    event.club = club._id;
    await event.save();
    await Club.updateOne({ _id: club._id }, { $addToSet: { events: event._id } });
    console.log('  Updated event.club and added event to club.events');
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
