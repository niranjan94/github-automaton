import Datastore from 'nedb';
const db = new Datastore({ filename: 'cache.store', autoload: true });
export default db;