

export type Client = {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Lead';
  joinDate: string;
  monthlyVideos: number;
  documentation?: string;
};

export type Appointment = {
  id:string;
  title: string;
  date: Date;
  type: 'Meeting' | 'Deadline' | 'Task';
  clientId?: string;
  location?: string;
  assignedPersons?: string[];
  comments?: string;
};

export type TimeEntry = {
    id: string;
    date: string;
    teamMember: string;
    client: string;
    task: string;
    duration: number;
};

export type TeamMember = {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'Ägare' | 'Kreatör' | 'Ekonomi';
    assignedClients: string[];
    hourlyrate: number;
    photoURL?: string;
    notes?: string;
};

export type Trip = {
    id: string;
    startLocation: string;
    destination: string;
    distance: number;
    teamMember: string;
    date: string;
    purpose?: string;
};

export type GearStatus = 'in_use' | 'available' | 'maintenance' | 'coming_soon';

export type Gear = {
    id: string;
    name: string;
    assignedTo: string | null;
    status: GearStatus;
    createdAt: string;
    updatedAt: string;
};

export type Revenue = {
    id: string;
    revenue: number;
    month: string;
    client: string;
    comment: string;
};

export type Expense = {
  id: string;
  amount: number;
  month: string;
  category: string;
  comment: string;
};

export type Content = {
  id: string;
  title: string;
  client: string;
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done';
  deadline: string;
  owner: string;
  link?: string;
  description?: string;
};

export type KnowledgeBaseArticle = {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
};
