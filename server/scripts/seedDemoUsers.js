import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Ticket from '../models/Ticket.js';
import TicketHistory from '../models/TicketHistory.js';

dotenv.config();

const admin = {
  name: 'Vikram Malhotra',
  email: 'vikram.malhotra@fixflow.in',
  legacyEmail: 'adminfixflowbytool@fixflow.local',
  password: 'Vikram@Ops#2026',
  role: 'admin',
  department: 'Operations',
};

const technicians = [
  {
    name: 'Aarav Mehta', email: 'aarav.mehta@fixflow.in', legacyEmail: 'aarav.mehta@fixflow.local',
    password: 'Aarav@Field#2026', role: 'technician', department: 'Facilities', phone: '+91 98765 10001',
    skills: ['Electrical', 'HVAC'], experienceYears: 8,
  },
  {
    name: 'Priya Nair', email: 'priya.nair@fixflow.in', legacyEmail: 'priya.nair@fixflow.local',
    password: 'Priya@Service#2026', role: 'technician', department: 'Facilities', phone: '+91 98765 10002',
    skills: ['Plumbing', 'Facilities'], experienceYears: 6,
  },
  {
    name: 'Rohan Kulkarni', email: 'rohan.kulkarni@fixflow.in', legacyEmail: 'rohan.kulkarni@fixflow.local',
    password: 'Rohan@Network#2026', role: 'technician', department: 'IT', phone: '+91 98765 10003',
    skills: ['IT Support', 'Networking', 'Hardware'], experienceYears: 5,
  },
];

const employees = [
  ['Aditi Sharma', 'HR', '98765 20001', 'Aditi@People#2026'],
  ['Vikram Patel', 'Finance', '98765 20002', 'Vikram@Finance#2026'],
  ['Sneha Reddy', 'Engineering', '98765 20003', 'Sneha@Build#2026'],
  ['Rahul Verma', 'Operations', '98765 20004', 'Rahul@Ops#2026'],
  ['Kavya Menon', 'Marketing', '98765 20005', 'Kavya@Market#2026'],
  ['Arjun Desai', 'IT', '98765 20006', 'Arjun@Support#2026'],
  ['Ishita Kapoor', 'HR', '98765 20007', 'Ishita@People#2026'],
  ['Karthik Rao', 'Facilities', '98765 20008', 'Karthik@Office#2026'],
  ['Meera Joshi', 'Finance', '98765 20009', 'Meera@Finance#2026'],
  ['Nikhil Gupta', 'Engineering', '98765 20010', 'Nikhil@Build#2026'],
  ['Pooja Shah', 'Operations', '98765 20011', 'Pooja@Ops#2026'],
  ['Sandeep Das', 'IT', '98765 20012', 'Sandeep@Support#2026'],
  ['Divya Krishnan', 'Marketing', '98765 20013', 'Divya@Market#2026'],
  ['Manish Choudhary', 'Facilities', '98765 20014', 'Manish@Office#2026'],
  ['Neha Bansal', 'Engineering', '98765 20015', 'Neha@Build#2026'],
].map(([name, department, phone, password]) => {
  const email = name.toLowerCase().replaceAll(' ', '.') + '@fixflow.in';
  return {
    name,
    email,
    legacyEmail: email.replace('@fixflow.in', '@fixflow.local'),
    password,
    role: 'employee',
    department,
    phone: `+91 ${phone}`,
  };
});

