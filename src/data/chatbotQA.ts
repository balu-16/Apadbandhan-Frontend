// Chatbot Q&A Data for Apadbandhav
// This file contains pre-stored questions and answers for the AI chatbot

export interface QAItem {
  id: number;
  question: string;
  keywords: string[];
  answer: string;
  category: 'general' | 'features' | 'account' | 'devices' | 'alerts' | 'sos' | 'admin' | 'partner' | 'technical' | 'safety';
}

// Greeting patterns to detect
export const greetingPatterns = [
  'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening',
  'howdy', 'greetings', 'hii', 'hiii', 'helloo', 'hellooo', 'yo', 'sup',
  'what\'s up', 'whats up', 'how are you', 'namaste', 'namaskar'
];

// Greeting responses
export const greetingResponses = [
  "Hello! I'm Apadbandhav AI, your safety assistant. How can I help you today?",
  "Hi there! Welcome to Apadbandhav. I'm here to answer any questions about our emergency safety system.",
  "Greetings! I'm your Apadbandhav assistant. Feel free to ask me anything about our accident detection and rescue services.",
  "Hello! I'm here to help you with any questions about Apadbandhav's safety features. What would you like to know?"
];

// Suggested questions to show initially
export const suggestedQuestions = [
  "What is Apadbandhav?",
  "How does accident detection work?",
  "How do I add a device?",
  "What happens during an SOS alert?",
  "How do I become a partner?"
];

