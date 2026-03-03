import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from './models/Template.js';

dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        const count = await Template.countDocuments();
        console.log(`Total templates: ${count}`);
        const templates = await Template.find().limit(5);
        console.log('Templates:', JSON.stringify(templates, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
