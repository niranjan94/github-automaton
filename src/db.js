import DataStore from 'nedb';
const db = new DataStore({ filename: 'data.db', autoload: true });
export default db;