
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
    
    let body = request.body;
    if (typeof body === 'string') {
        try {
            body = JSON.parse(body);
        } catch (e) {
            return response.status(400).json({ error: 'Invalid JSON body' });
        }
    }

    const { email, group } = body;

    if (!email || !group) {
        return response.status(400).json({ error: 'Missing email or group' });
    }

    // 1. Ensure the table exists
    await sql`
      CREATE TABLE IF NOT EXISTS user_groups (
        user_email TEXT PRIMARY KEY,
        assigned_group TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Insert or Update User Group
    await sql`
      INSERT INTO user_groups (user_email, assigned_group)
      VALUES (${email}, ${group})
      ON CONFLICT (user_email)
      DO UPDATE SET 
        assigned_group = ${group}
    `;

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Database Error (save-user-group):', error);
    return response.status(500).json({ error: error.message || 'Failed to save user group' });
  }
}
