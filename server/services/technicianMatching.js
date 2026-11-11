import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

const normalize = value => String(value || '').trim().toLowerCase();

export async function rankTechniciansForTicket(ticket) {
  const [technicians, workloads] = await Promise.all([
    User.find({ role: 'technician', isActive: { $ne: false } }).select('name userId skills availability rating experienceYears'),
    Ticket.aggregate([
      { $match: { status: { $in: ['assigned', 'in-progress'] }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', activeJobs: { $sum: 1 } } },
    ]),
  ]);
  const workloadByUser = new Map(workloads.map(item => [String(item._id), item.activeJobs]));
  const category = normalize(ticket.category);
  const activeJobCounts = technicians.map(technician => workloadByUser.get(String(technician._id)) || 0);
  const maximumWorkload = Math.max(1, ...activeJobCounts);

  return technicians.map(technician => {
    const activeJobs = workloadByUser.get(String(technician._id)) || 0;
    const skills = technician.skills || [];
    const compatibleSkills = skills.filter(skill => {
      const normalizedSkill = normalize(skill);
      return normalizedSkill && (normalizedSkill === category || category.includes(normalizedSkill) || normalizedSkill.includes(category));
    });
    const skillScore = skills.length === 0 ? 0 : (compatibleSkills.length ? 1 : 0);
    const availabilityScore = technician.availability === 'available' ? 1 : technician.availability === 'busy' ? 0.35 : 0;
    const workloadScore = Math.max(0, 1 - activeJobs / (maximumWorkload + 1));
    const ratingScore = Math.max(0, Math.min(5, technician.rating || 0)) / 5;
    const experienceScore = Math.min(1, Math.max(0, technician.experienceYears || 0) / 10);
    const score = Math.round(
      skillScore * 45 + availabilityScore * 25 + workloadScore * 15 +
      ratingScore * 10 + experienceScore * 5
    );
    const reasons = [];
    if (compatibleSkills.length) reasons.push(`Skill match: ${compatibleSkills.join(', ')}`);
    else if (!skills.length) reasons.push('No skills are on file');
    else reasons.push('No matching skill listed');
    reasons.push(technician.availability === 'available' ? 'Available' : technician.availability === 'busy' ? 'Busy' : 'Unavailable');
    reasons.push(`${activeJobs} active ${activeJobs === 1 ? 'job' : 'jobs'}`);
    reasons.push(`${technician.rating.toFixed(1)} / 5 rating`);
    reasons.push(`${technician.experienceYears} years experience`);
    return {
      id: String(technician._id),
      userId: technician.userId,
      name: technician.name,
      availability: technician.availability,
      skills,
      rating: technician.rating,
      experienceYears: technician.experienceYears,
      activeJobs,
      score,
      eligible: technician.availability !== 'unavailable',
      reasons,
    };
  }).sort((left, right) =>
    Number(right.eligible) - Number(left.eligible) ||
    right.score - left.score ||
    left.activeJobs - right.activeJobs ||
    left.name.localeCompare(right.name)
  );
}