const workByTechnician = [
  {
    email: 'aarav.mehta@fixflow.in',
    active: [
      { employee: 0, title: 'Meeting room air conditioner is not cooling', category: 'HVAC', priority: 'high', location: 'North Wing · Meeting Room 3', status: 'in-progress' },
      { employee: 1, title: 'Lights flicker in the accounts office', category: 'Electrical', priority: 'medium', location: 'East Wing · Accounts', status: 'assigned' },
      { employee: 2, title: 'Unusual noise from the reception AC unit', category: 'HVAC', priority: 'medium', location: 'Main Building · Reception', status: 'in-progress' },
    ],
    completed: [
      { employee: 0, title: 'Replace failed lights in the HR corridor', category: 'Electrical', location: 'North Wing · HR' },
      { employee: 1, title: 'Repair the conference room ceiling fan', category: 'Electrical', location: 'Main Building · Conference Room' },
      { employee: 2, title: 'Service the library air conditioning', category: 'HVAC', location: 'East Wing · Library' },
      { employee: 3, title: 'Restore power to the pantry outlets', category: 'Electrical', location: 'South Wing · Pantry' },
      { employee: 4, title: 'Clean filters in the training room AC', category: 'HVAC', location: 'North Wing · Training Room' },
    ],
  },
  {
    email: 'priya.nair@fixflow.in',
    active: [
      { employee: 3, title: 'Water is leaking under the pantry sink', category: 'Plumbing', priority: 'high', location: 'South Wing · Pantry', status: 'in-progress' },
      { employee: 4, title: 'Washroom tap will not shut off', category: 'Plumbing', priority: 'medium', location: 'West Wing · Level 2', status: 'assigned' },
      { employee: 5, title: 'Low water pressure in the staff washroom', category: 'Plumbing', priority: 'medium', location: 'Main Building · Level 1', status: 'in-progress' },
    ],
    completed: [
      { employee: 5, title: 'Clear the blocked drain in the staff kitchen', category: 'Plumbing', location: 'South Wing · Staff Kitchen' },
      { employee: 6, title: 'Repair the leaking washroom flush valve', category: 'Plumbing', location: 'East Wing · Level 3' },
      { employee: 7, title: 'Replace the damaged pantry faucet', category: 'Plumbing', location: 'North Wing · Pantry' },
      { employee: 8, title: 'Fix the water leak near the utility room', category: 'Plumbing', location: 'Service Block · Utility Room' },
      { employee: 9, title: 'Restore hot water in the staff washroom', category: 'Plumbing', location: 'West Wing · Level 1' },
    ],
  },
  {
    email: 'rohan.kulkarni@fixflow.in',
    active: [
      { employee: 6, title: 'Employee laptop will not connect to Wi-Fi', category: 'IT Support', priority: 'high', location: 'North Wing · HR', status: 'in-progress' },
      { employee: 7, title: 'Printer is offline on the second floor', category: 'IT Support', priority: 'medium', location: 'East Wing · Level 2', status: 'assigned' },
      { employee: 8, title: 'Meeting room display has no signal', category: 'IT Support', priority: 'medium', location: 'Main Building · Meeting Room 1', status: 'in-progress' },
    ],
    completed: [
      { employee: 10, title: 'Restore network access at the front desk', category: 'IT Support', location: 'Main Building · Reception' },
      { employee: 11, title: 'Set up the replacement workstation', category: 'IT Support', location: 'IT Office · Desk 4' },
      { employee: 12, title: 'Repair the shared office printer connection', category: 'IT Support', location: 'South Wing · Level 2' },
      { employee: 13, title: 'Replace a faulty keyboard and mouse', category: 'IT Support', location: 'West Wing · Facilities' },
      { employee: 14, title: 'Fix intermittent Wi-Fi in the design studio', category: 'Networking', location: 'North Wing · Design Studio' },
    ],
  },
];

async function findOrCreateUser(userData) {
  let user = await User.findOne({
    $or: [{ email: userData.email }, { email: userData.legacyEmail }],
  });
  if (!user) user = new User();
  user.name = userData.name;
  user.email = userData.email;
  user.password = userData.password;
  user.role = userData.role;
  user.isActive = true;
  user.department = userData.department;
  user.phone = userData.phone;
  user.skills = userData.skills || [];
  user.experienceYears = userData.experienceYears || 0;
  user.availability = 'available';
  await user.save();
  return user;
}

async function ensureHistory(ticket, { action, updatedBy, previousStatus, newStatus, remarks, createdAt }) {
  if (await TicketHistory.exists({ ticket: ticket._id, action })) return;
  await TicketHistory.create({
    ticket: ticket._id, action, updatedBy, previousStatus, newStatus, remarks, createdAt, updatedAt: createdAt,
  });
}

async function saveWorkOrder({ employee, technician, item, adminUser, completed, completionIndex }) {
  const now = new Date();
  const createdAt = completed
    ? new Date(now.getTime() - (completionIndex + 1) * 86400000)
    : new Date(now.getTime() - (3 + completionIndex) * 3600000);
  const assignedAt = new Date(createdAt.getTime() + 15 * 60000);
  const resolvedAt = completed ? new Date(createdAt.getTime() + 2 * 3600000) : undefined;
  const closedAt = completed ? new Date(createdAt.getTime() + 4 * 3600000) : undefined;
  const title = item.title;
  let ticket = await Ticket.findOne({ title, createdBy: employee._id });
  const isNew = !ticket;
  if (!ticket) ticket = new Ticket();

  Object.assign(ticket, {
    title,
    description: completed
      ? `The ${item.category.toLowerCase()} issue was inspected, repaired and tested. The employee confirmed the service was restored.`
      : `Please inspect and repair this ${item.category.toLowerCase()} issue. The affected area is ${item.location}.`,
    category: item.category,
    priority: item.priority || 'low',
    status: completed ? 'closed' : item.status,
    createdBy: employee._id,
    assignedTo: technician._id,
    assignedAt,
    location: item.location,
    dueDate: completed ? new Date(createdAt.getTime() + 12 * 3600000) : new Date(now.getTime() + 24 * 3600000),
    resolutionNotes: completed ? 'Repair completed and tested successfully.' : undefined,
    resolvedAt,
    closedAt,
    createdAt,
  });
  await ticket.save();

  if (isNew) {
    await ensureHistory(ticket, {
      action: 'Ticket created', updatedBy: employee._id, newStatus: 'open', createdAt,
    });
  }
  await ensureHistory(ticket, {
    action: 'Technician assigned', updatedBy: adminUser._id, previousStatus: 'open',
    newStatus: 'assigned', remarks: technician.name, createdAt: assignedAt,
  });
  if (item.status === 'in-progress' || completed) {
    await ensureHistory(ticket, {
      action: 'Status → in-progress', updatedBy: technician._id, previousStatus: 'assigned',
      newStatus: 'in-progress', createdAt: new Date(assignedAt.getTime() + 30 * 60000),
    });
  }
  if (completed) {
    await ensureHistory(ticket, {
      action: 'Status → resolved', updatedBy: technician._id, previousStatus: 'in-progress',
      newStatus: 'resolved', remarks: ticket.resolutionNotes, createdAt: resolvedAt,
    });
    await ensureHistory(ticket, {
      action: 'Employee confirmed & closed', updatedBy: employee._id, previousStatus: 'resolved',
      newStatus: 'closed', createdAt: closedAt,
    });
  }
}

