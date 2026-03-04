import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/UM'; // Fixed variable name to match .env

async function dropIndex() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const collection = db.collection('templates');

        console.log('Fetching indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', JSON.stringify(indexes, null, 2));

        const target = 'moduleType_1_version_1';
        const exists = indexes.some(idx => idx.name === target);

        if (exists) {
            console.log(`Dropping index ${target}...`);
            await collection.dropIndex(target);
            console.log(`Index ${target} dropped successfully.`);
        } else {
            console.log(`Index ${target} not found. Skipping.`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

dropIndex();
