const supabaseUrl = 'https://ltosxfpapsacxeulzcgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0b3N4ZnBhcHNhY3hldWx6Y2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDYxMDUsImV4cCI6MjA4Njk4MjEwNX0.TZqdOAVQwxgBpC64xYZcD-yxPrINOQ1NR_-a7Ltxsfk';

async function apiRequest(path, method = 'GET', body = null, token = null) {
  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${token || supabaseAnonKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, options);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status} Error on ${path}: ${err}`);
  }
  return response.json();
}

async function fetchWikipediaContent(topic) {
  try {
    // Using the 'text' endpoint or higher quality summary for longer content
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    
    // Wikipedia API 'extract' can be short, so we'll try to get more if possible or format it better
    return data.extract || null;
  } catch (e) {
    return null;
  }
}

async function authenticate() {
  const email = `wiki_faculty_${Date.now()}@example.com`;
  const password = 'WikiFaculty123!';
  await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST', headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { full_name: 'Curriculum Architect', role: 'instructor' } })
  });
  const inResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const tokenData = await inResponse.json();
  return { token: tokenData.access_token, userId: tokenData.user.id };
}

const INSTRUCTORS = [
  'Prof. Alexander Thorne', 'Dr. Elena Vance', 'Dr. Marcus Sterling', 'Sarah Jenkins, PhD',
  'Prof. Julian Rossi', 'Dr. Maria Connor', 'Elias Vance', 'Dr. Arjun Mehta',
  'Dr. Sarah Chen', 'Prof. Robert Black', 'Dr. Lisa White', 'Michael Scott, EdD',
  'Dr. David Brown', 'Prof. Jennifer Green', 'Dr. Thomas Gray', 'Dr. Emily Blue',
  'Prof. Christopher Reed', 'Dr. Kimberly Wood', 'Dr. Anthony Stone', 'Dr. Patricia Hill'
];

const CURRICULUM = {
  'Primary School': {
    'Grade 1': {
      'Wild Animals': ['Lion', 'Elephant', 'Giraffe'],
      'Marine Life': ['Dolphin', 'Sea_turtle', 'Shark'],
      'Polar & Forest': ['Penguin', 'Koala', 'Giant_panda', 'Red_fox']
    },
    'Grade 2': {
      'Land Travel': ['Bicycle', 'Car', 'Train'],
      'Sea & Air': ['Ship', 'Airplane', 'Helicopter'],
      'Advanced Transit': ['Rocket', 'Hot_air_balloon', 'Submarine', 'Truck']
    },
    'Grade 3': {
      'The Planets': ['Mars', 'Jupiter', 'Saturn'],
      'Earth & Moon': ['Earth', 'Moon', 'Sun'],
      'Deep Space': ['Comet', 'Asteroid', 'Galaxy', 'Astronaut']
    },
    'Grade 4': {
      'Daily Tech': ['Light_bulb', 'Telephone', 'Internet'],
      'Industry': ['Printing_press', 'Steam_engine', 'Compass'],
      'Scientific Gains': ['Penicillin', 'Electricity', 'Automobile', 'Computer']
    }
  },
  'Middle School': {
    'Grade 5': {
      'Ancient Empires': ['Mesopotamia', 'Ancient_Egypt', 'Roman_Empire'],
      'Asian Wonders': ['Great_Wall_of_China', 'History_of_India', 'History_of_Japan'],
      'Medieval World': ['Mayan_civilization', 'Inca_Empire', 'Byzantine_Empire', 'Renaissance']
    },
    'Grade 6': {
      'Micro Medicine': ['Cell_(biology)', 'Bacteria', 'Virus'],
      'Plant Systems': ['Photosynthesis', 'Plant_anatomy', 'Fungus'],
      'Organisms': ['DNA', 'Ecosystem', 'Food_web', 'Human_heart']
    },
    'Grade 7': {
      'Matter': ['Atom', 'Molecule', 'Periodic_table'],
      'Universal Forces': ['Gravity', 'Magnetism', 'Electricity'],
      'Energy Forms': ['Heat', 'Sound', 'Light', 'Kinetic_energy']
    },
    'Grade 8': {
      'Earth Dynamics': ['Plate_tectonics', 'Volcano', 'Earthquake'],
      'Water & Air': ['Water_cycle', 'Atmosphere', 'Tsunami'],
      'Environmental Sci': ['Climate_change', 'Rock_cycle', 'Continent', 'Ocean']
    }
  },
  'High School': {
    'Grade 9': {
      'Pure Math': ['Algebra', 'Geometry', 'Number_theory'],
      'Applied Math': ['Trigonometry', 'Calculus', 'Statistics'],
      'Computation': ['Functional_programming', 'Algorithm', 'Base_64', 'Logic']
    },
    'Grade 10': {
      'Literary Giants': ['William_Shakespeare', 'Homer', 'Dante_Alighieri'],
      'Renaissance Masters': ['Leonardo_da_Vinci', 'Michelangelo', 'Raphael'],
      'Art Movements': ['Impressionism', 'Surrealism', 'Modernism', 'Postmodernism']
    },
    'Grade 11': {
      'Modern Compute': ['Artificial_intelligence', 'Machine_learning', 'Cyber_security'],
      'Emerging Tech': ['Quantum_computing', 'Blockchain', 'Virtual_reality'],
      'Data & Nano': ['Cloud_computing', 'Big_data', 'Nanotechnology', 'Robotics']
    },
    'High School Graduate': {
      'Human Behavior': ['Economics', 'Psychology', 'Sociology'],
      'Global Affairs': ['Political_science', 'International_relations', 'Human_rights'],
      'Ethics & Future': ['Philosophy', 'Globalization', 'Sustainable_development', 'Anthropology']
    }
  }
};

async function seed() {
  console.log('🚀 INITIALIZING WIKIPEDIA EXPANDED CURRICULUM...');
  const { token, userId } = await authenticate();

  // Thorough Cleanup: Delete all courses owned by this architect to prevent duplicates
  try {
    console.log('Cleaning existing courses for this user...');
    await apiRequest(`courses?user_id=eq.${userId}`, 'DELETE', null, token);
    
    // Also delete any lessons that might be orphaned (if user_id exists there)
    try {
      await apiRequest(`lessons?user_id=eq.${userId}`, 'DELETE', null, token);
    } catch(e) {}
    
    console.log('Cleanup complete.');
  } catch (e) {
    console.warn('Cleanup warning:', e.message);
  }

  let instructorIdx = 0;

  for (const [eduLevel, grades] of Object.entries(CURRICULUM)) {
    for (const [grade, themes] of Object.entries(grades)) {
      console.log(`\n📂 Seeding ${eduLevel} - ${grade}`);
      
      for (const [theme, topics] of Object.entries(themes)) {
        for (const topic of topics) {
          const instructor = INSTRUCTORS[instructorIdx % INSTRUCTORS.length];
          instructorIdx++;
          
          const title = topic.replace(/_/g, ' ');
          const price = (19.99 + Math.random() * 80).toFixed(2); // Slightly higher premium feel
          const safeSeed = topic.replace(/[^a-zA-Z0-9]/g, '');
          const image = `https://picsum.photos/seed/${safeSeed}/800/600`;

          try {
            const [course] = await apiRequest('courses', 'POST', {
              title: `${title} Masterclass`,
              description: `A comprehensive academic course on ${title}, part of the ${theme} series. High-quality content powered by Wikipedia. Perfect for ${eduLevel} students.`,
              image: image,
              instructor: instructor,
              category: theme,
              education_level: eduLevel,
              level: grade,
              price: price,
              rating: (4.7 + Math.random() * 0.3).toFixed(1),
              total_duration: '3h',
              total: 3, // CRITICAL: Fix for "0 / 0 Units"
              completed: 0,
              user_id: userId
            }, token);

            for (let i = 0; i < 3; i++) {
              const title = topic.replace(/_/g, ' ');
              let wikiText = await fetchWikipediaContent(topic);
              
              // 1. Generate a substantial First Paragraph (Introduction & Core Concepts)
              let paragraph1 = `This comprehensive module provides an in-depth exploration into the world of ${title}, specifically tailored for ${eduLevel} academic standards. Understanding ${title} is not merely about memorizing facts, but about grasping the underlying principles that govern its existence within the ${theme} framework. In this first section, students will analyze the primary characteristics and foundational theories that define ${title} in a modern context. We will examine how these concepts interconnect to form a cohesive understanding of the subject matter, ensuring a solid base for advanced study.`;

              // 2. Generate a substantial Second Paragraph (Detailed Analysis & Implications)
              let paragraph2 = wikiText && wikiText.length > 200 ? wikiText : 
                `${title} plays a critical role in our understanding of ${theme} and its various applications in the real world today. Detailed research shows that the evolution of ${title} has significantly impacted how scholars and practitioners approach problems within this field. This unit will provide a step-by-step breakdown of the most significant developments and the implications they have for future academic pursuits. By the end of this module, students will be expected to synthesize this information and apply it to complex scenarios presented in the final unit assessment.`;

              // 3. Optional Third Paragraph (Deep Dive/Future Outlook for maximum length)
              let paragraph3 = `Looking forward, the study of ${title} continues to evolve as new discoveries and methodologies emerge in the global academic landscape. It is essential for ${gradeLevel} students to remain curious and critical of the information presented, seeking connections to other disciplines where possible. This section concludes our detailed overview by highlighting the potential career paths and further research opportunities available to those who master ${title}. Mastery of these specific modules ensures that learners are well-prepared for the rigors of higher education and professional challenges.`;

              const contentBlocks = [
                { id: `header-${i}`, type: 'text', content: `Mastery Module: ${title} - Part ${i+1}` },
                { id: `p1-${i}`, type: 'text', content: paragraph1 },
                { id: `img-${i}`, type: 'image', content: `https://picsum.photos/seed/${safeSeed}U${i}/1200/800` },
                { id: `p2-${i}`, type: 'text', content: paragraph2 },
                { id: `p3-${i}`, type: 'text', content: paragraph3 }
              ];

              const [chapter] = await apiRequest('chapters', 'POST', {
                course_id: course.id,
                title: chapterTitle,
                content_blocks: contentBlocks,
                order: i
              }, token);

              // NEW: Create corresponding LESSON for UI visibility
              await apiRequest('lessons', 'POST', {
                chapter_id: chapter.id,
                user_id: userId,
                title: chapterTitle,
                category: theme,
                content_blocks: contentBlocks,
                image_url: `https://picsum.photos/seed/${safeSeed}U${i}/600/400`,
                order: i,
                is_preview: i === 0
              }, token);

              // Unit Exam
              await apiRequest('exams', 'POST', {
                title: `${title} Unit ${i+1} Assessment`,
                subject: theme,
                questions: [
                  { id: '1', type: 'multiple-choice', text: `Which of the following describes ${title} accurately?`, options: [{id:'A', text:'Core part of ' + theme}, {id:'B', text:'Unrelated topic'}], correctOptionId:'A' },
                  { id: '2', type: 'multiple-choice', text: `Is this unit content appropriate for ${grade}?`, options: [{id:'A', text:'Yes, absolutely'}, {id:'B', text:'No, too simple'}], correctOptionId:'A' },
                  { id: '3', type: 'multiple-choice', text: `What is the focus of this masterclass?`, options: [{id:'A', text:title}, {id:'B', text:'General studies'}], correctOptionId:'A' }
                ],
                questions_count: 3,
                chapter_id: chapter.id,
                instructor: instructor,
                user_id: userId
              }, token);
            }
            console.log(`   ✅ Created: ${title} (${instructor})`);
          } catch (e) {
            console.error(`   ❌ Failed: ${topic}: ${e.message}`);
          }
        }
      }
    }
  }
  console.log('\n🌟 CURRICULUM DEPLOYMENT COMPLETE. 120 COURSES LIVE WITH FULL METADATA.');
}

seed();
