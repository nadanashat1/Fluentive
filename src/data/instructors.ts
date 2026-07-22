import type { Instructor, InstructorActivity, InstructorCourse } from "@/types";

export const instructorsKpis = {
  totalInstructors: { value: 12, deltaPct: 8 },
  revenueGrowthRate: { valuePct: 8.5 },
  totalRevenue: { value: 450_200, delta: 12 }
};

export const instructors: Instructor[] = [
  {
    id: "elena-rossi",
    fullName: "Elena Rossi",
    email: "ena@email.com",
    specialization: "Product Design",
    courses: 8,
    students: 4203,
    revenue: 142_500,
    revenueDeltaPct: 15,
    rating: 4.9,
    status: "active",
    avatarColor: "brand"
  },
  {
    id: "julian-sterling",
    fullName: "Julian Sterling",
    email: "julian@email.com",
    specialization: "Digital Marketing",
    courses: 5,
    students: 2890,
    revenue: 128_100,
    revenueDeltaPct: 8,
    rating: 4.8,
    status: "active",
    avatarColor: "blue"
  },
  {
    id: "julianna-davenport",
    fullName: "Julianna Davenport",
    email: "julianna@email.com",
    specialization: "Motion Graphics",
    courses: 12,
    students: 8450,
    revenue: 105_400,
    revenueDeltaPct: -2,
    rating: 4.4,
    status: "inactive",
    avatarColor: "amber"
  },
  {
    id: "mark-thorne",
    fullName: "Mark Thorne",
    email: "mark@email.com",
    specialization: "Copywriting",
    courses: 4,
    students: 1120,
    revenue: 74_800,
    revenueDeltaPct: 22,
    rating: 5.0,
    status: "active",
    avatarColor: "slate"
  },
  {
    id: "sarah-chen",
    fullName: "Sarah Chen",
    email: "sarah@email.com",
    specialization: "Product Design",
    courses: 6,
    students: 2510,
    revenue: 92_300,
    revenueDeltaPct: 6,
    rating: 4.7,
    status: "active",
    avatarColor: "emerald"
  },
  {
    id: "omar-khaled",
    fullName: "Omar Khaled",
    email: "omar@email.com",
    specialization: "Strategy Management",
    courses: 7,
    students: 3390,
    revenue: 88_900,
    revenueDeltaPct: 3,
    rating: 4.6,
    status: "active",
    avatarColor: "brand"
  },
  {
    id: "nora-hassan",
    fullName: "Nora Hassan",
    email: "nora@email.com",
    specialization: "Digital Marketing",
    courses: 3,
    students: 980,
    revenue: 41_200,
    revenueDeltaPct: -4,
    rating: 4.3,
    status: "inactive",
    avatarColor: "amber"
  },
  {
    id: "david-lee",
    fullName: "David Lee",
    email: "david@email.com",
    specialization: "Copywriting",
    courses: 5,
    students: 1460,
    revenue: 58_750,
    revenueDeltaPct: 11,
    rating: 4.5,
    status: "active",
    avatarColor: "slate"
  },
  {
    id: "mona-samy",
    fullName: "Mona Samy",
    email: "mona@email.com",
    specialization: "Motion Graphics",
    courses: 9,
    students: 5620,
    revenue: 99_600,
    revenueDeltaPct: 5,
    rating: 4.6,
    status: "active",
    avatarColor: "blue"
  },
  {
    id: "adam-williams",
    fullName: "Adam Williams",
    email: "adam@email.com",
    specialization: "Product Design",
    courses: 4,
    students: 1250,
    revenue: 47_900,
    revenueDeltaPct: 2,
    rating: 4.4,
    status: "active",
    avatarColor: "brand"
  },
  {
    id: "lina-zaki",
    fullName: "Lina Zaki",
    email: "lina@email.com",
    specialization: "Strategy Management",
    courses: 2,
    students: 640,
    revenue: 26_500,
    revenueDeltaPct: -6,
    rating: 4.1,
    status: "inactive",
    avatarColor: "amber"
  },
  {
    id: "yousef-salem",
    fullName: "Yousef Salem",
    email: "yousef@email.com",
    specialization: "Digital Marketing",
    courses: 6,
    students: 3110,
    revenue: 78_450,
    revenueDeltaPct: 9,
    rating: 4.7,
    status: "active",
    avatarColor: "emerald"
  }
];

