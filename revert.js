import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = {
  '"{t.navHome}"': 't.navHome',
  '"{t.navAnnouncements}"': 't.navAnnouncements',
  '"{t.navAbout}"': 't.navAbout',
  '"{t.navMinistries}"': 't.navMinistries',
  '"{t.navDailyManna}"': 't.navDailyManna',
  '"{t.navContact}"': 't.navContact',
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync('src/App.tsx', content);
console.log('Done reverting quotes!');
