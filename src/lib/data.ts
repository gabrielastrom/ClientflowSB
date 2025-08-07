
import type { Client, Appointment, TeamMember, Revenue, Content } from './types';

export const clients: Client[] = [];
// export const clients: Client[] = [
//   { id: '1', name: 'Glamour Inc.', contactPerson: 'Jessica Day', email: 'jessica.day@glamour.com', phone: '555-0101', status: 'Active', joinDate: '2023-01-15', monthlyVideos: 5 },
//   { id: '2', name: 'Peak Fitness', contactPerson: 'Mike Johnson', email: 'mike.j@peakfitness.com', phone: '555-0102', status: 'Active', joinDate: '2023-03-22', monthlyVideos: 10 },
//   { id: '3', name: 'The Coffee House', contactPerson: 'Sarah Lee', email: 'sarah.l@coffeehouse.com', phone: '555-0103', status: 'Inactive', joinDate: '2022-11-10', monthlyVideos: 0 },
//   { id: '4', name: 'Innovate Tech', contactPerson: 'David Chen', email: 'david.c@innovate.tech', phone: '555-0104', status: 'Lead', joinDate: '2024-05-01', monthlyVideos: 8 },
//   { id: '5', name: 'Artisan Bakes', contactPerson: 'Emily White', email: 'emily.w@artisanbakes.com', phone: '555-0105', status: 'Active', joinDate: '2023-08-01', monthlyVideos: 3 },
// ];

export const team: TeamMember[] = [];
// export const team: TeamMember[] = [
// { id: '1', name: 'Alex Doe', email: 'alex@clientflow.com', phone: '555-0201', role: 'Manager', assignedClients: ['Glamour Inc.', 'Peak Fitness'], hourlyRate: 200 },
//     { id: '2', name: 'Casey Jordan', email: 'casey@clientflow.com', phone: '555-0202', role: 'Strategist', assignedClients: ['Peak Fitness', 'The Coffee House'], hourlyRate: 180 },
//     { id: '3', name: 'Taylor Morgan', email: 'taylor@clientflow.com', phone: '555-0203', role: 'Designer', assignedClients: ['Glamour Inc.', 'Artisan Bakes'], hourlyRate: 150 },
//     { id: '4', name: 'Alex Ray', email: 'ray@clientflow.com', phone: '555-0204', role: 'Designer', assignedClients: ['Innovate Tech', 'The Coffee House'], hourlyRate: 150 },
// ];


const today = new Date();
export const appointments: Appointment[] = [];
// export const appointments: Appointment[] = [
//     { id: '1', title: 'Content Strategy Meeting with Glamour Inc.', date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0), type: 'Meeting', clientId: '1', location: 'Online / Google Meet', assignedPersons: ['Alex Doe', 'Casey Jordan'], comments: 'Prepare Q3 content plan.' },
//     { id: '2', title: 'Design new posts for Peak Fitness', date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0), type: 'Task', clientId: '2', assignedPersons: ['Taylor Morgan'], comments: 'Focus on video content.' },
//     { id: '3', title: 'Peak Fitness campaign launch', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2), type: 'Deadline', clientId: '2', assignedPersons: ['Casey Jordan', 'Alex Ray'], location: 'Remote' },
//     { id: '4', title: 'Follow up with Innovate Tech', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0), type: 'Meeting', clientId: '4', location: 'Client Office', assignedPersons: ['Alex Doe'], comments: 'Discuss contract details.' },
// ];

export const teamMembers: string[] = team.map(member => member.name);

export const revenues: Revenue[] = [];
// export const revenues: Revenue[] = [
//     { id: '1', revenue: 5000, month: 'July 2024', client: 'Glamour Inc.', comment: 'Monthly Retainer' },
//     { id: '2', revenue: 7500, month: 'July 2024', client: 'Peak Fitness', comment: 'Campaign Management Fee' },
//     { id: '3', revenue: 4500, month: 'June 2024', client: 'Glamour Inc.', comment: 'Monthly Retainer' },
//     { id: '4', revenue: 7000, month: 'June 2024', client: 'Peak Fitness', comment: 'Campaign Management Fee' },
//     { id: '5', revenue: 3000, month: 'June 2024', client: 'Artisan Bakes', comment: 'Initial Project Fee' },
// ];

const todayForContent = new Date();
const getFutureDate = (days: number) => {
  const date = new Date(todayForContent);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const content: Content[] = [];
// export const content: Content[] = [
//   { id: '1', title: 'Summer Campaign Launch Video', client: 'Glamour Inc.', status: 'In Progress', deadline: getFutureDate(12), owner: 'Casey Jordan', description: 'A vibrant and energetic video showcasing the new summer collection. Aim for a 30-second reel with trending audio.' },
//   { id: '2', title: '10 Healthy Breakfast Ideas', client: 'Peak Fitness', status: 'To Do', deadline: getFutureDate(3), owner: 'Alex Ray', link: 'https://example.com/draft1', description: 'Quick-cut video series demonstrating 10 easy and healthy breakfast recipes. Each clip should be 3-5 seconds long.' },
//   { id: '3', title: 'Behind the Scenes at the Roastery', client: 'The Coffee House', status: 'Done', deadline: getFutureDate(-2), owner: 'Taylor Morgan', link: 'https://instagram.com/p/12345', description: 'A short documentary-style video showing the coffee roasting process and interviews with the staff.' },
//   { id: '4', title: 'New Feature Announcement', client: 'Innovate Tech', status: 'In Review', deadline: getFutureDate(8), owner: 'Casey Jordan', description: 'A concise and impactful graphic announcing the latest software update. Highlight the top 3 new features.' },
//   { id: '5', title: 'Weekly Special: Croissant-Muffin', client: 'Artisan Bakes', status: 'In Progress', deadline: getFutureDate(15), owner: 'Alex Ray', link: 'https://example.com/draft2', description: 'A delicious-looking carousel post with high-quality photos of the new croissant-muffin hybrid. Include a call-to-action to visit the store.' },
//   { id: '6', title: 'Q3 Results Infographic', client: 'Glamour Inc.', status: 'To Do', deadline: getFutureDate(25), owner: 'Taylor Morgan', description: 'An easy-to-read infographic summarizing the key success metrics from the third quarter. Use brand colors and clear data visualizations.' },
//   { id: '7', title: 'Plan August content calendar', client: 'Peak Fitness', status: 'To Do', deadline: getFutureDate(1), owner: 'Alex Ray', description: 'Plan out the content for next month.' },
// ];
