import { connect } from 'http2';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb'
import { Document } from 'mongodb';

import { MONGO_URI } from '../authentication/secrets.js';

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI).then((data) => {
            console.log('Connected to WD DB');
        }).catch((e) => {
            console.log('Failed to connect to DB');
        })
    }
    catch (e) {
        console.log('Failed to connect to DB');
        console.log(e);
    }
}
export default connectDB;