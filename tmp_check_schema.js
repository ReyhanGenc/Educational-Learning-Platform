
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols(table, col) {
    const { error } = await supabase.from(table).select(col).limit(1);
    if (error) {
        console.log(`${table}.${col} does not exist:`, error.message);
        return false;
    } else {
        console.log(`${table}.${col} EXISTS.`);
        return true;
    }
}

async function main() {
    await checkCols('profiles', 'id');
    await checkCols('profiles', 'full_name');
    await checkCols('profiles', 'role');
    await checkCols('profiles', 'user_role');
}

main();
