import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
    'https://ltosxfpapsacxeulzcgj.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk'
);

async function run() {
    const { data: e } = await supabase.from('exams').select('*').limit(1);
    const { data: c } = await supabase.from('courses').select('*').limit(1);
    const result = {
        exams: e[0] || 'No Data',
        courses: c[0] || 'No Data'
    };
    fs.writeFileSync('schema_output.json', JSON.stringify(result, null, 2));
    console.log('Done');
}

run();
