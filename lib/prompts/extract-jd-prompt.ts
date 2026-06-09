/**
 * AI Prompt for Job Description Extraction
 * Cleans and extracts JD from messy webpage content
 */

export const getExtractJDPrompt = (text: string): string => {
  return `
You are an expert Data Extraction AI.

Input: A raw, messy text dump from a webpage (LinkedIn, Indeed, or company career page). 
It contains the Job Description mixed with navigation menus, ads, sidebar content, and irrelevant footer text.

Your Task:
1. IGNORE all navigation, headers, footers, "similar jobs", "subscribe", and "login" text.
2. EXTRACT the core Job Description and any Recruiter Contact Information.
3. OUTPUT specifically in this JSON format:
{
  "cleaned_jd": "The full clean JD text...",
  "job_role": "The specific job title (e.g. Senior Java Developer) if found, else null",
  "location": "Job location or 'Remote' if found, else null",
  "rate": "Pay rate or salary range if mentioned (e.g. $70/hr, $120k/yr), else null",
  "job_type": "Type of contract (e.g. C2C, C2H, W2, Full-time, Contract) if found, else null",
  "work_style": "Mode of work (e.g. Remote, Hybrid, Onsite) if found, else null",
  "recruiter_name": "Name of the recruiter or poster (e.g. Sarah Jones) if found, else null",
  "recruiter_email": "Email address found in the description (e.g. hiring@company.com), else null",
  "recruiter_phone": "Phone number if found (e.g. +1-555-0102), else null"
}

IMPORTANT:
- Look for patterns like "Posted by [Name]", "Contact: [Name]", "Send resume to [Email]", or simple email addresses embedded in the text.
- If multiple emails exist, prefer the one labeled "Contact" or "Hiring".
- Return ONLY the valid JSON object. No markdown formatting.

Input Text:
"${text.substring(0, 15000)}" 
  `;
};

export const getContactInfoPrompt = (text: string): string => {
  return `
You are a Data Extraction Specialist.
Task: Extract Job Role, Location, Recruiter Name and Email from the job description below.
Output: JSON ONLY. No other text.
Format:
{
  "job_role": "Job Title (e.g. Java Engineer) or null",
  "location": "Location (e.g. New York, Remote) or null",
  "rate": "Rate (e.g. $70/hr) or null",
  "job_type": "Contract Type (e.g. C2C, C2H, Fulltime) or null",
  "work_style": "Work Mode (e.g. Remote, Hybrid, On-site) or null",
  "recruiter_name": "Name (e.g. John Doe) or null",
  "recruiter_email": "Email (e.g. john@company.com) or null",
  "recruiter_phone": "Phone number or null"
}
Input:
"${text.substring(0, 15000)}"
`;
};
