import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from './models/Template.js';

dotenv.config();

async function create() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const template = new Template({
            name: 'Test Template',
            category: 'Household',
            moduleType: 'TEST',
            modules: [
                {
                    moduleId: 'm1',
                    title: 'Module 1',
                    sections: [
                        {
                            sectionId: 's1',
                            title: 'Section 1',
                            fields: [
                                {
                                    fieldId: 'f1',
                                    questionCode: 'q1',
                                    label: 'Test Question',
                                    type: 'text',
                                    required: true
                                }
                            ]
                        }
                    ]
                }
            ],
            status: 'Draft',
            version: 1
        });

        const saved = await template.save();
        console.log('Saved template:', saved._id);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

create();
