const fs = require('fs');
const files = [
  'src/app/unit-dashboard/_layout.tsx',
  'src/app/unit-dashboard/index.tsx',
  'src/app/unit-dashboard/participants.tsx',
  'src/app/unit-dashboard/attendance.tsx',
  'src/app/unit-dashboard/analytics.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Layout and Background
  content = content.replaceAll("bg-[#F8FAFC]", "bg-[#030E21]");
  content = content.replaceAll("backgroundColor: '#F8FAFC'", "backgroundColor: '#030E21'");
  content = content.replaceAll("backgroundColor: '#F0F9FF'", "backgroundColor: '#030E21'");
  
  // Headers
  content = content.replaceAll("bg-ssf-primary", "bg-[#0B1F33]");
  content = content.replaceAll("text-ssf-gold", "text-emerald-400");
  
  // Cards and Panels
  content = content.replaceAll("bg-white", "bg-[#0B1F33]");
  content = content.replaceAll("border-ssf-primary/10", "border-white/10");
  content = content.replaceAll("border-ssf-primary/20", "border-white/10");
  content = content.replaceAll("border-ssf-primary/80", "border-emerald-500/50");
  content = content.replaceAll("border-ssf-primary/100", "border-emerald-500");
  
  // Text Colors
  content = content.replaceAll("text-slate-800", "text-white");
  content = content.replaceAll("text-slate-600", "text-white/70");
  content = content.replaceAll("text-slate-500", "text-white/60");
  content = content.replaceAll("text-slate-400", "text-white/40");
  
  // Tabs
  content = content.replaceAll("activeTab === tab.key ? 'bg-[#0B1F33]' : 'bg-[#0B1F33] border border-white/10'", "activeTab === tab.key ? 'bg-[#10B981]' : 'bg-[#0B1F33] border border-white/10'");
  content = content.replaceAll("activeTab === tab.key ? 'bg-ssf-primary' : 'bg-white border border-ssf-primary/20'", "activeTab === tab.key ? 'bg-[#10B981]' : 'bg-[#0B1F33] border border-white/10'");
  
  // Picker text color for dark mode
  content = content.replaceAll("color: '#0F172A'", "color: '#FFFFFF'");
  content = content.replaceAll('color="#065F46"', 'color="#10B981"');
  
  // Remaining texts
  content = content.replaceAll("text-ssf-primary", "text-emerald-400");
  content = content.replaceAll("bg-ssf-primary/10", "bg-emerald-500/10");
  content = content.replaceAll("bg-ssf-primary/5", "bg-emerald-500/5");

  // Fix up specific colors from before that were sky
  content = content.replaceAll("border-sky-50", "border-white/10");
  content = content.replaceAll("border-sky-100", "border-white/10");
  content = content.replaceAll("bg-sky-50", "bg-emerald-500/5");
  content = content.replaceAll("bg-sky-100", "bg-emerald-500/10");
  content = content.replaceAll("text-sky-600", "text-emerald-400");
  content = content.replaceAll("text-sky-700", "text-emerald-400");

  fs.writeFileSync(file, content);
});
