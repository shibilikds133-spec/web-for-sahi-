const fs = require('fs');
const files = [
  'src/app/unit-dashboard/index.tsx',
  'src/app/unit-dashboard/participants.tsx',
  'src/app/unit-dashboard/attendance.tsx',
  'src/app/unit-dashboard/analytics.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replaceAll("bg-[#0B1F33]", "bg-white/5");
  content = content.replaceAll("bg-white/10", "bg-white/5");
  content = content.replaceAll("bg-white/20", "bg-white/10");
  fs.writeFileSync(file, content);
});
