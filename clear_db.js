const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

async function apiRequest(path, method = 'GET', body = null, token = null) {
  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${token || supabaseAnonKey}`,
    'Content-Type': 'application/json'
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, options);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error ${response.status} on ${path}: ${err}`);
  }
  return response.status === 204 ? null : response.json();
}

async function authenticate() {
  const email = `cleanup_tool_${Date.now()}@example.com`;
  const password = 'CleanupPassword123!';
  await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST', headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { full_name: 'Cleanup System', role: 'instructor' } })
  });
  const inResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const tokenData = await inResponse.json();
  return { token: tokenData.access_token };
}

async function cleanup() {
  console.log('🧹 Starting Database Cleanup...');
  try {
    const { token } = await authenticate();
    
    // Order matters due to potential foreign keys
    console.log(' - Clearing Exams...');
    await apiRequest('exams?id=not.is.null', 'DELETE', null, token);
    
    console.log(' - Clearing Chapters...');
    await apiRequest('chapters?id=not.is.null', 'DELETE', null, token);
    
    console.log(' - Clearing Courses...');
    await apiRequest('courses?id=not.is.null', 'DELETE', null, token);
    
    console.log('✅ Database is now empty.');
  } catch (e) {
    console.error('❌ Cleanup failed:', e.message);
  }
}

cleanup();
