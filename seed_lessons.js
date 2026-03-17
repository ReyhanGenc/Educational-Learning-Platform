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
  const email = `lesson_faculty_${Date.now()}@example.com`;
  const password = 'LessonFaculty123!';
  await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST', headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { full_name: 'Content Creator', role: 'instructor' } })
  });
  const inResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const tokenData = await inResponse.json();
  return { token: tokenData.access_token, userId: tokenData.user.id };
}

const LESSONS_DATA = [
  {
    title: "Quantum Mechanics: The Frontier of Reality",
    category: "Physics",
    content: "An in-depth look at subatomic particles and the laws that govern the very small.",
    image_url: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles. It is the foundation of all quantum physics including quantum chemistry, quantum field theory, quantum technology, and quantum information science.<br><br>Classical physics, the collection of theories that existed before the advent of quantum mechanics, describes many aspects of nature at an ordinary (macroscopic) scale, but is not sufficient for describing them at small (atomic and subatomic) scales. Most theories in classical physics can be derived from quantum mechanics as an approximation valid at large (macroscopic) scale." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "One of the most famous experiments in quantum mechanics is the double-slit experiment. It demonstrates that light and matter can display characteristics of both classically defined waves and particles; moreover, it displays the fundamentally probabilistic nature of quantum mechanical phenomena.<br><br><strong>Quantum Entanglement:</strong> A physical phenomenon that occurs when a group of particles are generated, interact, or share spatial proximity in a way such that the quantum state of each particle of the group cannot be described independently of the state of the others." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200" }
    ]
  },
  {
    title: "The Golden Age of Renaissance Art",
    category: "Art",
    content: "Exploring the masterpieces of Da Vinci, Michelangelo, and Raphael.",
    image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "The Renaissance was a fervent period of European cultural, artistic, political and economic 'rebirth' following the Middle Ages. Generally described as taking place from the 14th century to the 17th century, the Renaissance promoted the rediscovery of classical philosophy, literature and art.<br><br>Some of the greatest thinkers, authors, statesmen, scientists and artists in human history thrived during this era, while global exploration opened up new lands and cultures to European commerce." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1544413660-299165566b1d?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "<strong>Leonardo da Vinci:</strong> Often described as the archetype of the 'Renaissance Man', Leonardo's genius spanned painting, sculpture, architecture, and science. His 'Mona Lisa' and 'The Last Supper' remain among the most famous works of art in existence.<br><br><strong>Michelangelo:</strong> Known for his incredible sculptures like 'David' and the breathtaking frescoes on the ceiling of the Sistine Chapel. His work demonstrated an unprecedented level of emotional intensity and physical realism." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200" }
    ]
  },
  {
    title: "Deep Sea Exploration: Earth's Final Frontier",
    category: "Geography",
    content: "Discovering the mysterious creatures and landscapes of the ocean floor.",
    image_url: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "The deep sea remains one of the least explored environments on Earth. High pressure, freezing temperatures, and total darkness create a world that is as alien to us as the surface of another planet. Despite these extreme conditions, life thrives in the deep ocean, often in forms that defy our traditional understanding of biology.<br><br>Hydrothermal vents, for example, support entire ecosystems based on chemosynthesis rather than photosynthesis. Here, giant tube worms and ghost white crabs live around volcanic chimneys that spew mineral-rich water at intense temperatures." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1583212292354-0f4755813050?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "<strong>Bioluminescence:</strong> Over 90% of deep-sea creatures utilize bioluminescence—the ability to produce light through chemical reactions. They use this light to lure prey, find mates, or confuse predators in the pitch-black depths.<br><br>Exploration is made possible by sophisticated Submersibles and Remotely Operated Vehicles (ROVs), which are capable of withstanding the immense crushing pressure of the deep sea, sometimes exceeding 1,000 atmospheres at the bottom of the Mariana Trench." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1200" }
    ]
  },
  {
    title: "The Architecture of Modern Cities",
    category: "Art",
    content: "From skyscrapers to sustainable urban design.",
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "Modern architecture emerged at the turn of the 20th century as a response to industrialization and rapid urban growth. Leading with the principle that 'form follows function', architects began using new materials like steel, glass, and reinforced concrete to create structures that were both efficient and visually striking.<br><br>The Bauhaus movement in Germany and Le Corbusier in France were pioneers of this style, advocating for clean lines, geometric shapes, and the integration of indoor and outdoor spaces." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "<strong>Sustainability in Design:</strong> Today, modern architecture is increasingly focused on sustainability. Green buildings incorporate solar panels, rainwater harvesting systems, and natural ventilation to reduce their environmental footprint.<br><br>Vertical forests and skyscrapers with integrated wind turbines are no longer just concepts, but real projects aimed at bringing nature back into the concrete jungle and combating climate change in urban centers." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1449156001935-d25a892dd65c?auto=format&fit=crop&w=1200" }
    ]
  },
  {
    title: "Psychology: Understanding Human Behavior",
    category: "Biology",
    content: "Analyzing the mind, emotions, and social interactions.",
    image_url: "https://images.unsplash.com/photo-1551847677-4402664972bc?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "Psychology is the scientific study of the mind and behavior. It includes the study of conscious and unconscious phenomena, as well as feeling and thought. It is an academic discipline of immense scope, crossing the boundaries between the natural and social sciences.<br><br>Psychologists seek an understanding of the emergent properties of brains, linking the discipline to neuroscience. As a social science, psychologists aim to understand the behavior of individuals and groups." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "<strong>Cognitive Psychology:</strong> This branch focuses on mental processes such as attention, language use, memory, perception, problem solving, creativity, and thinking.<br><br><strong>Social Psychology:</strong> It examines how the thoughts, feelings, and behaviors of individuals are influenced by the actual, imagined, or implied presence of others. It covers topics like social influence, group behavior, and social perception." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&w=1200" }
    ]
  },
  {
    title: "Mars Colonization: Future of Humanity",
    category: "Physics",
    content: "The challenges and possibilities of becoming a multi-planetary species.",
    image_url: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "Mars colonization is the hypothetical permanent settlement of humans on the planet Mars. Many organizations, both public and private, have proposed plans for a permanent human mission to Mars. Mars is the focus of much scientific study about possible human colonization.<br><br>Its surface conditions and the presence of water on Mars make it arguably the most hospitable planet in the solar system, other than Earth. Mars requires less energy per unit mass to reach from Earth than any planet except Venus." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "<strong>Terraforming:</strong> This is the hypothetical process of deliberately modifying the atmosphere, temperature, surface topography or ecology of a planet to be similar to the environment of Earth to make it habitable by Earth-like life.<br><br>The challenges are immense: low gravity, radiation, thin atmosphere, and extreme cold. However, with advances in rocket technology (like SpaceX's Starship) and habitat design (using 3D printing with Martian soil), a permanent base on Mars is becoming a realistic goal for the coming decades." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200" }
    ]
  },
  {
    title: "The Industrial Revolution: A Global Pivot",
    category: "History",
    content: "How steam, coal, and machines transformed the world forever.",
    image_url: "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "The Industrial Revolution was the transition to new manufacturing processes in Great Britain, continental Europe, and the United States, in the period from about 1760 to sometime between 1820 and 1840. This transition included going from hand production methods to machines, new chemical manufacturing and iron production processes, and the increasing use of steam power and water power.<br><br>It was a major turning point in history, influencing almost every aspect of daily life. In particular, average income and population began to exhibit unprecedented sustained growth." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1463171339941-c4463fe36495?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "<strong>Technological Advancements:</strong> The development of the steam engine by James Watt was a defining moment. It allowed for powerful, portable energy that could drive factories and trains.<br><br>Urbanization followed, as thousands of people moved from rural areas to burgeoning cities in search of work in factories. While it brought economic growth, it also posed significant social challenges, including poor working conditions and environmental pollution." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200" }
    ]
  },
  {
    title: "Modern Cybersecurity: Protecting the Digital Realm",
    category: "Math",
    content: "Encryption, hackers, and the battle for data privacy.",
    image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "Computer security, cybersecurity, or information technology security is the protection of computer systems and networks from information disclosure, theft of or damage to their hardware, software, or electronic data, as well as from the disruption or misdirection of the services they provide.<br><br>The field is becoming increasingly significant due to the increased reliance on computer systems, the Internet, and wireless network standards such as Bluetooth and Wi-Fi, and due to the growth of 'smart' devices, including smartphones, televisions, and the various devices that constitute the 'Internet of things' (IoT)." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "<strong>Cryptography:</strong> The practice and study of techniques for secure communication in the presence of third parties. Modern cryptography is heavily based on mathematical theory and computer science practice; cryptographic algorithms are designed around computational hardness assumptions, making such algorithms hard to break in practice.<br><br>Threats like Phishing, Ransomware, and Zero-Day Exploits require constant vigilance and sophisticated defense mechanisms, including AI-driven anomaly detection and multi-factor authentication (MFA)." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1510511459019-5dee5926ff54?auto=format&fit=crop&w=1200" }
    ]
  },
  {
    title: "The Physics of Black Holes",
    category: "Physics",
    content: "Gravity, singularities, and the end of space-time.",
    image_url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "A black hole is a region of spacetime where gravity is so strong that nothing—no particles or even electromagnetic radiation such as light—can escape from it. The theory of general relativity predicts that a sufficiently compact mass can deform spacetime to form a black hole.<br><br>The boundary of the region from which no escape is possible is called the event horizon. Although the event horizon has an enormous effect on the fate and circumstances of an object crossing it, it has no locally detectable features." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "<strong>Spaghettification:</strong> In astrophysics, spaghettification is the vertical stretching and horizontal compression of objects into long thin shapes (rather like spaghetti) in a very strong non-homogeneous gravitational field; it is caused by extreme tidal forces.<br><br>The first ever image of a black hole was captured in 2019 by the Event Horizon Telescope (EHT), using a global network of radio telescopes. It revealed the silhouette of the supermassive black hole in the center of the Messier 87 galaxy." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200" }
    ]
  },
  {
    title: "Ancient Egypt: Civilization of the Nile",
    category: "History",
    content: "Pyramids, pharaohs, and thousands of years of human achievement.",
    image_url: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1200",
    content_blocks: [
      { id: '1', type: 'text', content: "Ancient Egypt was a civilization of ancient North Africa, concentrated along the lower reaches of the Nile River, situated in the place that is now the country Egypt. Ancient Egyptian civilization followed prehistoric Egypt and coalesced around 3100 BC with the political unification of Upper and Lower Egypt under Menes.<br><br>The success of ancient Egyptian civilization came partly from its ability to adapt to the conditions of the Nile River valley for agriculture. The predictable flooding and controlled irrigation of the fertile valley produced surplus crops, which supported a more dense population, and social development and culture." },
      { id: '2', type: 'image', content: "https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200" },
      { id: '3', type: 'text', content: "<strong>The Pyramids:</strong> The Great Pyramid of Giza is the oldest and largest of the three pyramids in the Giza pyramid complex. It is the oldest of the Seven Wonders of the Ancient World, and the only one to remain largely intact.<br><br>The civilization was characterized by its unique writing system (hieroglyphics), complex religious structures, and sophisticated administrative systems. The legacy of ancient Egypt remains in its monumental architecture, art, and the many artifacts discovered in tombs like that of Tutankhamun." },
      { id: '4', type: 'image', content: "https://images.unsplash.com/photo-1544413660-299165566b1d?auto=format&fit=crop&w=1200" }
    ]
  }
];

async function seedStandaloneLessons() {
  console.log('🚀 INITIALIZING STANDALONE LESSONS...');
  try {
    const { token, userId } = await authenticate();
    console.log(`Authenticated as ${userId}`);

    for (const lessonData of LESSONS_DATA) {
      console.log(`Seeding Lesson: ${lessonData.title}`);
      
      const [lesson] = await apiRequest('lessons', 'POST', {
        title: lessonData.title,
        category: lessonData.category,
        content: lessonData.content,
        content_blocks: lessonData.content_blocks,
        image_url: lessonData.image_url,
        user_id: userId,
        chapter_id: null // Standalone lesson for the list
      }, token);

      console.log(`   ✅ Created: ${lesson.title} (ID: ${lesson.id})`);
    }

    console.log('\n🌟 ALL 10 LESSONS SEEDED SUCCESSFULLY.');
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error.message);
  }
}

seedStandaloneLessons();
