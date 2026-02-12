import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Forward the request to the backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://student-management-backend-8s4c.onrender.com';
    
    // Construct the final URL for server-side fetch
    let finalBaseUrl = backendUrl;
    if (!backendUrl.startsWith('http')) {
      const host = headers().get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      finalBaseUrl = `${protocol}://${host}${backendUrl}`;
    }
    
    // Ensure finalBaseUrl ends with /api/ if it's a remote server
    if (finalBaseUrl.startsWith('http') && !finalBaseUrl.includes('/api')) {
      finalBaseUrl = finalBaseUrl.endsWith('/') ? `${finalBaseUrl}api` : `${finalBaseUrl}/api`;
    }
    
    const response = await fetch(`${finalBaseUrl}/consultancy/contact/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, subject, message }),
    });

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}