export type Patient = {
  id: string;
  name: string;
  age: number;
  stage: "Early" | "Moderate" | "Advanced";
  caregiver: string;
  lastActive: string;
  memoryCount: number;
  initials: string;
};

export type Memory = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: "Family" | "Travel" | "Career" | "Music" | "Childhood" | "Milestone";
  people: string[];
  location?: string;
  hasPhoto: boolean;
  hasAudio: boolean;
  patientId: string;
};

export type TimelineEvent = {
  id: string;
  time: string;
  type: "recall" | "reminder" | "session" | "note";
  title: string;
  description: string;
  patient: string;
};

export const patients: Patient[] = [
  {
    id: "p1",
    name: "Margaret Chen",
    age: 78,
    stage: "Early",
    caregiver: "Amelia Chen",
    lastActive: "2h ago",
    memoryCount: 142,
    initials: "MC",
  },
  {
    id: "p2",
    name: "Robert Alvarez",
    age: 82,
    stage: "Moderate",
    caregiver: "David Alvarez",
    lastActive: "Yesterday",
    memoryCount: 87,
    initials: "RA",
  },
  {
    id: "p3",
    name: "Eleanor Whitfield",
    age: 74,
    stage: "Early",
    caregiver: "Sarah Whitfield",
    lastActive: "10m ago",
    memoryCount: 216,
    initials: "EW",
  },
  {
    id: "p4",
    name: "James O'Connor",
    age: 85,
    stage: "Advanced",
    caregiver: "Mary O'Connor",
    lastActive: "3d ago",
    memoryCount: 54,
    initials: "JO",
  },
];

export const memories: Memory[] = [
  {
    id: "m1",
    title: "Summer at Lake Como",
    description:
      "Family vacation with the grandchildren. Rowing on the lake at sunset, gelato in the town square.",
    date: "August 1998",
    category: "Travel",
    people: ["Amelia", "Thomas", "Grace"],
    location: "Lake Como, Italy",
    hasPhoto: true,
    hasAudio: true,
    patientId: "p1",
  },
  {
    id: "m2",
    title: "Wedding day",
    description: "Marrying David at St. Mary's chapel. It rained in the morning and cleared by noon.",
    date: "June 12, 1968",
    category: "Milestone",
    people: ["David"],
    location: "Boston, MA",
    hasPhoto: true,
    hasAudio: false,
    patientId: "p1",
  },
  {
    id: "m3",
    title: "First piano recital",
    description: "Playing Clair de Lune at age nine. Mother in the front row.",
    date: "1954",
    category: "Childhood",
    people: ["Mother"],
    hasPhoto: false,
    hasAudio: true,
    patientId: "p1",
  },
  {
    id: "m4",
    title: "Thanksgiving 2004",
    description: "The whole family gathered. Robert carved the turkey and told stories about his father.",
    date: "November 2004",
    category: "Family",
    people: ["Robert", "David", "Amelia"],
    location: "Home",
    hasPhoto: true,
    hasAudio: false,
    patientId: "p1",
  },
  {
    id: "m5",
    title: "Retirement from the hospital",
    description: "Forty-two years as a pediatric nurse. Colleagues gathered in the atrium.",
    date: "May 2010",
    category: "Career",
    people: ["Dr. Halbrook"],
    hasPhoto: true,
    hasAudio: false,
    patientId: "p1",
  },
  {
    id: "m6",
    title: "Dancing to Ella Fitzgerald",
    description: "Living room dances on Sunday afternoons. 'Cheek to Cheek' was our song.",
    date: "1970s",
    category: "Music",
    people: ["David"],
    hasPhoto: false,
    hasAudio: true,
    patientId: "p1",
  },
];

export const timelineEvents: TimelineEvent[] = [
  {
    id: "t1",
    time: "9:12 AM",
    type: "recall",
    title: "Recognized 'Lake Como' memory",
    description: "Margaret smiled and mentioned Amelia by name during the recall session.",
    patient: "Margaret Chen",
  },
  {
    id: "t2",
    time: "10:30 AM",
    type: "reminder",
    title: "Medication reminder acknowledged",
    description: "Donepezil, 10mg — confirmed by caregiver.",
    patient: "Margaret Chen",
  },
  {
    id: "t3",
    time: "12:45 PM",
    type: "session",
    title: "Guided reminiscence — Career",
    description: "Twelve minute session with three prompts. Positive engagement.",
    patient: "Margaret Chen",
  },
  {
    id: "t4",
    time: "3:20 PM",
    type: "note",
    title: "Caregiver note added",
    description: "Amelia noted improved mood after listening to Ella Fitzgerald playlist.",
    patient: "Margaret Chen",
  },
  {
    id: "t5",
    time: "5:00 PM",
    type: "recall",
    title: "Partial recall — Wedding day",
    description: "Remembered the chapel, needed a prompt for the date.",
    patient: "Margaret Chen",
  },
];
