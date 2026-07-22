  export type NavItem = {

  label: string;

  href: string;

};



export type KPI = {

  title: string;

  value: string;

  delta: string;

};



export type User = {

  id: string;

  name: string;

  email: string;

  role?: string;

  isActive?: boolean;

  createdAt?: Date;

  updatedAt?: Date;

  organization?: string | null;

  organizationId?: string | null;

};



export type Activity = {

  id: string;

  type: string;

  title: string;

  meta: any;

  userId?: string;

  user?: {

    id: string;

    name: string;

    email: string;

  };

  createdAt: string;

};



export type Lead = {

  id: string;

  name: string;

  phone: string;

  email?: string | null;

  course: string;

  source?: string | null;

  status: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "CONVERTED";

  lastFollowUp?: string | null;

  ownerId: string;

  photo?: string | null;

  owner?: {

    name: string;

    email: string;

  } | null;

  tags?: string[];

};



export type DealStage = "OPEN" | "WON" | "LOST";

export type TimelineEventType = "call" | "email" | "meeting" | "note" | "status_change";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  author: string;
  timestamp: string;
  date: string;
};

export type DealNote = {
  id: string;
  content: string;
  author: string;
  createdAt: string;
};



export type Deal = {

  id: string;

  clientName: string;

  clientCompany: string;

  clientEmail?: string;

  clientPhone?: string;

  course: string;

  dealValue: number;

  stage: DealStage;

  salesAgent: {

    name: string;

    email: string;

  };

  date: string;

  expectedCloseDate: string;

  probability: number;

  createdAt: string;

  timeline?: TimelineEvent[];

  notes?: DealNote[];

};

export type InstructorStatus = "active" | "inactive";

export type InstructorCourseStatus = "active" | "draft";

export type InstructorCourse = {
  id: string;
  name: string;
  students: number;
  revenue: number;
  conversionRatePct: number;
  status: InstructorCourseStatus;
};

export type InstructorActivity = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  timeAgo: string;
};

export type Instructor = {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  courses: number;
  students: number;
  revenue: number;
  revenueDeltaPct: number;
  rating: number;
  status: InstructorStatus;
  avatarColor: "brand" | "blue" | "amber" | "slate" | "emerald";
};

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type Campaign = {
  id: string;
  name: string;
  channel: string;
  budget: number;
  leads: number;
  sales: number;
  revenue: number;
  cpl: number;
  roiPct: number;
  status: CampaignStatus;
  startDate: string;
  endDate: string | null;
  createdBy: string;
};