// Main Q&A database
export const qaDatabase: QAItem[] = [
  // General Questions (1-10)
  {
    id: 1,
    question: "What is Apadbandhav?",
    keywords: ['what', 'apadbandhav', 'about', 'introduction', 'explain'],
    answer: "Apadbandhav is an AIoT-powered emergency safety system that automatically detects vehicle accidents and dispatches rescue services. Using advanced sensors, we ensure immediate response when accidents occur, potentially saving lives during the critical 'golden hour'.",
    category: 'general'
  },
  {
    id: 2,
    question: "How does Apadbandhav work?",
    keywords: ['how', 'work', 'function', 'operate', 'process'],
    answer: "Apadbandhav works through vehicle-mounted AIoT devices with advanced sensors that auto-detect collisions. When an accident is detected, the system instantly transmits distress signals with precise GPS location to emergency services including nearby hospitals and police stations.",
    category: 'general'
  },
  {
    id: 3,
    question: "What does Apadbandhav mean?",
    keywords: ['mean', 'meaning', 'name', 'translate', 'stands for'],
    answer: "Apadbandhav (आपदबंधव) is a Hindi word meaning 'Friend in Distress' or 'Companion in Emergency'. The name reflects our mission to be your reliable partner during emergencies and accidents.",
    category: 'general'
  },
  {
    id: 4,
    question: "Is Apadbandhav free to use?",
    keywords: ['free', 'cost', 'price', 'pricing', 'charge', 'fee', 'subscription'],
    answer: "Apadbandhav offers different plans. The basic safety features are available with device purchase. Please contact our team or visit the dashboard for detailed pricing information on premium features and subscription plans.",
    category: 'general'
  },
  {
    id: 5,
    question: "Which vehicles are compatible with Apadbandhav?",
    keywords: ['vehicle', 'compatible', 'car', 'bike', 'motorcycle', 'truck', 'support'],
    answer: "Apadbandhav devices are compatible with all types of vehicles including cars, motorcycles, trucks, buses, and commercial vehicles. Our sensors are designed to work with any motorized vehicle.",
    category: 'general'
  },
  {
    id: 6,
    question: "Where is Apadbandhav available?",
    keywords: ['where', 'available', 'location', 'city', 'country', 'region', 'service area'],
    answer: "Apadbandhav is currently operational in India. We're continuously expanding our network of partner hospitals and police stations. Check the dashboard for service availability in your specific area.",
    category: 'general'
  },
  {
    id: 7,
    question: "How fast is the emergency response?",
    keywords: ['fast', 'response', 'time', 'quick', 'speed', 'seconds'],
    answer: "Apadbandhav's response time is less than 3 seconds from accident detection to alert dispatch. Emergency services are notified instantly with your precise location, ensuring the fastest possible rescue response.",
    category: 'general'
  },
  {
    id: 8,
    question: "Can I contact customer support?",
    keywords: ['contact', 'support', 'help', 'customer', 'service', 'reach', 'call'],
    answer: "Yes! You can reach our customer support through the Settings page in your dashboard. We're available to help with device setup, technical issues, and any questions about our services.",
    category: 'general'
  },
  {
    id: 9,
    question: "What is the golden hour?",
    keywords: ['golden hour', 'critical', 'time', 'medical', 'emergency'],
    answer: "The 'Golden Hour' refers to the first 60 minutes after a traumatic injury. Medical care received during this time significantly increases survival rates. Apadbandhav ensures emergency services are dispatched within seconds to maximize chances of rescue during this critical period.",
    category: 'general'
  },
  {
    id: 10,
    question: "Is my data secure with Apadbandhav?",
    keywords: ['data', 'secure', 'security', 'privacy', 'safe', 'encrypted', 'protection'],
    answer: "Yes, your data is completely secure. Apadbandhav uses end-to-end encryption for all transmissions. Your personal information and location data are protected with enterprise-grade security protocols and are only shared with emergency services during actual emergencies.",
    category: 'safety'
  },

  // Feature Questions (11-20)
  {
    id: 11,
    question: "What features does the dashboard have?",
    keywords: ['dashboard', 'features', 'capabilities', 'functions', 'options'],
    answer: "The user dashboard includes: Device Management (add/view devices), Real-time Location Tracking, Alert History, SOS Trigger, Emergency Contacts Management, Profile Settings, and Device Sharing with family members.",
    category: 'features'
  },
  {
    id: 12,
    question: "Can I track my device location?",
    keywords: ['track', 'location', 'gps', 'find', 'locate', 'where'],
    answer: "Yes! You can track your device's real-time location from the dashboard. The Devices section shows live GPS coordinates, movement history, and current status of all your registered devices.",
    category: 'features'
  },
  {
    id: 13,
    question: "What is device sharing?",
    keywords: ['device', 'sharing', 'share', 'family', 'access'],
    answer: "Device Sharing allows you to share access to your devices with family members or trusted contacts. They can view device location and receive alerts without needing to own the device. This is useful for family safety monitoring.",
    category: 'features'
  },
  {
    id: 14,
    question: "Can I add emergency contacts?",
    keywords: ['emergency', 'contacts', 'add', 'family', 'notify', 'call'],
    answer: "Yes! You can add multiple emergency contacts in your profile settings. These contacts will be automatically notified when an accident is detected or when you trigger an SOS alert. You can add their name, phone number, and relationship.",
    category: 'features'
  },
  {
    id: 15,
    question: "Does Apadbandhav work without internet?",
    keywords: ['internet', 'offline', 'network', 'connection', 'without', 'no internet'],
    answer: "Apadbandhav devices use cellular connectivity (SIM-based) to transmit alerts. As long as there's mobile network coverage, alerts will be sent. The device stores data locally if temporarily offline and syncs when connection is restored.",
    category: 'technical'
  },
  {
    id: 16,
    question: "What sensors does the device have?",
    keywords: ['sensor', 'sensors', 'accelerometer', 'gyroscope', 'detect'],
    answer: "Apadbandhav devices include: Accelerometer for impact detection, Gyroscope for rollover detection, GPS for precise location, and Cellular module for instant communication. These work together to accurately detect accidents and minimize false alerts.",
    category: 'technical'
  },
  {
    id: 17,
    question: "Can I view my alert history?",
    keywords: ['alert', 'history', 'past', 'previous', 'log', 'record'],
    answer: "Yes! The Alerts section in your dashboard shows complete history of all alerts including SOS triggers, accident detections, and their resolution status. You can view details, timestamps, and responder information for each alert.",
    category: 'features'
  },
  {
    id: 18,
    question: "How do I update my profile?",
    keywords: ['update', 'profile', 'edit', 'change', 'modify', 'settings'],
    answer: "Go to Dashboard → Settings to update your profile. You can modify your name, email, blood group, medical conditions, address, hospital preference, and notification settings. Keeping your profile updated helps emergency services assist you better.",
    category: 'account'
  },
  {
    id: 19,
    question: "What is hospital preference?",
    keywords: ['hospital', 'preference', 'government', 'private', 'both'],
    answer: "Hospital Preference lets you choose which type of hospital you prefer during emergencies: Government, Private, or Both. During an emergency, nearby hospitals matching your preference will be notified first.",
    category: 'features'
  },
  {
    id: 20,
    question: "Can I receive SMS notifications?",
    keywords: ['sms', 'notification', 'text', 'message', 'notify'],
    answer: "Yes! Enable SMS notifications in your Settings to receive text alerts for emergencies. This ensures you're notified even if you don't have the app open. You can also enable push notifications for real-time updates.",
    category: 'features'
  },

  // Account Questions (21-27)
  {
    id: 21,
    question: "How do I sign up?",
    keywords: ['sign up', 'signup', 'register', 'create account', 'join'],
    answer: "Click 'Get Started' on the homepage, enter your phone number to receive an OTP, verify the OTP, and complete your profile with name, email, and other details. That's it - you're registered!",
    category: 'account'
  },
  {
    id: 22,
    question: "How do I login?",
    keywords: ['login', 'log in', 'sign in', 'access', 'enter'],
    answer: "Click 'Login' on the homepage, enter your registered phone number, receive and verify the OTP sent to your phone, and you'll be logged into your dashboard. No password needed - we use secure OTP authentication.",
    category: 'account'
  },
  {
    id: 23,
    question: "I forgot my account details, what should I do?",
    keywords: ['forgot', 'password', 'reset', 'recover', 'lost', 'account'],
    answer: "Apadbandhav uses phone-based OTP authentication, so there's no password to forget! Simply login with your registered phone number and verify with the OTP sent to your phone. If you've changed your number, contact customer support.",
    category: 'account'
  },
  {
    id: 24,
    question: "How do I delete my account?",
    keywords: ['delete', 'account', 'remove', 'deactivate', 'close'],
    answer: "To delete your account, go to Dashboard → Settings → scroll to the bottom and click 'Delete Account'. Please note this action is irreversible and will remove all your data, devices, and history from our system.",
    category: 'account'
  },
  {
    id: 25,
    question: "Can I change my phone number?",
    keywords: ['change', 'phone', 'number', 'update', 'mobile'],
    answer: "Currently, phone number change requires contacting customer support for verification. This security measure protects your account. Go to Settings and reach out to support with your request.",
    category: 'account'
  },
  {
    id: 26,
    question: "How do I upload a profile photo?",
    keywords: ['upload', 'photo', 'picture', 'image', 'profile picture', 'avatar'],
    answer: "Go to Dashboard → Settings, click on the camera icon on your profile picture, select an image from your device, and save. Your profile photo helps emergency responders identify you if needed.",
    category: 'account'
  },
  {
    id: 27,
    question: "What medical information should I add?",
    keywords: ['medical', 'information', 'health', 'blood group', 'conditions'],
    answer: "We recommend adding: Blood Group (critical for emergencies), Medical Conditions (allergies, diabetes, heart conditions, etc.), and any medications you take. This information is shared with hospitals during emergencies to provide appropriate care.",
    category: 'account'
  },

  // Device Questions (28-35)
  {
    id: 28,
    question: "How do I add a device?",
    keywords: ['add', 'device', 'register', 'new device', 'setup'],
    answer: "Go to Dashboard → Add Device, scan the QR code on your Apadbandhav device or enter the device code manually. Give your device a name (like 'My Car') and it will be registered to your account.",
    category: 'devices'
  },
  {
    id: 29,
    question: "How many devices can I add?",
    keywords: ['many', 'devices', 'limit', 'maximum', 'multiple'],
    answer: "You can add multiple devices to your account - one for each of your vehicles. There's no strict limit, allowing you to protect your entire fleet or family vehicles under one account.",
    category: 'devices'
  },
  {
    id: 30,
    question: "What does device status mean?",
    keywords: ['device', 'status', 'online', 'offline', 'maintenance'],
    answer: "Device status indicates: 'Online' means the device is active and transmitting, 'Offline' means it's powered off or out of network range, 'Maintenance' means it needs attention or is being serviced.",
    category: 'devices'
  },
  {
    id: 31,
    question: "How do I remove a device?",
    keywords: ['remove', 'delete', 'device', 'unregister', 'disconnect'],
    answer: "Go to Dashboard → Devices → select the device → Device Details → scroll down and click 'Remove Device'. This will unlink the device from your account. The device can then be registered by another user.",
    category: 'devices'
  },
  {
    id: 32,
    question: "My device shows offline, what should I do?",
    keywords: ['offline', 'not working', 'disconnected', 'problem', 'issue'],
    answer: "If your device is offline: 1) Check if the device has power, 2) Ensure it's in an area with mobile network coverage, 3) Try restarting the device, 4) Check if the SIM card is properly inserted. If issues persist, contact support.",
    category: 'devices'
  },
  {
    id: 33,
    question: "How do I install the device in my vehicle?",
    keywords: ['install', 'installation', 'mount', 'fit', 'setup', 'vehicle'],
    answer: "Apadbandhav devices should be securely mounted inside your vehicle, ideally near the dashboard or center console. Follow the installation guide included with your device. For best results, ensure the device has a clear view for GPS signals.",
    category: 'devices'
  },
  {
    id: 34,
    question: "What is a device code?",
    keywords: ['device code', 'code', 'qr', 'serial', 'number'],
    answer: "The device code is a unique identifier printed on your Apadbandhav device and its QR code. You need this code to register the device to your account. It looks like 'AB-XXXX-XXXX'.",
    category: 'devices'
  },
  {
    id: 35,
    question: "Can I rename my device?",
    keywords: ['rename', 'name', 'device', 'change name', 'edit'],
    answer: "Yes! Go to Dashboard → Devices → select the device → click on 'Edit' or the settings icon to change the device name. Use descriptive names like 'Family Car' or 'Work Bike' for easy identification.",
    category: 'devices'
  },

  // Alert & SOS Questions (36-43)
  {
    id: 36,
    question: "What happens during an SOS alert?",
    keywords: ['sos', 'alert', 'emergency', 'trigger', 'happen'],
    answer: "When SOS is triggered: 1) Your precise location is captured, 2) Nearby hospitals and police are instantly notified, 3) Your emergency contacts receive alerts, 4) Responders can see your profile and medical info, 5) You can track who's responding in real-time.",
    category: 'sos'
  },
  {
    id: 37,
    question: "How do I trigger an SOS manually?",
    keywords: ['trigger', 'sos', 'manual', 'press', 'button', 'activate'],
    answer: "From your Dashboard home, click the 'SOS' button. Confirm the action when prompted. This immediately sends an emergency alert with your location to nearby responders and your emergency contacts.",
    category: 'sos'
  },
  {
    id: 38,
    question: "Can I cancel a false alert?",
    keywords: ['cancel', 'false', 'alert', 'mistake', 'accidental', 'stop'],
    answer: "Yes, you can resolve/cancel an alert from your Alerts page if it was triggered by mistake. Select the alert and choose 'Resolve' with notes explaining it was a false alarm. However, please use SOS responsibly as emergency services are real people.",
    category: 'alerts'
  },
  {
    id: 39,
    question: "What information do responders see?",
    keywords: ['responder', 'see', 'information', 'view', 'access', 'police', 'hospital'],
    answer: "Responders see: Your name, phone number, precise GPS location, blood group, medical conditions, emergency contacts, and vehicle details. This helps them prepare appropriate assistance before arriving.",
    category: 'alerts'
  },
  {
    id: 40,
    question: "How does automatic accident detection work?",
    keywords: ['automatic', 'accident', 'detection', 'auto', 'detect', 'collision'],
    answer: "Our AIoT sensors continuously monitor for sudden impact, rapid deceleration, and vehicle rollovers. When collision patterns are detected, the device automatically triggers an alert without any manual action needed.",
    category: 'sos'
  },
  {
    id: 41,
    question: "Will I get notified when responders are coming?",
    keywords: ['notify', 'responder', 'coming', 'response', 'update', 'status'],
    answer: "Yes! You receive real-time updates when police or hospital staff respond to your alert. You can see who's responding, their estimated arrival time, and track their approach on the map.",
    category: 'alerts'
  },
  {
    id: 42,
    question: "What types of alerts are there?",
    keywords: ['types', 'alert', 'kind', 'category', 'different'],
    answer: "Apadbandhav handles two types of alerts: 1) Automatic Alerts - triggered by device sensors detecting accidents, 2) Manual SOS - triggered by you in any emergency situation. Both follow the same dispatch process.",
    category: 'alerts'
  },
  {
    id: 43,
    question: "How can I view alert details?",
    keywords: ['view', 'alert', 'details', 'info', 'information'],
    answer: "Go to Dashboard → Alerts to see all your alerts. Click on any alert to view complete details including timestamp, location, responders, status updates, and resolution notes.",
    category: 'alerts'
  },

  // Partner & Admin Questions (44-50)
  {
    id: 44,
    question: "How do I become a partner?",
    keywords: ['become', 'partner', 'join', 'hospital', 'police', 'collaborate'],
    answer: "Hospitals, Police Stations, and Rescue Rangers can partner with Apadbandhav. Click 'Become a Partner' on the homepage, fill out the application form with your organization details, and our team will review and contact you.",
    category: 'partner'
  },
  {
    id: 45,
    question: "What are the benefits of being a partner?",
    keywords: ['benefit', 'partner', 'advantage', 'why', 'join'],
    answer: "Partners receive: Real-time accident alerts in their area, User information for faster response, Dashboard for managing alerts, On-duty status management, and direct connection to accident victims needing immediate help.",
    category: 'partner'
  },
  {
    id: 46,
    question: "What is the Police portal?",
    keywords: ['police', 'portal', 'dashboard', 'station'],
    answer: "The Police Portal is a dedicated dashboard for police partners to: View active alerts in their jurisdiction, Access victim information, Update alert status (responding, resolved), and Track other responders coordinating on emergencies.",
    category: 'admin'
  },
  {
    id: 47,
    question: "What is the Hospital portal?",
    keywords: ['hospital', 'portal', 'dashboard', 'medical'],
    answer: "The Hospital Portal allows hospital partners to: Receive alerts for nearby accidents, View patient medical info before arrival, Prepare emergency resources, Update response status, and Coordinate with police and ambulance services.",
    category: 'admin'
  },
  {
    id: 48,
    question: "What is On-Duty status?",
    keywords: ['on-duty', 'duty', 'status', 'available', 'active'],
    answer: "On-Duty status is for police and hospital responders. When 'On Duty', they receive emergency alerts in real-time. When 'Off Duty', alerts are not pushed to them. This ensures alerts reach available responders only.",
    category: 'partner'
  },
  {
    id: 49,
    question: "How does location tracking work for responders?",
    keywords: ['location', 'tracking', 'responder', 'police', 'hospital', 'gps'],
    answer: "When On-Duty, responders share their location so the system can route alerts to the nearest available units. This ensures the closest police or hospital staff respond to emergencies for faster rescue times.",
    category: 'partner'
  },
  {
    id: 50,
    question: "Can I see analytics and statistics?",
    keywords: ['analytics', 'statistics', 'stats', 'data', 'reports', 'numbers'],
    answer: "Yes! The dashboard shows key statistics: Total devices registered, Active alerts, Alert history, Response times, and more. Partners get additional analytics about their response performance and coverage area.",
    category: 'admin'
  },

  // Additional Technical & Safety Questions (51-55)
  {
    id: 51,
    question: "How accurate is the GPS location?",
    keywords: ['accurate', 'gps', 'location', 'precision', 'exact'],
    answer: "Apadbandhav uses high-precision GPS with accuracy typically within 5-10 meters. This ensures responders can locate you precisely, even in areas without clear addresses.",
    category: 'technical'
  },
  {
    id: 52,
    question: "Does the device need charging?",
    keywords: ['charge', 'battery', 'power', 'charging', 'electricity'],
    answer: "Apadbandhav devices connect to your vehicle's power supply (12V) and don't require separate charging. They automatically power on when the vehicle starts and have backup power for emergencies.",
    category: 'devices'
  },
  {
    id: 53,
    question: "What happens if there's no network?",
    keywords: ['network', 'no signal', 'coverage', 'dead zone'],
    answer: "If network is temporarily unavailable, the device stores the alert data locally and transmits it as soon as network is restored. We use multiple network bands to maximize coverage in remote areas.",
    category: 'technical'
  },
  {
    id: 54,
    question: "Are false alerts common?",
    keywords: ['false', 'alert', 'common', 'frequent', 'mistake', 'wrong'],
    answer: "No, our advanced AI algorithms analyze multiple sensor inputs to minimize false positives. The system distinguishes between actual accidents and normal driving situations like speed bumps or sudden braking.",
    category: 'safety'
  },
  {
    id: 55,
    question: "Can I use Apadbandhav for road trips?",
    keywords: ['road trip', 'travel', 'journey', 'long drive', 'highway'],
    answer: "Absolutely! Apadbandhav is perfect for road trips. It works across our service network, providing protection throughout your journey. Your family can track your trip progress from the shared device access.",
    category: 'general'
  }
];

