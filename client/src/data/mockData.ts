export const stats = [
  { label: 'Study files', value: '12', trend: '+3 this week', icon: '📚' },
  { label: 'Practice streak', value: '8 days', trend: '+2%', icon: '🔥' },
  { label: 'Weak topics', value: '4', trend: 'Needs review', icon: '🎯' },
  { label: 'Avg. accuracy', value: '82%', trend: '+7%', icon: '📈' },
];

export const quickActions = [
  { label: 'Upload new materials', icon: '⬆️' },
  { label: 'Practice selected files', icon: '🧠' },
  { label: 'Review weak topics', icon: '📌' },
  { label: 'Ask AI about my materials', icon: '💬' },
];

export const recentMaterials = [
  { name: 'DBMS Unit 1.pdf', subject: 'DBMS', type: 'PDF', status: 'Ready', progress: '100%' },
  { name: 'Computer Networks.pdf', subject: 'Networking', type: 'PDF', status: 'Analyzing', progress: '72%' },
  { name: 'AI Notes.docx', subject: 'Artificial Intelligence', type: 'DOCX', status: 'Ready', progress: '100%' },
];

export const studyFiles = [
  { id: 1, name: 'Mathematics Chapter 1', type: 'PDF', size: '2.4 MB', subject: 'Mathematics', progress: '100%', status: 'Ready', lastPracticed: '2 days ago' },
  { id: 2, name: 'Physics Notes', type: 'PDF', size: '5.2 MB', subject: 'Physics', progress: '85%', status: 'Processing', lastPracticed: 'Today' },
  { id: 3, name: 'DBMS Unit 2', type: 'DOCX', size: '1.8 MB', subject: 'DBMS', progress: '100%', status: 'Ready', lastPracticed: '5 days ago' },
  { id: 4, name: 'AI Slides', type: 'PPTX', size: '3.5 MB', subject: 'AI', progress: '72%', status: 'Analyzing', lastPracticed: 'Yesterday' },
];

export const practiceSummary = {
  title: 'Focus on weak topics',
  subtitle: 'Examples generated from DBMS, Physics, and AI files',
  difficulty: 'Mixed',
  questions: 10,
};

export const generatedQuestions = [
  { id: 1, question: 'Which law explains that every action has an equal and opposite reaction?', answer: 'Newton\'s Third Law', source: 'Physics_Chapter_2.pdf' },
  { id: 2, question: 'What is the primary purpose of normalization in DBMS?', answer: 'Reduce redundancy and improve data integrity', source: 'DBMS_Unit_1.pdf' },
  { id: 3, question: 'Which learning approach is best for adapting practice based on performance?', answer: 'Adaptive assessment and knowledge-gap analysis', source: 'AI_Notes.docx' },
];
