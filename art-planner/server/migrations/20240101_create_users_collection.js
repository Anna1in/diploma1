module.exports = {
    async up(db, _client) {
        // Create collection and indexes
        await db.createCollection('users');
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ createdAt: 1 });
    },

    async down(db, _client) {
        // Rollback: Drop the collection
        await db.collection('users').drop();
    }
};