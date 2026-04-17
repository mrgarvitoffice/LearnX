
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  Newspaper,
  Bot,
  TestTubeDiagonal,
  BookMarked,
  UserCircle,
  Home,
  NotebookText,
  Code2,
  CalendarClock,
  GraduationCap,
  Youtube,
  HeartPulse,
  Atom,
  Book,
  Landmark,
  PenSquare,
  Trophy,
  Building,
  Briefcase,
  AreaChart,
  School,
  BookOpen,
  Lightbulb,
  Brain
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  label?: string;
  disabled?: boolean;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { title: 'sidebar.dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'sidebar.planner', href: '/scheduler', icon: CalendarClock, label: 'NEW' },
  { title: 'sidebar.aiChat', href: '/chatbot', icon: Bot, label: 'AI' },
  { title: 'sidebar.generateNotes', href: '/notes', icon: FileText, label: 'AI' },
  { title: 'sidebar.coding', href: '/coding', icon: Code2, label: 'BETA' },
  { title: 'sidebar.customTest', href: '/custom-test', icon: TestTubeDiagonal },
  { title: 'sidebar.dailyNews', href: '/news', icon: Newspaper },
  { title: 'sidebar.library', href: '/library', icon: BookMarked },
  { title: 'sidebar.profile', href: '/profile', icon: UserCircle },
];

export const TOP_NAV_ITEMS: NavItem[] = [
  { title: 'sidebar.aiChat', href: '/chatbot', icon: Bot },
  { title: 'sidebar.dailyNews', href: '/news', icon: Newspaper },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { title: 'bottombar.home', href: '/dashboard', icon: Home },
  { title: 'sidebar.planner', href: '/scheduler', icon: CalendarClock },
  { title: 'bottombar.generate', href: '/notes', icon: NotebookText },
  { title: 'bottombar.test', href: '/custom-test', icon: TestTubeDiagonal },
  { title: 'sidebar.profile', href: '/profile', icon: UserCircle },
];

export const APP_NAME = "LearnX";

export const GOAL_CARDS_DATA = [
    { type: 'neet', icon: HeartPulse, title: 'NEET', description: 'Class 11 | Class 12 | Class 12+', location: 'in' },
    { type: 'jee', icon: Atom, title: 'IIT JEE', description: 'Class 11 | Class 12 | Class 12+', location: 'in' },
    { type: 'school-boards', icon: Book, title: 'School Boards (Class 9 to 12)', description: 'CBSE | ICSE | International Boards', location: 'global' },
    { type: 'ias', icon: Landmark, title: 'IAS Prep', description: 'UPSC | State PSC', location: 'in' },
    { type: 'school-prep', icon: PenSquare, title: 'School Preparation (Class 3 to 8)', description: 'CBSE | ICSE | International Boards', location: 'global' },
    { type: 'olympiad', icon: Trophy, title: 'Olympiad', description: 'Government Olympiad | Private Olympiad', location: 'global' },
    { type: 'govt-exams', icon: Building, title: 'Govt. Exams', description: 'SSC | Banking | Teaching | Railway', location: 'in' },
    { type: 'entrance-exam', icon: GraduationCap, title: 'UG & PG Entrance', description: 'MBA | CLAT | CUET | NIFT', location: 'global' },
    { type: 'gate', icon: Briefcase, title: 'GATE & Engineering', description: 'All engineering disciplines', location: 'global' },
    { type: 'finance', icon: AreaChart, title: 'Finance Course', description: 'CA | CS | CMA', location: 'global' },
    { type: 'college', icon: School, title: 'LearnX College', description: 'Curated notes for specific university syllabi.', location: 'global' },
    { type: 'general', icon: UserCircle, title: 'General Learner', description: 'Explore any topic at your own pace.', location: 'global' },
];

export const APP_LANGUAGES = [
  { value: "en", label: "English", bcp47: "en-US", englishName: "English" },
  { value: "hi", label: "हिन्दी", bcp47: "hi-IN", englishName: "Hindi" },
  { value: "ja", label: "日本語", bcp47: "ja-JP", englishName: "Japanese" },
  { value: "es", label: "Español", bcp47: "es-ES", englishName: "Spanish" },
];

