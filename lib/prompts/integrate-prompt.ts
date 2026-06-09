/**
 * AI Prompt for Resume Skill Integration
 * Integrates missing skills into resume while preserving context and professional tone
 */

export const getIntegratePrompt = (
  resumeText: string,
  missingSkills: string[],
  jd: string
): string => {
  return `
    Act as an expert professional resume writer with 20+ years of experience. Seamlessly integrate the provided skills into an existing resume while preserving the original project scope and context. Make sure not to change already present skills when integrating or adding new skills.

    Keep the JD in memory. Ignore certifications present in given JD.

    Inputs Required:
    ·       Skills to Integrate: ${missingSkills.join(', ')} [Consider Missing Skills, Gaps, and Partial Matches from above]
    ·       Current Resume:
    ${resumeText}

    Instructions:

    As you kept JD and missing skills in memory, Analyze resume clients and time frame that resume should meet JD,

    for eg

    8+ years of Python experience (Django, Flask, Pyramid, Tornado) with testing/linting frameworks (Pytest, Pylint).  
    5+ years of advanced SQL/SnowSQL. 
    ETL/ELT:
    5+ years with SSIS (support and migration) 
    4+ years with Azure Data Factory, 
    3+ years with Databricks (preferred). 
    Cloud & Pipeline Expertise:
    4+ years in Azure (Data Factory, Databricks, DevOps),
    3+ years with Snowflake ETL/ELT, 
    6+ years designing and maintaining data pipelines 

    Analyze that above JD points are covered From resume experience and time frame; make sure your calculations are perfect and if resume is 6+ and JD requirement is 8+, add only 6+; don't change original resume timeframe. 

    If JD is not given in above format; make sure to cover the skills in most recent projects and 6+ years if your resume is 10+ years.

    Skill Update Logic Flow:
    When JD mentions Java and/or Python:
    Only update with relevant skills from the JD
    If Java is already present in the resume → Focus exclusively on Java-related skills from JD
    Ignore Python skills unless absolutely required by project scope
    Don't add Python to resume skills if Java is already present

    Only update with relevant skills from the JD
    If Python is already present in the resume → Focus exclusively on Python-related skills from JD
    Ignore Java skills unless absolutely required by project scope
    Don't add Java to resume skills if Python is already present

    When updating Java-focused resume:
    Prioritize Java ecosystem skills from JD (Spring, Hibernate, etc.)
    Add complementary Java-related technologies
    Skip Python even if mentioned in JD
    Only mention Python if it's a compulsory project requirement that must be documented

    When updating Python-focused resume:
    Prioritize Python ecosystem skills from JD 
    Add complementary Python-related technologies
    Skip Java even if mentioned in JD
    Only mention Java if it's a compulsory project requirement that must be documented

    When Java is NOT in resume but Python is:
    Then follow Python-focused update rules
    This scenario wasn't specified but logically follows your pattern

    When Python is NOT in resume but Java is:
    Then follow Java-focused update rules
    This scenario wasn't specified but logically follows your pattern
    Example application:
    Resume has: Java, Spring Boot, SQL
    JD mentions: Java, Python, Microservices, AWS, Django
    Update with: Microservices, AWS (Java-relevant skills only)
    Ignore: Python, Django (unless compulsory for project scope)
    This ensures Java remains the primary focus when it's already established in the resume, maintaining skill coherence and specialization.


    Don’t: Don't mention anything in brackets. 
    Don't write as 
    Python (including frameworks Django, Flask and testing with Pytest, Pylint) with brackets as it looks like you are copying and pasting JD.

    Always Write as points without brackets.

    Don't mention 8+ years of Python or 5+ years with SSIS as copying and pasting JD.

    Key Principles to Follow:
    Integrate Technologies Naturally: Weave your skills, tools, and frameworks directly into the sentences of your bullet points.
    Use Prose, Not Lists: Describe your technical environment and actions in full sentences without resorting to parenthetical asides.
    Quantify Experience Naturally: Instead of "X+ years," use phrases that imply seniority and depth of experience, such as "extensive experience with," "proven expertise in," or "deep knowledge of."
    
    Example Transformation:
    Instead of this (which looks copied):
    Developed web applications using Python, including frameworks Django and Flask, with testing using Pytest and Pylint.
    8+ years of experience with Python and 5+ years with SSIS for ETL processes.
    Write like this (which looks professional and integrated):
    Professional Experience
    Senior Developer | XYZ Corp | Jan 2018 – Present
    Designed and developed full-stack web applications using Python with the Django and Flask frameworks, ensuring code quality through comprehensive testing suites built with Pytest and adherence to standards validated by Pylint.
    Architected and maintained robust, scalable ETL pipelines to process high-volume data, leveraging SQL Server Integration Services extensively for data warehousing and integration tasks.
    Applied deep knowledge of Python across multiple long-term projects to build backend services and automation tools, contributing to significant reductions in manual processing time.
    
    Skills Section Format:
    Technical Skills
    Programming Languages: Python, SQL, JavaScript
    Frameworks & Libraries: Django, Flask, React
    Testing & QA: Pytest, Unit Testing, Pylint, Selenium
    Data Tools & ETL: SQL Server Integration Services, SSAS, Azure Data Factory
    Databases: PostgreSQL, MySQL, SQL Server

    Make sure to update summary points related to skills updated in the experience section and skills section.

    Don't update certifications if missing in resume and present in given JD.Ignore certifications present in given JD.


    Rule for Updating Version References inResumes

    Consider Angular Version for example and follow this rule for any version updating.
    1. Core Version Mapping Logic:
    For any project experience or role description, the Angular version mentioned must reflect the version actively used during that specific timeframe.
    Use the following release timeline to map the experience period to the correct Angular version. Assume a project started using the latest stable version at its start date.
    * Angular 14: Before November 2022
    * Angular 15: November 2022 - May 2023
    * Angular 16: May 2023 - November 2023
    * Angular 17: November 2023 - May 2024
    * Angular 18: May 2024 - November 2024
    * Angular 19: November 2024 - May 2025
    * Angular 20: May 2025 - November 2025
    * Angular 21: November 2025 - Present
    Update Example (Project Description): If a candidate lists "Angular 14+" for a project spanning Jan 2022 - Dec 2023, update it to specify the progression, e.g., "Angular 14 (Jan '22 - Nov '22), upgraded to Angular 15/16 (Dec '22 - Dec '23)".
    
    2. Rule for the "Skills" Section & Technical Summary:
    In the "Skills" section or a technical summary profile, always list the single highest version the candidate has verified, hands-on experience with, based on their total experience timeline.
    Do not list a version higher than their latest project's version.
    Example: If their latest project ended in August 2024 using Angular 18, list "Angular 18" or "Angular (Up to v18)" in the skills summary—not Angular 20 or 21.
    
    3. Rule for the "Professional Summary" or "Objective" at the Top:
    This section should reflect current, overall capability. Update the version here to be one major version below the absolute latest stable release (unless their experience includes the very latest version).
    Rationale: It shows familiarity with the modern ecosystem without overclaiming direct experience on a brand-new, potentially un-used version.
    Example (Current Date: Early 2026): The latest stable version is Angular 21 (released Nov 2025). Therefore, in the professional summary, phrase it as: "X years of experience with modern Angular frameworks (up to Angular 20)."

    Instructions:

    1.     Analyze Current Resume 

    o   Identify existing project scope, domain, and technical context

    o   Map current skills and technologies already present

    o   Note the role focus and industry alignment

    2.     Strategic Skills Integration

    o   Integrate new skills naturally into existing bullet points where contextually appropriate

    o   Maintain the original project narrative and business impact

    o   Ensure technical coherence (don't force unrelated technologies together)

    o   Preserve the professional tone and action-verb structure

    3.     Expansion When Needed

    o   Create new bullet points only when skills cannot be organically integrated

    o   Ensure new points align with the existing project scope and timeline

    o   Maintain consistency in formatting and impact description

    ### IMPORTANT OUTPUT INSTRUCTIONS ###
    
    Perform all the simplified text analysis, "Modified Existing Points", "Old/New" comparisons, and "Calculations" requested above.
    However, you MUST encapsulate all of that output into the following JSON structure so the system can read it.
    
    Place all your detailed text analysis, lists of modified points, and reasoning INSIDE the "analysis_summary" field.
    
    {
      "candidate_name": "<Extract Name from Resume>",
      "changes": [
        {
          "type": "MODIFY",
          "old": "<exact original bullet point from resume>",
          "new": "<updated bullet point with integrated skills>",
          "reason": "<reason for change>",
          "section": "<Experience: Client Name | Summary | Skills>"
        },
        {
           "type": "ADD",
           "anchor": "<existing unique bullet point to place this after>",
           "new": "<new bullet point with integrated skills>",
           "reason": "<context>",
           "section": "<Experience: Client Name | Summary | Skills>"
        }
      ],
      "analysis_summary": "<PUT YOUR ENTIRE TEXT REPORT HERE: The calculations, the 'Modified Existing Points' display, the version analysis, and the 'DESIRED OUTPUT' block. Use \\n for newlines.>",
      "optimized_match_percentage": <number 0-100>,
      "gap_reasons": ["<reason 1>", "<reason 2>"]
    }
    
    IMPORTANT: Return ONLY the JSON object. Do not provide any conversational text or markdown formatting outside the JSON.
  `;
};
