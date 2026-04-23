const { analyzeResumeText } = require('../services/atsAnalyzerService')
const { generateResumeContent } = require('../services/aiResumeService')

async function main() {
  const sampleResumeText = [
    'Jane Doe',
    'jane@example.com | 9999999999 | linkedin.com/in/janedoe',
    'SKILLS',
    'React, Node.js, MongoDB, Express, ATS optimization',
    'PROJECTS',
    '- Built a resume analyzer with React and Node.js for ATS workflows',
    'EXPERIENCE',
    '- Developed APIs and implemented file upload using multer and pdf parsing',
    'EDUCATION',
    'B.Tech Computer Science | ABC University | 2026',
    'CERTIFICATIONS',
    '- AWS Cloud Practitioner'
  ].join('\n')

  const sampleJobDescription = 'We are looking for a React developer with Node.js, MongoDB, ATS optimization, resume builder, multer, and pdf parsing experience.'

  const analysis = analyzeResumeText(sampleResumeText, sampleJobDescription)
  console.log('ATS analysis smoke test:', {
    score: analysis.score,
    matchedKeywords: analysis.matchedKeywords.slice(0, 6),
    missingKeywords: analysis.missingKeywords.slice(0, 6),
    readyForATS: analysis.readyForATS,
  })

  const generated = await generateResumeContent({
    personalInfo: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '9999999999',
      linkedin: 'linkedin.com/in/janedoe'
    },
    skills: ['React', 'Node.js', 'MongoDB', 'Express'],
    education: [{ degree: 'B.Tech Computer Science', institution: 'ABC University', year: '2026', cgpa: '8.8' }],
    projects: [{ title: 'Resume Analyzer', description: 'Built a resume analyzer platform with ATS scoring and keyword detection', techStack: 'React, Node.js, MongoDB', link: 'https://example.com' }],
    certifications: ['AWS Cloud Practitioner'],
    experience: [{ company: 'Track2Hired', role: 'Software Engineer Intern', duration: '2025', description: 'Developed resume workflow features and optimized backend APIs' }],
    achievements: ['Improved workflow speed by 25%'],
    targetJobRole: 'Full Stack Developer',
    targetJobDescription: sampleJobDescription,
    templateKey: 'modern-clean'
  })

  console.log('Resume generation smoke test:', {
    templateKey: generated.templateKey,
    hasHtml: Boolean(generated.htmlContent),
    plainTextLength: generated.plainText.length,
    injectedKeywords: generated.injectedKeywords,
  })
}

main().catch((error) => {
  console.error('Resume feature smoke test failed:', error)
  process.exit(1)
})