export const OTHER_RESOURCES = [
  { title: "library.resources.wikidata", description: "library.resources.wikidataDesc", link: "https://www.wikidata.org/", icon: BookOpen },
  { title: "library.resources.ck12", description: "library.resources.ck12Desc", link: "https://www.ck12.org/", icon: Lightbulb },
  { title: "library.resources.gutenberg", description: "library.resources.gutenbergDesc", link: "https://www.gutenberg.org/", icon: Brain },
];

export const COLLEGE_RESOURCES = [
    { title: "college.resources.rgpvNotes", description: "college.resources.rgpvNotesDesc", link: "https://www.rgpvnotes.in/", icon: GraduationCap },
    { title: "college.resources.ncert", description: "college.resources.ncertDesc", link: "https://ncert.nic.in/", icon: GraduationCap },
    { title: "college.resources.nptel", description: "college.resources.nptelDesc", link: "/library?feature=youtube&query=NPTEL", icon: Youtube },
    { title: "college.resources.replit", description: "college.resources.replitDesc", link: "https://replit.com/", icon: Code2 },
];

export const MATH_FACTS_EN = [
  "The number 0 is the only number that cannot be represented by Roman numerals.",
  "Pi (π) is an irrational number, its decimal never ends or repeats.",
  "The Fibonacci sequence is found in sunflower seed arrangements.",
  "The sum of angles in any triangle is always 180 degrees.",
];

export const MOTIVATIONAL_QUOTES_EN = [
  { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { quote: "Success is not final, failure is not fatal.", author: "Winston Churchill" },
  { quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { quote: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
];

export const NEWS_CATEGORIES = [
  { value: "top", label: "Top Headlines" },
  { value: "business", label: "Business" },
  { value: "technology", label: "Technology" },
  { value: "sports", label: "Sports" },
  { value: "science", label: "Science" },
];

export const NEWS_COUNTRIES: { value: string; label: string }[] = [
    { value: "us", label: "United States" },
    { value: "gb", label: "United Kingdom" },
    { value: "in", label: "India" },
    { value: "ca", label: "Canada" },
    { value: "au", label: "Australia" },
];

export const COUNTRY_SPECIFIC_REGIONS: Record<string, { value: string; label: string }[]> = {
  'in': [
      { value: "Madhya Pradesh", label: "Madhya Pradesh" },
      { value: "Maharashtra", label: "Maharashtra" },
      { value: "Delhi", label: "Delhi" },
      { value: "Karnataka", label: "Karnataka" },
  ]
};

export const DEFINITION_CHALLENGE_WORDS = [
  { term: "Photosynthesis", definition: "The process by which green plants use sunlight to create food.", hint: "Essential for plant life." },
  { term: "Algorithm", definition: "A step-by-step procedure for solving a problem.", hint: "Foundational to computer science." },
];

export const COLLEGE_DATA: Record<string, any> = {
  "RGPV": {
    name: "Rajiv Gandhi Proudyogiki Vishwavidyalaya",
    programs: {
      "B.Tech": {
        name: "Bachelor of Technology",
        branches: {
          "CSE": {
            name: "Computer Science and Engineering",
            semesters: {
              "1": { name: "1st", subjects: [] },
              "2": { name: "2nd", subjects: [] },
              "3": { name: "3rd", subjects: [] },
              "4": { 
                name: "4th", 
                subjects: [
                  { id: "cs402", name: "Analysis & Design of Algorithms", description: "Algorithm fundamentals, sorting, searching, and complexity." },
                  { id: "cs403", name: "Operating Systems", description: "Process management, memory management, and file systems." },
                  { id: "cs404", name: "Software Engineering", description: "SDLC, agile, testing, and maintenance." },
                  { id: "cs405", name: "Discrete Structures", description: "Set theory, logic, and graph theory." }
                ] 
              }
            }
          }
        }
      }
    }
  }
};
