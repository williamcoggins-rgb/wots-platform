// Usage:
// 1. Make sure you have a Firebase service account key JSON file
// 2. Run: GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json node scripts/seed-content.js
// Or if using Firebase emulator:
// 3. Run: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/seed-content.js

const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const now = Date.now();

const items = [
  {
    id: 'seed-lore-001',
    type: 'lore',
    title: 'The Age of Silence',
    body: 'Before the Sphinx spoke, the desert stretched unbroken beneath a sky that offered no answers. The dunes shifted without purpose, and the wind carried nothing but dust. Some say the world itself was holding its breath, waiting for a question worthy enough to shatter the stillness.',
    metadata: { epoch: 'Age of Silence' },
    createdAt: now,
    updatedAt: now,
    status: 'published',
  },
  {
    id: 'seed-lore-002',
    type: 'lore',
    title: 'The First Riddle',
    body: 'No one remembers the words exactly. What is known is that when the first question was finally asked, the sand turned to glass beneath the speaker and the stars rearranged themselves overhead. The answer, whatever it was, split the silence in two and left a fissure in the earth that has never healed.',
    metadata: { epoch: 'Age of Silence' },
    createdAt: now - 1000,
    updatedAt: now - 1000,
    status: 'published',
  },
  {
    id: 'seed-quest-001',
    type: 'quest',
    title: 'Echoes in the Sand',
    body: 'Travelers crossing the southern dunes report hearing a low resonance beneath their feet, as though something vast is breathing underground. The sound grows louder near the old cairns. Those who have tried to dig toward the source say the sand fills back in faster than they can move it, and the echoes only deepen.',
    metadata: { region: 'Southern Dunes' },
    createdAt: now - 2000,
    updatedAt: now - 2000,
    status: 'published',
  },
  {
    id: 'seed-quest-002',
    type: 'quest',
    title: 'The Broken Seal',
    body: 'Fragments of a seal, once whole, have been scattered across the desert by a force no one can name. Each piece hums faintly when held, and when two fragments are brought near each other they pull together like lodestones. The complete seal is said to have once held something shut. What it contained, and whether it should be opened, is a matter of some debate.',
    metadata: { difficulty: 'intermediate' },
    createdAt: now - 3000,
    updatedAt: now - 3000,
    status: 'published',
  },
  {
    id: 'seed-char-001',
    type: 'character',
    title: 'The Wanderer',
    body: 'A solitary figure seen at the edges of settlements, never entering, never speaking. They appear most often at dusk, standing motionless against the horizon. No one has seen their face clearly. Those who have tried to approach report that the distance between them and the figure never seems to close.',
    metadata: { affiliation: 'unknown' },
    createdAt: now - 4000,
    updatedAt: now - 4000,
    status: 'published',
  },
  {
    id: 'seed-loc-001',
    type: 'location',
    title: 'The Sunken Court',
    body: 'At dawn, when the light falls at just the right angle, the outline of a vast palace becomes visible beneath the sand. Columns and arches emerge from the dunes like the ribs of some ancient leviathan. By midday it is gone again, swallowed whole, and the desert offers no proof it was ever there.',
    metadata: { region: 'Eastern Reaches' },
    createdAt: now - 5000,
    updatedAt: now - 5000,
    status: 'published',
  },
  {
    id: 'seed-loc-002',
    type: 'location',
    title: 'The Whispering Dunes',
    body: 'A long stretch of desert where the sand itself seems to speak. Travelers report hearing fragments of forgotten languages carried on winds that blow from no discernible direction. Some have transcribed what they heard, but the symbols they write down shift and rearrange when left unattended, as though the words refuse to be pinned in place.',
    metadata: { region: 'Western Expanse' },
    createdAt: now - 6000,
    updatedAt: now - 6000,
    status: 'published',
  },
  {
    id: 'seed-lore-003',
    type: 'lore',
    title: 'On the Nature of the Sphinx',
    body: 'The Sphinx is not a creature, though it breathes. It is not a god, though it is worshipped. The oldest texts describe it as a threshold, a living boundary between what is known and what is not. To stand before it is to stand at the edge of understanding itself, and to answer its questions is to redraw that edge.',
    metadata: { epoch: 'Timeless' },
    createdAt: now - 7000,
    updatedAt: now - 7000,
    status: 'published',
  },
];

async function seed() {
  const batch = db.batch();
  for (const item of items) {
    batch.set(db.collection('content').doc(item.id), item);
  }
  await batch.commit();
  console.log('Seeded ' + items.length + ' content items to the \'content\' collection.');
}

seed().catch(function (err) {
  console.error('Failed to seed content:', err);
  process.exit(1);
});
