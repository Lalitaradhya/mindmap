// Icon mapping for text-based icons from API
export const iconMap = {
  'gavel': '⚖️',
  'book': '📚',
  'scale': '⚖️',
  'law': '⚖️',
  'constitution': '📜',
  'parliament': '🏛️',
  'court': '🏛️',
  'judge': '👨‍⚖️',
  'justice': '⚖️',
  'amendment': '📝',
  'pencil': '✏️',
  'pen': '✒️',
  'document': '📄',
  'scroll': '📜',
  'building': '🏢',
  'government': '🏛️',
  'flag': '🇮🇳',
  'india': '🇮🇳',
  'world': '🌍',
  'globe': '🌍',
  'question': '❓',
  'lightbulb': '💡',
  'idea': '💡',
  'warning': '⚠️',
  'alert': '⚠️',
  'check': '✅',
  'cross': '❌',
  'star': '⭐',
  'heart': '❤️',
  'thumbsup': '👍',
  'gear': '⚙️',
  'settings': '⚙️',
  'clock': '🕐',
  'time': '🕐',
  'calendar': '📅',
  'date': '📅',
  'news': '📰',
  'newspaper': '📰',
  'chart': '📊',
  'graph': '📊',
  'money': '💰',
  'dollar': '💰',
  'users': '👥',
  'people': '👥',
  'group': '👥',
  'team': '👥',
  'lock': '🔒',
  'key': '🔑',
  'shield': '🛡️',
  'security': '🛡️',
  'search': '🔍',
  'magnify': '🔍',
  'eye': '👁️',
  'vision': '👁️',
  'target': '🎯',
  'goal': '🎯',
  'rocket': '🚀',
  'growth': '🚀',
  'handshake': '🤝',
  'agreement': '🤝',
  'balance': '⚖️',
  'scales': '⚖️',
  'hammer': '🔨',
  'tool': '🔧',
  'wrench': '🔧',
  'cog': '⚙️',
  'wheel': '⚙️',
  'default': '📌'
};

// Default primary branches for Democracy mind map
export const democracyPrimaryBranches = [
  {
    id: 'p-definition',
    title: 'Definition & Core Idea',
    icon: '📚',
    color: '#ff7043',
    items: [
      "Greek origin",
      '“Rule by the people”',
      "Lincoln’s definition",
    ],
  },
  {
    id: 'p-types',
    title: 'Types of Democracy',
    icon: '🏛️',
    color: '#66bb6a',
    items: [
      'Direct → Switzerland referendums',
      'Representative → India, USA',
      'Presidential vs Parliamentary',
    ],
  },
  {
    id: 'p-indian',
    title: 'Indian Context',
    icon: '🇮🇳',
    color: '#42a5f5',
    items: [
      'Articles 324–329 → Elections',
      'Features → Universal franchise, secular, federal',
      'Institutions → EC, Parliament, Judiciary',
    ],
  },
  {
    id: 'p-philosophy',
    title: 'Philosophical Foundations',
    icon: '🤔',
    color: '#ab47bc',
    items: [
      'Rousseau → General Will',
      'Locke → Social contract',
      'Ambedkar → Constitutional democracy',
    ],
  },
  {
    id: 'p-challenges',
    title: 'Challenges',
    icon: '⚠️',
    color: '#ef5350',
    items: [
      'Electoral malpractices',
      'Money & muscle power',
      'Corruption & dynastic politics',
    ],
  },
  {
    id: 'p-comparative',
    title: 'Comparative Aspects',
    icon: '⚖️',
    color: '#26c6da',
    items: [
      'Democracy vs Autocracy/Dictatorship',
      'Western vs Indian model',
      'Global Democracy Indices: EIU, Freedom House',
    ],
  },
  {
    id: 'p-current',
    title: 'Current Affairs Linkages',
    icon: '📰',
    color: '#ffca28',
    items: [
      "India’s rank in democracy indices",
      'Electoral reforms → VVPAT, electoral bonds debate',
      'RTI & citizen movements',
    ],
  },
  {
    id: 'p-upsc',
    title: 'UPSC Keywords',
    icon: '📝',
    color: '#8d6e63',
    items: [
      'Democratic consolidation',
      'Participatory governance',
      'Constitutional morality',
      'Inclusiveness',
    ],
  },
];

// Layout constants
export const PRIMARY_RADIUS = 250;
export const SECONDARY_OFFSET = 350;
export const SECONDARY_COLORS = ['#e8f5e8', '#f3e5f5', '#e3f2fd', '#fff3e0', '#fce4ec'];


export const chatAppFacts = [
    "🧠 Our Chat App - Supports 12 Indian languages for comfortable learning",
    "📚 Generates summaries from short (1-2 lines) to detailed explanations",
    "🎯 Our Chat App - Features adaptive quizzes that increase difficulty as you progress",
    "💡 Our Chat App - Uses gamification to make UPSC prep engaging and fun",
    "🌍 Our Chat App - Connects UPSC topics with real-world current affairs examples",
    "📊 Our Chat App - Tracks your learning progress and provides detailed feedback",
    "⚡  Our Chat App - Offers bite-sized learning for efficient study sessions",
    "🎮 Our Chat App - Interactive flash cards for better retention",
    "🔍 Active learning approach encourages critical thinking",
    "📝 Comprehensive coverage of History, Polity, Geography, and more",
    "🌟 Beginner-friendly explanations from basics to advanced levels",
    "🎯 One-stop platform for all UPSC preparation needs"
  ];

  // Animation keyframes (used by MainPage)
  import { keyframes } from '@mui/material/styles';

  export const pulse = keyframes`
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.7;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    `;

  export const float = keyframes`
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    `;

  export const shimmer = keyframes`
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    `;

  export const fadeIn = keyframes`
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    `;

  export const rotate = keyframes`
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    `;