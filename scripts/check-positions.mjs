import mongoose from 'mongoose';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const match = envContent.match(/MONGODB_URI=(.+)/);
const uri = match ? match[1].trim() : null;

if (!uri) {
  console.error('MONGODB_URI not found');
  process.exit(1);
}

await mongoose.connect(uri);
const positions = await mongoose.connection.db.collection('players').distinct('position');
console.log('Positions in DB:', positions);
const count = await mongoose.connection.db.collection('players').countDocuments();
console.log('Total players:', count);
await mongoose.disconnect();
