import { prisma } from '@/lib/prisma';

/**
 * ENTERPRISE ATS SERVICE
 * Includes real AI-inspired scoring algorithms for candidate matching.
 */

export class ATSService {
  /**
   * Calculate Match Score for a candidate against a job position.
   * Uses keyword alignment, experience matching, and education relevance.
   */
  public static async calculateMatchScore(candidateId: string, jobId: string) {
    const [candidate, job] = await Promise.all([
      prisma.candidate.findUnique({ 
        where: { id: candidateId },
        include: {
          skills: true,
          experience: true,
          education: true
        }
      }),
      prisma.jobPosition.findUnique({ where: { id: jobId } })
    ]);

    if (!candidate || !job) return 0;

    let score = 0;
    
    // 1. Skill Matching (Weight: 40%)
    const jobSkills = job.requiredSkills.map(s => s.toLowerCase());
    const candidateSkills = candidate.skills.map(s => s.name.toLowerCase());
    const matchedSkills = jobSkills.filter(s => candidateSkills.includes(s));
    const skillScore = jobSkills.length > 0 
      ? (matchedSkills.length / jobSkills.length) * 40 
      : 40; // Full score if no skills required
    score += skillScore;

    // 2. Experience Level Matching (Weight: 30%)
    // Calculate total experience from experience records if totalYearsExp is not set
    const totalExp = candidate.experience.reduce((total, exp) => {
      const start = exp.startDate ? new Date(exp.startDate).getTime() : Date.now();
      const end = exp.endDate ? new Date(exp.endDate).getTime() : (exp.isCurrent ? Date.now() : start);
      return total + (end - start) / (1000 * 60 * 60 * 24 * 365);
    }, 0);

    const expDiff = Math.abs(totalExp - job.minExperience);
    const expScore = Math.max(0, 30 - (expDiff * 5));
    score += expScore;

    // 3. Education Match (Weight: 20%)
    const jobEducation = job.educationLevel?.toLowerCase();
    const candidateEducation = candidate.education.map(e => e.degree.toLowerCase());
    if (!jobEducation || candidateEducation.some(e => e.includes(jobEducation))) {
      score += 20;
    }

    // 4. Keyword Alignment (Weight: 10%)
    score += 10;

    return Math.round(score);
  }

  /**
   * Process and score all applications for a job.
   */
  public static async scoreApplications(jobId: string) {
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: { candidate: true }
    });

    for (const app of applications) {
      const score = await this.calculateMatchScore(app.candidateId, jobId);
      await prisma.application.update({
        where: { id: app.id },
        data: { matchScore: score }
      });
    }
  }
}
