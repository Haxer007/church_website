import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = {
  '"Home"': '"{t.navHome}"',
  '"Announcements"': '"{t.navAnnouncements}"',
  '"About"': '"{t.navAbout}"',
  '"Ministries"': '"{t.navMinistries}"',
  '"Daily Manna"': '"{t.navDailyManna}"',
  '"Contact"': '"{t.navContact}"',
  'Welcome to Zion AG Church': '{t.heroWelcome}',
  "Encounter God's Presence.": '{t.heroTitle}',
  'Join us this Sunday to experience faith, family, and the transformative power of worship.': '{t.heroDesc}',
  'Join Us This Sunday': '{t.joinSunday}',
  'Watch Live': '{t.watchLive}',
  'About Our Church': '{t.aboutTitle}',
  'Zion AG Church is located on Maruthi Nagar Main Road, Madiwala — easily accessible from BTM Layout, Koramangala, HSR Layout, Electronic City and Bannerghatta Road.': '{t.aboutP1}',
  'Zion AG Church is your sacred space to encounter the Saviour of your soul. Come with an <span className="font-bold text-[#8a5f2b]">OPEN HEART</span> — the peace, joy, strength, and transformation He provides are best experienced, not just explained.': '{t.aboutP2.split("OPEN HEART")[0]}<span className="font-bold text-[#8a5f2b]">{t.aboutP2.split("OPEN HEART")[1]}</span>{t.aboutP2.split("OPEN HEART")[2]}',
  '📅 Stay connected beyond Sundays! Explore our sermons, updates, and upcoming events.': '{t.aboutBanner}',
  '"Join us and discover what it truly means to live in the light of God\'s love and purpose!"': '{t.aboutQuote}',
  'Rev. Ps. David Paul': '{t.pastorName}',
  'Senior Pastor · Zion AG Church, Madiwala': '{t.pastorTitle}',
  'Graduated from Southern Asia Bible College. Rev. David and his wife <span className="font-semibold text-[#8a5f2b]">Pastor Sheeba</span>, along with their two children, serve the Lord in the bustling hub of Madiwala, Bengaluru.': '{t.pastorDesc.split("Pastor Sheeba")[0]}<span className="font-semibold text-[#8a5f2b]">{t.pastorDesc.split("Pastor Sheeba")[1]}</span>{t.pastorDesc.split("Pastor Sheeba")[2]}',
  '✦ STAY UPDATED ✦': '{t.stayUpdated}',
  '>Announcements<': '>{t.announcementsTitle}<',
  '✦ GROW WITH US ✦': '{t.growWithUs}',
  '>Our Ministries<': '>{t.ministriesTitle}<',
  '>Promise Prayers<': '>{t.promisePrayers}<',
  'Start every month in the presence of God. The promise word of the month is shared through the man of God at 5 AM on the 1st of every month.': '{t.promiseDesc}',
  '🗓 Add to your calendar': '{t.addToCalendar}',
  '>Daily Manna<': '>{t.navDailyManna}<',
  '>A word for today<': '>{t.dailyMannaTitle}<',
  '>Reflection<': '>{t.reflection}<',
  'New Verse <span className="text-lg transition-transform duration-500 group-hover:rotate-180">↻</span>': '{t.newVerse.split("↻")[0]}<span className="text-lg transition-transform duration-500 group-hover:rotate-180">↻</span>',
  '>Connect With Us<': '>{t.connectWithUs}<',
  '>Visit, call, or send a prayer request<': '>{t.contactTitle}<',
  'We would be glad to help you plan a visit, receive your prayer request, or connect you with the right ministry.': '{t.contactDesc}',
  '>Call / WhatsApp<': '>{t.callWhatsapp}<',
  '>Follow us @ZionAGMadiwala<': '>{t.followUs}<',
  '>Send a Prayer Request<': '>{t.sendPrayerRequest}<',
  '>We pray for every request<': '>{t.prayForRequest}<',
  'placeholder="Share your prayer request..."': 'placeholder={t.prayerPlaceholder}',
  '>Send via WhatsApp<': '>{t.sendWhatsapp}<',
  '>Zion AG Church, Madiwala<': '>{t.footerName}<',
  'Sunday morning services: 8:00 AM and 9:30 AM at Christ University College.': '{t.footerServices}'
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync('src/App.tsx', content);
console.log('Done!');