try {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be set in server/.env');
  await mongoose.connect(process.env.MONGO_URI);

  const retiredTechnician = await User.findOne({ email: 'ananya.iyer@fixflow.local' });
  if (retiredTechnician) {
    const [ticketReferences, historyReferences] = await Promise.all([
      Ticket.countDocuments({ $or: [{ assignedTo: retiredTechnician._id }, { createdBy: retiredTechnician._id }] }),
      TicketHistory.countDocuments({ updatedBy: retiredTechnician._id }),
    ]);
    if (ticketReferences || historyReferences) {
      throw new Error('The previous sample technician has work history. Reassign or remove that legacy account before reseeding.');
    }
    await retiredTechnician.deleteOne();
  }

  const [adminUser, ...team] = await Promise.all([admin, ...technicians, ...employees].map(findOrCreateUser));
  const technicianUsers = team.slice(0, technicians.length);
  const employeeUsers = team.slice(technicians.length);
  const employeeByEmail = new Map(employeeUsers.map(employee => [employee.email, employee]));
  const technicianByEmail = new Map(technicianUsers.map(technician => [technician.email, technician]));

  let activeCount = 0;
  let completedCount = 0;
  for (const group of workByTechnician) {
    const technician = technicianByEmail.get(group.email);
    for (let index = 0; index < group.active.length; index += 1) {
      const item = group.active[index];
      await saveWorkOrder({
        employee: employeeUsers[item.employee], technician, item, adminUser,
        completed: false, completionIndex: index,
      });
      activeCount += 1;
    }
    for (let index = 0; index < group.completed.length; index += 1) {
      const item = group.completed[index];
      const employeeIndex = completedCount;
      await saveWorkOrder({
        employee: employeeUsers[employeeIndex], technician, item, adminUser,
        completed: true, completionIndex: employeeIndex,
      });
      completedCount += 1;
    }
  }

  await Notification.deleteMany({
    message: { $in: [
      'Your demo workspace is ready. Review the latest service requests here.',
      'Your demo work queue is ready. Review your assigned service requests here.',
      'Your demo service desk is ready. Track your workplace requests here.',
    ] },
  });
  const demoNotifications = [];
  const newRequest = await Ticket.findOne({ status: 'open', assignedTo: null }).sort({ createdAt: -1 });
  if (newRequest) {
    demoNotifications.push({
      recipient: adminUser,
      relatedTicket: newRequest._id,
      type: 'ticket',
      message: `New ${newRequest.priority} priority request needs assignment: "${newRequest.title}"`,
    });
  }
  for (const technician of technicianUsers) {
    const assignedTicket = await Ticket.findOne({
      assignedTo: technician._id,
      status: { $in: ['assigned', 'in-progress'] },
    }).sort({ updatedAt: -1 });
    if (assignedTicket) {
      demoNotifications.push({
        recipient: technician,
        relatedTicket: assignedTicket._id,
        type: 'assignment',
        message: `Assigned to you: "${assignedTicket.title}"`,
      });
    }
  }
  for (const employee of employeeUsers) {
    const latestTicket = await Ticket.findOne({ createdBy: employee._id }).sort({ updatedAt: -1 });
    if (latestTicket) {
      demoNotifications.push({
        recipient: employee,
        relatedTicket: latestTicket._id,
        type: 'status',
        message: `Your request "${latestTicket.title}" is ${latestTicket.status}`,
      });
    }
  }
  await Promise.all(demoNotifications.map(({ recipient, relatedTicket, message, type }) =>
    Notification.updateOne(
      { recipient: recipient._id, relatedTicket, message },
      { $setOnInsert: { type, isRead: false } },
      { upsert: true }
    )
  ));

  console.log(`Workspace ready: ${technicianUsers.length} technicians, ${employeeUsers.length} employees, ${activeCount} active requests and ${completedCount} completed requests.`);
} catch (error) {
  console.error('Unable to seed the FixFlow workspace:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
