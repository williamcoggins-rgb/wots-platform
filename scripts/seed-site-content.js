#!/usr/bin/env node
// Seed the Firestore 'site_content' collection with default homepage content.
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json node scripts/seed-site-content.js
// Or with emulator:
//   FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/seed-site-content.js

const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const now = Date.now();

const documents = {
  hero: {
    tagline: 'The war for an ancient world begins.',
    ctaPrimary: { label: 'Consult the Griot', link: '/chat' },
    ctaSecondary: { label: 'Explore the World', link: '/lore' },
    updatedAt: now,
  },
  featured_cards: {
    cards: [
      {
        title: 'Volume 1 Coming Soon',
        category: 'ANNOUNCEMENT',
        desc: 'The first chapter of an ancient war is about to be written.',
        gradient: 'linear-gradient(160deg, #1a1a1a 0%, #3d2200 60%, #E88A1A 100%)',
        imageCategory: 'covers',
      },
      {
        title: 'Meet the Sphinx',
        category: 'LORE',
        desc: 'A guardian older than memory. Its riddles shape the fate of worlds.',
        gradient: 'linear-gradient(160deg, #1a1a1a 0%, #0f3333 60%, #2BA5A5 100%)',
        imageCategory: 'characters',
      },
      {
        title: 'The War Begins',
        category: 'STORY',
        desc: 'Ancient powers stir. Lines are drawn in sand and blood.',
        gradient: 'linear-gradient(160deg, #1a1a1a 0%, #3d1515 60%, #c43030 100%)',
        imageCategory: 'hero',
      },
      {
        title: 'Join the Seekers',
        category: 'COMMUNITY',
        desc: 'Knowledge is earned, not given. The worthy will find their way.',
        gradient: 'linear-gradient(160deg, #1a1a1a 0%, #1a3d1a 60%, #2e8b2e 100%)',
        imageCategory: 'environments',
      },
    ],
    updatedAt: now,
  },
  discover_cards: {
    cards: [
      {
        title: 'A World Buried in Sand',
        desc: 'An ancient civilization stirs beneath the desert. Its cities remember what its people have forgotten.',
        borderColor: '#E88A1A',
        hoverBorderColor: '#F5A623',
      },
      {
        title: 'Ancient Riddles',
        desc: 'The Sphinx speaks in puzzles. Every answer opens a door — and every door hides another question.',
        borderColor: '#2BA5A5',
        hoverBorderColor: '#3DC0C0',
      },
      {
        title: 'A War Is Coming',
        desc: 'Power shifts in the dark. Something old is waking, and not everyone will survive what follows.',
        borderColor: '#F5C542',
        hoverBorderColor: '#FFD966',
      },
    ],
    updatedAt: now,
  },
  email_capture: {
    heading: 'Enter the Archive',
    subheading: 'Be among the first to know when the saga begins.',
    buttonText: 'Subscribe',
    updatedAt: now,
  },
};

async function seed() {
  const batch = db.batch();
  for (const [id, data] of Object.entries(documents)) {
    batch.set(db.collection('site_content').doc(id), data);
  }
  await batch.commit();
  console.log(`Seeded ${Object.keys(documents).length} site_content documents: ${Object.keys(documents).join(', ')}`);
}

seed().catch(console.error);
