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

async function authenticate() {
  const email = `exam_admin_${Date.now()}@example.com`;
  const password = 'ExamAdmin123!';
  await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST', headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { full_name: 'Exam Administrator', role: 'instructor' } })
  });
  const inResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const tokenData = await inResponse.json();
  return { token: tokenData.access_token, userId: tokenData.user.id };
}

const EXAMS_DATA = [
  {
    title: "Artificial Intelligence Foundation",
    subject: "Technology",
    color: "brand",
    questions: [
      { id: '1', text: "What does 'ML' stand for in AI?", options: [{id:'A', text:'Machine Learning'}, {id:'B', text:'Manual Logic'}, {id:'C', text:'Modern Language'}, {id:'D', text:'Main Loop'}], correctOptionId:'A' },
      { id: '2', text: "Which algorithm is commonly used for classification tasks?", options: [{id:'A', text:'K-Means'}, {id:'B', text:'Random Forest'}, {id:'C', text:'Dijkstra'}, {id:'D', text:'Bubble Sort'}], correctOptionId:'B' },
      { id: '3', text: "What is a 'Neural Network' inspired by?", options: [{id:'A', text:'Social Networks'}, {id:'B', text:'Biological Brains'}, {id:'C', text:'Electrical Grids'}, {id:'D', text:'Road Systems'}], correctOptionId:'B' },
      { id: '4', text: "What is 'Overfitting' in a model?", options: [{id:'A', text:'Model is too simple'}, {id:'B', text:'Model is too complex and fits noise'}, {id:'C', text:'Model has no data'}, {id:'D', text:'Model is perfectly accurate'}], correctOptionId:'B' },
      { id: '5', text: "Which programming language is most popular for AI development?", options: [{id:'A', text:'C++'}, {id:'B', text:'Python'}, {id:'C', text:'HTML'}, {id:'D', text:'PHP'}], correctOptionId:'B' },
      { id: '6', text: "What is the Turing Test used for?", options: [{id:'A', text:'Measuring CPU speed'}, {id:'B', text:'Determining if a machine can exhibit human-like intelligence'}, {id:'C', text:'Testing network security'}, {id:'D', text:'Checking database integrity'}], correctOptionId:'B' }
    ]
  },
  {
    title: "Climate Change & Sustainability",
    subject: "Environment",
    color: "teal",
    questions: [
      { id: '1', text: "Which gas is primarily responsible for the greenhouse effect?", options: [{id:'A', text:'Oxygen'}, {id:'B', text:'Carbon Dioxide'}, {id:'C', text:'Nitrogen'}, {id:'D', text:'Hydrogen'}], correctOptionId:'B' },
      { id: '2', text: "What is the main cause of rising sea levels?", options: [{id:'A', text:'More rain'}, {id:'B', text:'Melting glaciers and thermal expansion'}, {id:'C', text:'Undersea volcanoes'}, {id:'D', text:'Tides'}], correctOptionId:'B' },
      { id: '3', text: "What does 'Sustainability' mean in an environmental context?", options: [{id:'A', text:'Using resources as fast as possible'}, {id:'B', text:'Meeting current needs without compromising future generations'}, {id:'C', text:'Stopping all industrial activity'}, {id:'D', text:'Focusing only on economic growth'}], correctOptionId:'B' },
      { id: '4', text: "Which of these is a renewable energy source?", options: [{id:'A', text:'Coal'}, {id:'B', text:'Natural Gas'}, {id:'C', text:'Solar Energy'}, {id:'D', text:'Nuclear Power'}], correctOptionId:'C' },
      { id: '5', text: "What is the primary goal of the Paris Agreement?", options: [{id:'A', text:'To explore Mars'}, {id:'B', text:'To limit global warming to well below 2°C'}, {id:'C', text:'To ban all plastic'}, {id:'D', text:'To build more dams'}], correctOptionId:'B' }
    ]
  },
  {
    title: "World History: Industrial Revolution",
    subject: "History",
    color: "orange",
    questions: [
      { id: '1', text: "Where did the Industrial Revolution begin?", options: [{id:'A', text:'USA'}, {id:'B', text:'Great Britain'}, {id:'C', text:'France'}, {id:'D', text:'Germany'}], correctOptionId:'B' },
      { id: '2', text: "Who improved the steam engine, making it practical for industrial use?", options: [{id:'A', text:'Isaac Newton'}, {id:'B', text:'James Watt'}, {id:'C', text:'Thomas Edison'}, {id:'D', text:'Albert Einstein'}], correctOptionId:'B' },
      { id: '3', text: "Which industry was the first to be industrialized?", options: [{id:'A', text:'Agriculture'}, {id:'B', text:'Textiles'}, {id:'C', text:'Mining'}, {id:'D', text:'Transportation'}], correctOptionId:'B' },
      { id: '4', text: "What was a major social effect of the Industrial Revolution?", options: [{id:'A', text:'Urbanization'}, {id:'B', text:'Return to rural life'}, {id:'C', text:'Decrease in population'}, {id:'D', text:'End of slavery'}], correctOptionId:'A' },
      { id: '5', text: "What invention revolutionized communication during the 19th century?", options: [{id:'A', text:'Radio'}, {id:'B', text:'Telegraph'}, {id:'C', text:'Television'}, {id:'D', text:'Internet'}], correctOptionId:'B' },
      { id: '6', text: "When did the first Industrial Revolution roughly occur?", options: [{id:'A', text:'1500-1600'}, {id:'B', text:'1760-1840'}, {id:'C', text:'1900-1950'}, {id:'D', text:'1650-1700'}], correctOptionId:'B' }
    ]
  },
  {
    title: "Introduction to Astrophysics",
    subject: "Physics",
    color: "purple",
    questions: [
      { id: '1', text: "What is the most abundant element in the universe?", options: [{id:'A', text:'Helium'}, {id:'B', text:'Hydrogen'}, {id:'C', text:'Oxygen'}, {id:'D', text:'Carbon'}], correctOptionId:'B' },
      { id: '2', text: "What is the name of our galaxy?", options: [{id:'A', text:'Andromeda'}, {id:'B', text:'The Milky Way'}, {id:'C', text:'Sombrero'}, {id:'D', text:'Centaurus A'}], correctOptionId:'B' },
      { id: '3', text: "A black hole's boundary from which nothing can escape is called:", options: [{id:'A', text:'Singularity'}, {id:'B', text:'Event Horizon'}, {id:'C', text:'Accretion Disk'}, {id:'D', text:'Wormhole'}], correctOptionId:'B' },
      { id: '4', text: "What is the approximate age of the universe?", options: [{id:'A', text:'4.5 billion years'}, {id:'B', text:'13.8 billion years'}, {id:'C', text:'100 billion years'}, {id:'D', text:'1 trillion years'}], correctOptionId:'B' },
      { id: '5', text: "What type of star is the Sun?", options: [{id:'A', text:'Red Giant'}, {id:'B', text:'Yellow Dwarf'}, {id:'C', text:'White Dwarf'}, {id:'D', text:'Blue Supergiant'}], correctOptionId:'B' },
      { id: '6', text: "What force keeps planets in orbit around stars?", options: [{id:'A', text:'Magnetism'}, {id:'B', text:'Gravity'}, {id:'C', text:'Friction'}, {id:'D', text:'Strong Nuclear Force'}], correctOptionId:'B' },
      { id: '7', text: "What does the 'Big Bang' theory describe?", options: [{id:'A', text:'The end of the universe'}, {id:'B', text:'The expansion of the universe from a hot, dense state'}, {id:'C', text:'A collision between two galaxies'}, {id:'D', text:'The explosion of a star'}], correctOptionId:'B' }
    ]
  },
  {
    title: "Modern Cybersecurity Practices",
    subject: "Technology",
    color: "brand",
    questions: [
      { id: '1', text: "What does 'Phishing' refer to?", options: [{id:'A', text:'Searching for bugs in code'}, {id:'B', text:'Fraudulent attempts to obtain sensitive information'}, {id:'C', text:'Speeding up a server'}, {id:'D', text:'Fishing in a digital lake'}], correctOptionId:'B' },
      { id: '2', text: "What is 'Two-Factor Authentication' (2FA)?", options: [{id:'A', text:'Using two different passwords'}, {id:'B', text:'Requiring two different forms of identification'}, {id:'C', text:'Changing your password twice'}, {id:'D', text:'Having two admin accounts'}], correctOptionId:'B' },
      { id: '3', text: "What is the purpose of a Firewall?", options: [{id:'A', text:'To cool down the hardware'}, {id:'B', text:'To monitor and control incoming/outgoing network traffic'}, {id:'C', text:'To speed up the internet'}, {id:'D', text:'To delete temporary files'}], correctOptionId:'B' },
      { id: '4', text: "What is Malware?", options: [{id:'A', text:'Good software'}, {id:'B', text:'Malicious software intended to damage or disable computers'}, {id:'C', text:'A type of hardware'}, {id:'D', text:'A marketing strategy'}], correctOptionId:'B' },
      { id: '5', text: "What does HTTPS stand for?", options: [{id:'A', text:'Hypertext Transfer Protocol Secure'}, {id:'B', text:'High Tech Transfer Protocol Service'}, {id:'C', text:'Hypertext Terminal Port Security'}, {id:'D', text:'Home Tech Tool System'}], correctOptionId:'A' }
    ]
  },
  {
    title: "Principles of Macroeconomics",
    subject: "Economics",
    color: "teal",
    questions: [
      { id: '1', text: "What does GDP stand for?", options: [{id:'A', text:'Global Delivery Process'}, {id:'B', text:'Gross Domestic Product'}, {id:'C', text:'Government Debt Percentage'}, {id:'D', text:'General Data Policy'}], correctOptionId:'B' },
      { id: '2', text: "What is 'Inflation'?", options: [{id:'A', text:'Decrease in general price level'}, {id:'B', text:'Increase in general price level over time'}, {id:'C', text:'Increase in population'}, {id:'D', text:'Growth of a company'}], correctOptionId:'B' },
      { id: '3', text: "Who is responsible for Monetary Policy in the US?", options: [{id:'A', text:'The President'}, {id:'B', text:'The Federal Reserve'}, {id:'C', text:'The Supreme Court'}, {id:'D', text:'Congress'}], correctOptionId:'B' },
      { id: '4', text: "A period of temporary economic decline is called a:", options: [{id:'A', text:'Expansion'}, {id:'B', text:'Recession'}, {id:'C', text:'Peak'}, {id:'D', text:'Boom'}], correctOptionId:'B' },
      { id: '5', text: "What is the 'Law of Supply'?", options: [{id:'A', text:'Higher price leads to lower supply'}, {id:'B', text:'Higher price leads to higher supply'}, {id:'C', text:'Supply is always constant'}, {id:'D', text:'Demand always exceeds supply'}], correctOptionId:'B' }
    ]
  },
  {
    title: "Cell Biology and Genetics",
    subject: "Biology",
    color: "purple",
    questions: [
      { id: '1', text: "What is the 'Powerhouse of the cell'?", options: [{id:'A', text:'Nucleus'}, {id:'B', text:'Mitochondria'}, {id:'C', text:'Ribosome'}, {id:'D', text:'Vacuole'}], correctOptionId:'B' },
      { id: '2', text: "Where is the genetic material (DNA) stored in a eukaryotic cell?", options: [{id:'A', text:'Cytoplasm'}, {id:'B', text:'Nucleus'}, {id:'C', text:'Cell Membrane'}, {id:'D', text:'Lysosome'}], correctOptionId:'B' },
      { id: '3', text: "How many pairs of chromosomes do humans typically have?", options: [{id:'A', text:'12'}, {id:'B', text:'23'}, {id:'C', text:'46'}, {id:'D', text:'24'}], correctOptionId:'B' },
      { id: '4', text: "What is the process of cell division that results in two identical daughter cells?", options: [{id:'A', text:'Meiosis'}, {id:'B', text:'Mitosis'}, {id:'C', text:'Photosynthesis'}, {id:'D', text:'Diffusion'}], correctOptionId:'B' },
      { id: '5', text: "Who is known as the father of genetics?", options: [{id:'A', text:'Charles Darwin'}, {id:'B', text:'Gregor Mendel'}, {id:'C', text:'Louis Pasteur'}, {id:'D', text:'Francis Crick'}], correctOptionId:'B' },
      { id: '6', text: "What is a 'Mutation'?", options: [{id:'A', text:'A type of cell'}, {id:'B', text:'A change in the DNA sequence'}, {id:'C', text:'A biological process'}, {id:'D', text:'A vitamin'}], correctOptionId:'B' }
    ]
  },
  {
    title: "Digital Arts and Design Theory",
    subject: "Arts",
    color: "brand",
    questions: [
      { id: '1', text: "What does 'UI' stand for in design?", options: [{id:'A', text:'User Integration'}, {id:'B', text:'User Interface'}, {id:'C', text:'Unit Identification'}, {id:'D', text:'Unique Image'}], correctOptionId:'B' },
      { id: '2', text: "Which color model is used for digital screens?", options: [{id:'A', text:'CMYK'}, {id:'B', text:'RGB'}, {id:'C', text:'Pantone'}, {id:'D', text:'Grayscale'}], correctOptionId:'B' },
      { id: '3', text: "What is 'Typography'?", options: [{id:'A', text:'The study of maps'}, {id:'B', text:'The art and technique of arranging type'}, {id:'C', text:'A type of photography'}, {id:'D', text:'Drawing landscapes'}], correctOptionId:'B' },
      { id: '4', text: "What is the purpose of a 'Wireframe'?", options: [{id:'A', text:'Final visual design'}, {id:'B', text:'A low-fidelity visual guide of a website/app structure'}, {id:'C', text:'A code template'}, {id:'D', text:'An image filter'}], correctOptionId:'B' },
      { id: '5', text: "Which design principle refers to the distribution of visual weight?", options: [{id:'A', text:'Contrast'}, {id:'B', text:'Balance'}, {id:'C', text:'Rhythm'}, {id:'D', text:'Emphasis'}], correctOptionId:'B' }
    ]
  },
  {
    title: "Introduction to Philosophy: Ethics",
    subject: "Philosophy",
    color: "orange",
    questions: [
      { id: '1', text: "What is the main focus of 'Ethics'?", options: [{id:'A', text:'Nature of reality'}, {id:'B', text:'Morality and what is right/wrong'}, {id:'C', text:'The study of knowledge'}, {id:'D', text:'Political structures'}], correctOptionId:'B' },
      { id: '2', text: "Which philosopher is known for 'Utilitarianism'?", options: [{id:'A', text:'Immanuel Kant'}, {id:'B', text:'John Stuart Mill'}, {id:'C', text:'Aristotle'}, {id:'D', text:'Plato'}], correctOptionId:'B' },
      { id: '3', text: "What is a 'Categorical Imperative' as per Kant?", options: [{id:'A', text:'A moral law that is unconditional'}, {id:'B', text:'A suggestion'}, {id:'C', text:'A religious commandment'}, {id:'D', text:'A legal statute'}], correctOptionId:'A' },
      { id: '4', text: "What is 'Nihilism'?", options: [{id:'A', text:'Belief in everything'}, {id:'B', text:'Belief that life is meaningless'}, {id:'C', text:'Study of numbers'}, {id:'D', text:'Religious devotion'}], correctOptionId:'B' },
      { id: '5', text: "Aristotle's ethics focused on developing good character, also known as:", options: [{id:'A', text:'Deontology'}, {id:'B', text:'Virtue Ethics'}, {id:'C', text:'Hedonism'}, {id:'D', text:'Skepticism'}], correctOptionId:'B' }
    ]
  },
  {
    title: "Global Political Systems",
    subject: "Political Science",
    color: "teal",
    questions: [
      { id: '1', text: "What is a 'Democracy'?", options: [{id:'A', text:'Rule by one person'}, {id:'B', text:'Rule by the people'}, {id:'C', text:'Rule by the wealthy'}, {id:'D', text:'No rule at all'}], correctOptionId:'B' },
      { id: '2', text: "What does 'Sovereignty' mean?", options: [{id:'A', text:'Complete control over a territory'}, {id:'B', text:'Economic wealth'}, {id:'C', text:'The size of a country'}, {id:'D', text:'Type of currency'}], correctOptionId:'A' },
      { id: '3', text: "Which system of government has a king or queen as head of state?", options: [{id:'A', text:'Republic'}, {id:'B', text:'Monarchy'}, {id:'C', text:'Theocracy'}, {id:'D', text:'Oligarchy'}], correctOptionId:'B' },
      { id: '4', text: "What is the primary role of the United Nations (UN)?", options: [{id:'A', text:'Global trade'}, {id:'B', text:'Maintaining international peace and security'}, {id:'C', text:'Running local schools'}, {id:'D', text:'Building roads'}], correctOptionId:'B' },
      { id: '5', text: "What is 'Anarchy'?", options: [{id:'A', text:'A strict dictatorship'}, {id:'B', text:'Absence of government and absolute freedom of the individual'}, {id:'C', text:'Rule by religious leaders'}, {id:'D', text:'A parliamentary system'}], correctOptionId:'B' }
    ]
  }
];

async function seedExams() {
  console.log('🚀 INITIALIZING STANDALONE EXAMS...') ;
  try {
    const { token, userId } = await authenticate();
    console.log(`Authenticated as ${userId}`);

    for (const examData of EXAMS_DATA) {
      console.log(`Seeding Exam: ${examData.title}`);
      
      const [exam] = await apiRequest('exams', 'POST', {
        title: examData.title,
        subject: examData.subject,
        questions: examData.questions,
        questions_count: examData.questions.length,
        duration: examData.questions.length * 2,
        color: examData.color,
        status: 'Active',
        user_id: userId,
        chapter_id: null // Standalone exam
      }, token);

      console.log(`   ✅ Created: ${exam.title} (ID: ${exam.id})`);
    }

    console.log('\n🌟 ALL 10 EXAMS SEEDED SUCCESSFULLY.');
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error.message);
  }
}

seedExams();
