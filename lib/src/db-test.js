import { addPlayer } from "./db/db-api.js";
export default function runDBTest() {
    addPlayer({ username: 'DJ', email: 'dj@gmail.com', password: '123456' });
}
export function findUser() { }
//# sourceMappingURL=db-test.js.map