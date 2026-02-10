import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  // CORS configuration
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // Robust body parsing: handle if body is string or object
    let body = request.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return response.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { session_id, user_email, scenario_id, scenario_title, messages } = body;

    // Validate required fields
    if (!session_id || !user_email || !scenario_id || !messages) {
        console.error('Missing fields:', { session_id, user_email, scenario_id, hasMessages: !!messages });
        return response.status(400).json({ error: 'Missing required fields' });
    }

    // JSONB serialization
    const messagesJson = JSON.stringify(messages);

    // 1. Ensure the table exists with the correct schema (v2 to avoid conflicts with old table)
    // We use chat_sessions_v2 to ensure session_id column exists.
    await sql`
      CREATE TABLE IF NOT EXISTS chat_sessions_v2 (
        session_id TEXT PRIMARY KEY,
        user_email TEXT NOT NULL,
        scenario_id INTEGER,
        scenario_title TEXT,
        messages JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. UPSERT Query on chat_sessions_v2
    await sql`
      INSERT INTO chat_sessions_v2 (session_id, user_email, scenario_id, scenario_title, messages)
      VALUES (${session_id}, ${user_email}, ${scenario_id}, ${scenario_title}, ${messagesJson})
      ON CONFLICT (session_id)
      DO UPDATE SET 
        messages = ${messagesJson},
        updated_at = NOW()
    `;

    return response.status(200).json({ success: true, sid: session_id });
  } catch (error) {
    console.error('Database Error:', error);
    return response.status(500).json({ error: error.message || 'Failed to save session' });
  }
}