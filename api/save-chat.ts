import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  // CORS configuration (Optional: needed if frontend and backend domains differ during dev)
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined');
    }

    const sql = neon(process.env.DATABASE_URL);
    const { email, scenarioId, scenarioTitle, messages, timestamp } = request.body;

    // Insert data into Neon DB
    // Note: We stringify messages to ensure it stores correctly as JSONB
    await sql`
      INSERT INTO chat_sessions (user_email, scenario_id, scenario_title, messages, created_at)
      VALUES (${email}, ${scenarioId}, ${scenarioTitle}, ${JSON.stringify(messages)}, ${timestamp})
    `;

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Database Error:', error);
    return response.status(500).json({ error: error.message || 'Failed to save session' });
  }
}