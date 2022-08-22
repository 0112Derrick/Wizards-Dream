import mongoose from 'mongoose';
import { MONGO_URI } from '../authentication/secrets.js';
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI).then((data) => {
            console.log('Connected to WD DB');
        }).catch((e) => {
            console.log('Failed to connect to DB');
        });
    }
    catch (e) {
        console.log('Failed to connect to DB');
        console.log(e);
    }
}
export default connectDB;
//# sourceMappingURL=db-init.js.map