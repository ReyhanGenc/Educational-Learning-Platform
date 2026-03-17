const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

async function diagnose() {
  const headers = { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` };
  const cols = ['incorrect_answers'];
  for (const c of cols) {
    const r = await fetch(`${supabaseUrl}/rest/v1/exam_results?select=${c}&limit=1`, { headers });
    console.log(`COL ${c.padEnd(20)}: ${r.ok ? 'YES' : 'NO (' + r.status + ')'}`);
  }
}
diagnose();
