const { Client } = require('pg');

async function verifyMessages() {
    // Try connecting to 5433 first (User said Docker is on 5433)
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'loopp_db',
        password: 'recep190',
        port: 5433,
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL on port 5433');
    } catch (err) {
        console.log('Failed to connect to 5433, trying 5432...');
        try {
            client.port = 5432;
            await client.connect();
            console.log('Connected to PostgreSQL on port 5432');
        } catch (e) {
            console.error('Could not connect to database on 5432 or 5433:', e);
            process.exit(1);
        }
    }

    try {
        // Check message count
        const resCount = await client.query('SELECT COUNT(*) FROM message');
        console.log(`Total messages in DB: ${resCount.rows[0].count}`);

        // Check recent messages with details in JSON format
        const res = await client.query(`
            SELECT 
                m.id, 
                m.content, 
                m."createdAt", 
                m."senderId", 
                s."fullName" as "senderName",
                m."receiverId", 
                r."fullName" as "receiverName",
                m."itemId"
            FROM message m
            LEFT JOIN "user" s ON m."senderId" = s.id
            LEFT JOIN "user" r ON m."receiverId" = r.id
            ORDER BY m."createdAt" DESC
            LIMIT 5
        `);

        console.log('Recent 5 messages:');
        console.table(res.rows);

        // Check if any message has NULL sender or receiver
        const nulls = await client.query('SELECT * FROM message WHERE "senderId" IS NULL OR "receiverId" IS NULL');
        if (nulls.rows.length > 0) {
            console.log('WARNING: Found messages with NULL senderId or receiverId:');
            console.table(nulls.rows);
        } else {
            console.log('All messages have valid senderId and receiverId.');
        }

    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await client.end();
    }
}

verifyMessages();
