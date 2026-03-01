
export type UserRole = 'ADMIN' | 'RECRUITER' | 'CANDIDATE' | 'INTERVIEWER';

export interface Experience {
  company: string;
  designation: string;
  from: string;
  to: string;
  work: string;
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  from: string;
  to: string;
}

export interface User {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  profilePicture?: string;

  // Candidate Fields
  headline?: string;
  bio?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  resume?: string;
  resumeUrl?: string;

  // Recruiter Fields
  companyName?: string;
  website?: string;
  companyDescription?: string;

  // Interviewer Fields
  hourlyRate?: string;
  yearsOfExperience?: string;
  availability?: string;

  createdAt?: string;
}

export interface Job {
  _id: string;
  title: string;
  description: string;
  requirements?: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Contract' | 'Part-time' | 'Remote';
  salary?: string;
  skills?: string[];
  postedBy: string; // Recruiter ID
  applicants: string[] | User[]; // Array of User IDs
  createdAt: string;
  status: 'Active' | 'Closed';
  applicantCount?: number;
}

export interface Application {
  _id: string;
  job: string | Job; // Populated
  candidate: string | User; // Populated
  resume?: string;
  status: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Rejected';
  appliedAt: string;
}

export interface Interview {
  _id: string;
  candidateId: string | User;
  recruiterId: string | User;
  interviewerId?: string | User;
  jobId?: string | Job;
  scheduledTime: string;
  meetingId: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  paymentStatus?: 'Unpaid' | 'Paid';
  notes?: string;
  // Legacy compat
  date?: string;
  time?: string;
  meetingLink?: string;
}

export interface Message {
  _id: string;
  senderId: string | User;
  receiverId: string | User;
  content: string;
  isRead: boolean;
  createdAt: string;
}
