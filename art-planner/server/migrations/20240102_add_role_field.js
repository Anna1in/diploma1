module.exports = {
    async up(db, _client) {
        // Update all existing documents to have role: "user"
        await db.collection('users').updateMany(
            { role: { $exists: false } },
            { $set: { role: 'user' } }
        );
    },

    async down(db, _client) {
        // Rollback: Remove the role field from all documents
        await db.collection('users').updateMany(
            {},
            { $unset: { role: "" } }
        );
    }
};