export const revenueContribution = [
  { name: "Elena Rossi", pct: 22 },
  { name: "Julian Sterling", pct: 18 },
  { name: "Julianna Davenport", pct: 15 },
  { name: "Other Instructors (9)", pct: 45 }
] as const;

export const topPerformers = [
  { name: "Elena Rossi", value: 142_500 },
  { name: "Julian Sterling", value: 128_100 },
  { name: "Julianna Davenport", value: 105_400 }
] as const;

export const instructorDetailsById: Record<
  string,
  {
    headlineRole: string;
    kpis: {
      totalRevenue: number;
      totalRevenueDeltaPct: number;
      totalStudents: number;
      totalStudentsDeltaPct: number;
      activeCourses: number;
      conversionRatePct: number;
      conversionRateDeltaPct: number;
      avgRevenuePerCourse: number;
      avgRevenuePerCourseDeltaPct: number;
    };
    salesPerformance: {
      totalLeads: number;
      totalSales: number;
      conversionRatePct: number;
      revenueBreakdown: Array<{ label: string; pct: number; color: "brand" | "slate" | "emerald" }>;
    };
    activeCourses: InstructorCourse[];
    activity: InstructorActivity[];
  }
> = {
  "elena-rossi": {
    headlineRole: "Lead Design Systems & Senior Architect",
    kpis: {
      totalRevenue: 142_500,
      totalRevenueDeltaPct: 12.4,
      totalStudents: 4203,
      totalStudentsDeltaPct: 8.3,
      activeCourses: 8,
      conversionRatePct: 14.2,
      conversionRateDeltaPct: -0.4,
      avgRevenuePerCourse: 17_812,
      avgRevenuePerCourseDeltaPct: 15.2
    },
    salesPerformance: {
      totalLeads: 850,
      totalSales: 120,
      conversionRatePct: 14.1,
      revenueBreakdown: [
        { label: "UI Architecture", pct: 45, color: "brand" },
        { label: "Logic Systems", pct: 35, color: "slate" },
        { label: "Other Courses", pct: 20, color: "emerald" }
      ]
    },
    activeCourses: [
      { id: "c1", name: "Mastering UI Architecture", students: 1200, revenue: 45_000, conversionRatePct: 18.5, status: "active" },
      { id: "c2", name: "Design System Logic V2", students: 945, revenue: 32_100, conversionRatePct: 15.2, status: "active" },
      { id: "c3", name: "Advanced Component Patterning", students: 620, revenue: 18_450, conversionRatePct: 12.8, status: "draft" }
    ],
    activity: [
      { id: "a1", type: "course_updated", title: "Course Updated: Advanced UI Design", subtitle: "Content version v4.2 published", timeAgo: "2 days ago" },
      { id: "a2", type: "student_enrolled", title: "New Student Enrolled", subtitle: "Student: Marcus Wright (Enterprise Plan)", timeAgo: "4 hours ago" },
      { id: "a3", type: "goal_reached", title: "Sales Goal Reached", subtitle: "Yesterday • Monthly revenue target $150k achieved", timeAgo: "Yesterday" }
    ]
  }
};

export const instructorFormMock = {
  specializations: ["Product Design", "Strategy Management", "Digital Marketing", "Motion Graphics", "Copywriting"],
  courseOptions: [
    "Advanced Logic Systems",
    "Behavioral Design 101",
    "Strategic Negotiation",
    "Product Discovery",
    "Design Systems",
    "Growth Marketing"
  ],
  salesTeam: [
    { id: "s1", initials: "EH" },
    { id: "s2", initials: "SM" },
    { id: "s3", initials: "KA" }
  ]
};
