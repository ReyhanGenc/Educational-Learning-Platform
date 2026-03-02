import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    'https://ltosxfpapsacxeulzcgj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk'
);

async function run() {
    const { data: ch } = await supabase.from('chapters').select('*').limit(1);
    fs.writeFileSync('chapter_sample.json', JSON.stringify(ch[0] || 'No Data', null, 2));
}

run();