// Function to find best matching answer
export function findAnswer(query: string): { answer: string; confidence: number } | null {
  const normalizedQuery = query.toLowerCase().trim();
  
  // Check for greetings first
  const isGreeting = greetingPatterns.some(pattern => 
    normalizedQuery.includes(pattern) || normalizedQuery === pattern
  );
  
  if (isGreeting && normalizedQuery.split(' ').length <= 5) {
    const randomGreeting = greetingResponses[Math.floor(Math.random() * greetingResponses.length)];
    return { answer: randomGreeting, confidence: 1 };
  }
  
  // Score each Q&A item
  let bestMatch: { item: QAItem; score: number } | null = null;
  
  for (const qa of qaDatabase) {
    let score = 0;
    
    // Check keyword matches
    for (const keyword of qa.keywords) {
      if (normalizedQuery.includes(keyword.toLowerCase())) {
        score += 2;
      }
    }
    
    // Check question similarity (word overlap)
    const queryWords = normalizedQuery.split(/\s+/);
    const questionWords = qa.question.toLowerCase().split(/\s+/);
    
    for (const word of queryWords) {
      if (word.length > 2 && questionWords.includes(word)) {
        score += 1;
      }
    }
    
    // Exact question match bonus
    if (normalizedQuery === qa.question.toLowerCase()) {
      score += 10;
    }
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { item: qa, score };
    }
  }
  
  if (bestMatch && bestMatch.score >= 2) {
    const confidence = Math.min(bestMatch.score / 10, 1);
    return { answer: bestMatch.item.answer, confidence };
  }
  
  return null;
}

// Default response when no match found
export const defaultResponse = "I'm sorry, I couldn't find an answer to that specific question. You can try rephrasing or ask about topics like: devices, alerts, SOS, account settings, or becoming a partner. For immediate assistance, please contact our support team through the Settings page.";
