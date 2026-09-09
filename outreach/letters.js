const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, BorderStyle } = require('docx');

const SIG = [
  "With respect,",
  "",
  "Premasis Satman",
  "Executive Director, 5Talents Magazine",
  "5talentsmag.com"
];

const CLOSE = [
  "Our readers are young Indian Christians — students, and people in their first jobs. They are not scholars, and I would want this written for them: about 1,000 to 1,500 words, no footnotes, the kind of thing that holds a nineteen-year-old reading on a phone. If that sounds like the opposite of what you usually write, that is rather the point.",
  "I should be honest that we cannot pay yet. What we offer is a byline, a careful edit, your approval before anything runs, your copyright retained, and readers — our subscriber list, the JELC network of 7,000, and Christian community groups across India.",
  "If this subject does not suit you, tell me what would. I would rather publish the piece you actually want to write.",
  "Would you be willing? I would want it by 31 October for our early issues, though I am not rigid about that."
];

const INTRO = "I am Premasis Satman, editor of 5Talents Magazine, a Christian magazine published from Hyderabad since 2012. We published eighteen issues, stopped in 2014, and relaunch in January 2027. The archive is at 5talentsmag.com.";

const letters = [
  {
    college: "BISHOP'S COLLEGE, KOLKATA",
    name: "Rev. Dr Swarup Bar",
    role: "Acting Principal / Christian Theology",
    email: "swarup.bar20@yahoo.com",
    subject: "A commission for 5Talents Magazine — what grace means to someone who is failing",
    body: [
      INTRO,
      "I found you through the Bishop's College faculty listing, where you teach Christian Theology and serve as Acting Principal.",
      "I would like to commission one piece from you: on grace, written for someone who is failing. Our readers are young enough that most of them have not yet succeeded at anything, and many of them privately believe God is disappointed in them. They have heard the word grace a thousand times in church and could not tell you what it does. I would like the doctrine explained by someone who teaches it — not softened, just made usable."
    ]
  },
  {
    college: "BISHOP'S COLLEGE, KOLKATA",
    name: "Rev. Dr Sunil M. Caleb",
    role: "Theology and Ethics",
    email: "smcaleb@gmail.com",
    subject: "A commission for 5Talents Magazine — is ambition a sin?",
    body: [
      INTRO,
      "I found you through the Bishop's College faculty listing, where you teach Theology and Ethics.",
      "I would like to commission one piece from you, and the working title is a question our readers ask constantly without ever saying it aloud: is ambition a sin? They are told in the same week to be humble and to succeed — by their churches, their parents and their employers — and nobody has ever helped them hold those two things together. An ethicist's answer would be worth a great deal more than the motivational one they usually get."
    ]
  },
  {
    college: "BISHOP'S COLLEGE, KOLKATA",
    name: "Dr Lalmuanpuii Hmar",
    role: "New Testament / Editor, Indian Journal of Theology",
    email: "indianjournaloftheology@gmail.com",
    subject: "A commission for 5Talents Magazine — the parable of the talents, read properly",
    body: [
      INTRO,
      "I found you through the Bishop's College faculty listing, where you teach New Testament, and I know you edit the Indian Journal of Theology.",
      "I would like to commission one piece from you: the parable of the talents, read properly. Our magazine takes its name from Matthew 25 and most of our readers know only the cliché version — that it is a story about working hard. I suspect a New Testament scholar would tell them something more uncomfortable, and I would like you to.",
      "One thing I should say plainly, given what you edit: I am not asking you to write down to anyone. I am asking for the same rigour, aimed at a nineteen-year-old."
    ]
  },
  {
    college: "BISHOP'S COLLEGE, KOLKATA",
    name: "Rev. Dr B. Silpa Rani",
    role: "Old Testament",
    email: "bsilparani68@gmail.com",
    subject: "A commission for 5Talents Magazine — what Job is for",
    body: [
      INTRO,
      "I found you through the Bishop's College faculty listing, where you teach Old Testament.",
      "I would like to commission one piece from you: what the book of Job is actually for, written for a reader whose prayers are not being answered. Our readers are young, and a good many of them are watching a parent be ill, or failing an exam they cannot afford to fail, and being told to have more faith. Job is the book the church hands them and then never explains. I would like an Old Testament scholar to explain it."
    ]
  },
  {
    college: "BISHOP'S COLLEGE, KOLKATA",
    name: "Rev. Dr D. Isaac Devadoss",
    role: "History of Christianity",
    email: "issakdoss@gmail.com",
    subject: "A commission for 5Talents Magazine — the Indian church is older than most European ones",
    body: [
      INTRO,
      "I found you through the Bishop's College faculty listing, where you teach the History of Christianity.",
      "I would like to commission one piece from you. Most of our readers believe Christianity arrived in India with the British. They have never heard of Thomas, or Malabar, or the Syrian churches that were here before most of Europe was Christian. That gap matters, because the accusation thrown at them — that their faith is a foreign import, that they have abandoned their culture — is one they cannot answer.",
      "I would like a historian to give them the answer."
    ]
  },
  {
    college: "BISHOP'S COLLEGE, KOLKATA",
    name: "Rev. Dr Gifta Angline Kumar",
    role: "Religions",
    email: "giftaangline@gmail.com",
    subject: "A commission for 5Talents Magazine — talking about Jesus without wrecking the friendship",
    body: [
      INTRO,
      "I found you through the Bishop's College faculty listing, where you teach Religions.",
      "I would like to commission the piece our readers ask for most and receive least: how to talk about Jesus with a Hindu or Muslim friend without damaging the friendship. Almost everything that exists on this is either evangelism technique or nothing at all, and neither helps a twenty-year-old who genuinely loves the person sitting next to her in class.",
      "Given that you teach religions rather than methods, I would like the version that takes the other person seriously."
    ]
  },
  {
    college: "TRINITY THEOLOGICAL COLLEGE, DIMAPUR",
    name: "Rev. Dr Hukato N. Shohe",
    role: "Principal / Christian Theology",
    email: "hukato.shohe@ttc.edu.in",
    subject: "A commission for 5Talents Magazine — what the rest of India could learn from the Naga church",
    body: [
      INTRO,
      "I found you through the Trinity faculty listing, where you teach Christian Theology and serve as Principal.",
      "I would like to commission one piece from you. Our readers are spread across India, and most of them know almost nothing about the church in the Northeast beyond the fact that it exists. They do not know what it has been through, what it has built, or what it has learned. I would like a piece from inside it — what a young Christian in Hyderabad or Chennai could learn from the Naga church, written by someone who leads a college within it.",
      "I am aware that could be written as a boast or as a lament. I would rather have it honest than either."
    ]
  },
  {
    college: "TRINITY THEOLOGICAL COLLEGE, DIMAPUR",
    name: "Dr Shelly Swu",
    role: "Academic Dean / New Testament",
    email: "shelly.swu@ttc.edu.in",
    subject: "A commission for 5Talents Magazine — the women in the New Testament nobody preaches about",
    body: [
      INTRO,
      "I found you through the Trinity faculty listing, where you teach New Testament and serve as Academic Dean.",
      "I would like to commission one piece from you: on the women in the New Testament our readers have never heard a sermon about. Junia, Phoebe, Lydia, Priscilla. Young Christian women in India are shaped by a very small set of examples, most of them chosen to teach submission. There is a great deal more in the text than that, and I would like a New Testament scholar to lay it out rather than a campaigner."
    ]
  },
  {
    college: "TRINITY THEOLOGICAL COLLEGE, DIMAPUR",
    name: "Dr Imsu Longchar",
    role: "Old Testament",
    email: "imsu.longchar@ttc.edu.in",
    subject: "A commission for 5Talents Magazine — why so much of the Old Testament feels irrelevant",
    body: [
      INTRO,
      "I found you through the Trinity faculty listing, where you teach Old Testament.",
      "I would like to commission one piece from you, on a question our readers are too embarrassed to ask: why does so much of the Old Testament seem to have nothing to do with me? They skip most of it. They read Psalms and Proverbs and treat the rest as background. I would like a scholar to show them what they are walking past — not by defending the text, but by making one difficult part of it come alive."
    ]
  },
  {
    college: "TRINITY THEOLOGICAL COLLEGE, DIMAPUR",
    name: "Dr Kavikato Zhimo",
    role: "Missiology",
    email: "kavikato.zhimo@ttc.edu.in",
    subject: "A commission for 5Talents Magazine — what mission means when you are staying put",
    body: [
      INTRO,
      "I found you through the Trinity faculty listing, where you teach Missiology.",
      "I would like to commission one piece from you. Our readers are told constantly that mission means going somewhere. Almost none of them will go. They will work in offices in Hyderabad, Bangalore and Chennai, and many of them quietly conclude that the serious Christian life is something happening elsewhere, to other people.",
      "I would like a piece on what mission actually means when you are staying put — written by someone who teaches the discipline rather than by a conference speaker."
    ]
  },
  {
    college: "PRESBYTERIAN THEOLOGICAL SEMINARY, DEHRADUN",
    name: "Dr Chanreiso Lungleng",
    role: "Academic Dean / Old Testament",
    email: "cl@ptsindia.com",
    subject: "A commission for 5Talents Magazine — the Psalms that are angry",
    body: [
      INTRO,
      "I found you through the PTS faculty listing, where you teach Old Testament and serve as Academic Dean.",
      "I would like to commission one piece from you: on the Psalms that are angry. Our readers are handed Psalm 23 and Psalm 91 and taught that prayer is calm. Then something goes badly wrong and they have no language for it, because nobody showed them that a great deal of the Psalter is complaint, and that it is in scripture on purpose.",
      "I would like an Old Testament scholar to give them permission, and the vocabulary."
    ]
  },
  {
    college: "PRESBYTERIAN THEOLOGICAL SEMINARY, DEHRADUN",
    name: "Rev. Dr Vijai Tagore",
    role: "New Testament",
    email: "vt@ptsindia.com",
    subject: "A commission for 5Talents Magazine — how to read the Bible without a teacher",
    body: [
      INTRO,
      "I found you through the PTS faculty listing, where you teach New Testament.",
      "I would like to commission one piece from you: how to actually read the Bible on your own. Our readers have apps, plans and devotionals, and almost none of them have been taught to read a passage and work out what it says. They rely on someone else telling them.",
      "I would like a New Testament scholar to teach that in a thousand words — one method, worked through one passage, so a reader can do it again next week without us."
    ]
  },
  {
    college: "PRESBYTERIAN THEOLOGICAL SEMINARY, DEHRADUN",
    name: "Rev. Dr Mohan Chacko",
    role: "Principal Emeritus / Missiology",
    email: "mohanchacko@ptsindia.com",
    subject: "A commission for 5Talents Magazine — what has changed, and what has not",
    body: [
      INTRO,
      "I found you through the PTS faculty listing, where you are Principal Emeritus and teach Missiology.",
      "I would like to commission one piece from you that only someone with your years could write: what has genuinely changed for the Indian church across your working life, and what has not changed at all despite everyone insisting it has.",
      "Our readers are young. They assume the church they have inherited is the church that has always existed. A piece that shows them the shape of the last forty years — honestly, including the parts that went wrong — would give them a sense of proportion that nothing else can."
    ]
  },
  {
    college: "PRESBYTERIAN THEOLOGICAL SEMINARY, DEHRADUN",
    name: "Rev. Dr Matthew Ebenezer",
    role: "Church History",
    email: "matthew.ebenezer@gmail.com",
    subject: "A commission for 5Talents Magazine — the Indian Christians nobody taught us about",
    body: [
      INTRO,
      "I found you through the PTS faculty listing, where you teach Church History.",
      "I would like to commission one piece from you: the Indian Christians our readers have never been taught about. Pandita Ramabai, Sadhu Sundar Singh, Krishna Pillai, whoever you would choose. Our readers can name American preachers and almost no Indian ones, and they have quietly absorbed the idea that the important Christians happened somewhere else.",
      "One piece, two or three figures, told well, would begin to correct that."
    ]
  },
  {
    college: "HINDUSTAN BIBLE INSTITUTE & COLLEGE, CHENNAI",
    name: "Rt Rev. Dr Paul R. Gupta",
    role: "Chairman / Missiology",
    email: "bobbygupta214@aol.com",
    subject: "A commission for 5Talents Magazine — leading something you did not start",
    body: [
      INTRO,
      "I found you through the HBI faculty listing, where you serve as Chairman and teach Missiology.",
      "I would like to commission one piece from you on something our readers will face and never be prepared for: inheriting a work you did not begin. Many of them will take over a family business, a ministry, a church, or a role someone else built, and will spend years wondering whether anything they achieve is really theirs.",
      "You have led an institution with a long history. I would like the honest version of what that requires."
    ]
  },
  {
    college: "HINDUSTAN BIBLE INSTITUTE & COLLEGE, CHENNAI",
    name: "Rev. Dr Johnson R.",
    role: "Principal / New Testament",
    email: "johnson.rajen@gmail.com",
    subject: "A commission for 5Talents Magazine — what Paul was actually like",
    body: [
      INTRO,
      "I found you through the HBI faculty listing, where you teach New Testament and serve as Principal.",
      "I would like to commission one piece from you: what Paul was actually like. Our readers know him as a source of instructions — mostly the difficult ones. They do not know him as a man who was frightened, who fell out with his friends, who wrote in a temper and then explained himself.",
      "A New Testament scholar showing them the person behind the epistles would change how they read the letters entirely."
    ]
  },
  {
    college: "HINDUSTAN BIBLE INSTITUTE & COLLEGE, CHENNAI",
    name: "Rev. Dr Greeto Racharia G.",
    role: "Academic Dean / Theology",
    email: "gracharia@yahoo.com",
    subject: "A commission for 5Talents Magazine — does God have an opinion about my career?",
    body: [
      INTRO,
      "I found you through the HBI faculty listing, where you teach Theology and serve as Academic Dean.",
      "I would like to commission one piece from you on the question our readers actually lose sleep over: does God have a specific plan for my career, and what happens if I miss it? A great many young Indian Christians are paralysed by this — convinced there is one correct choice and that they are about to make the wrong one.",
      "I would like a theologian to tell them what the doctrine of providence does and does not promise."
    ]
  },
  {
    college: "HINDUSTAN BIBLE INSTITUTE & COLLEGE, CHENNAI",
    name: "Dr Paul Ebenezer",
    role: "Missiology and History",
    email: "paulebi77@gmail.com",
    subject: "A commission for 5Talents Magazine — being a minority, and not being a victim",
    body: [
      INTRO,
      "I found you through the HBI faculty listing, where you teach Missiology and History.",
      "I would like to commission one piece from you on something our readers live with daily and rarely discuss: how to be a religious minority in India without becoming either defensive or dishonest about it. They encounter suspicion at work and at college, and their two available responses seem to be silence or grievance.",
      "Given that you teach both mission and history, I would like a piece that offers them a third."
    ]
  },
  {
    college: "AIZAWL THEOLOGICAL COLLEGE, MIZORAM",
    name: "Dr Rosy Zoramthangi Ralte",
    role: "Head of Department / Old Testament",
    email: "rosyralte@atc.edu.in",
    subject: "A commission for 5Talents Magazine — Psalm 139 and how young women see themselves",
    body: [
      INTRO,
      "I found you through the Aizawl Theological College faculty listing, where you head the Old Testament department.",
      "I would like to commission one piece from you on Psalm 139 — specifically the line about being fearfully and wonderfully made, and what it means for a young woman who does not like what she sees in the mirror.",
      "That verse is quoted constantly in India and almost never explained. Our readers have it on posters and no idea what the Psalm is actually doing. An Old Testament scholar taking it seriously, in its whole context, would be worth far more to them than another poster."
    ]
  },
  {
    college: "AIZAWL THEOLOGICAL COLLEGE, MIZORAM",
    name: "Rev. Dr Laldingluaia",
    role: "Head of Department / Theology and Ethics",
    email: "dingluaia@atc.edu.in",
    subject: "A commission for 5Talents Magazine — what we owe the people who raised us",
    body: [
      INTRO,
      "I found you through the Aizawl Theological College faculty listing, where you head Theology and Ethics.",
      "I would like to commission one piece from you on honouring your parents when you disagree with them. In India this is not an abstraction — it is marriage, career, money and where you live, and our readers are caught between a commandment and their own conscience with almost no help from anyone.",
      "An ethicist working this through carefully, without pretending it is simple, would be read very closely."
    ]
  },
  {
    college: "AIZAWL THEOLOGICAL COLLEGE, MIZORAM",
    name: "Rev. Dr H. Lalnunmawia",
    role: "Head of Department / Missiology",
    email: "nunmawia@atc.edu.in",
    subject: "A commission for 5Talents Magazine — Mizoram sends missionaries. What has it learned?",
    body: [
      INTRO,
      "I found you through the Aizawl Theological College faculty listing, where you head the Missiology department.",
      "I would like to commission one piece from you. Mizoram has sent missionaries out of all proportion to its size, and the rest of India barely knows it. Our readers certainly do not.",
      "I would like a piece on what that experience has taught — including the parts that did not work. Most mission writing is triumphant, and our readers can tell when they are being sold something. An honest account from a missiologist inside a sending church would be far more use to them."
    ]
  }
];

const children = [];

children.push(new Paragraph({ text: "5Talents Magazine", heading: HeadingLevel.TITLE }));
children.push(new Paragraph({ text: "Commission letters to theological faculty", heading: HeadingLevel.HEADING_2 }));
children.push(new Paragraph({ children: [new TextRun({ text: "21 individual letters, prepared 8 September 2026", italics: true, color: "666666" })], spacing: { after: 240 } }));
children.push(new Paragraph({ children: [new TextRun({ text: "Each letter asks for one specific article matched to that person's field. Send them individually and spaced out, never as a mail merge. Bishop's College in particular asks people not to send unsolicited bulk email.", size: 20 })], spacing: { after: 240 } }));

children.push(new Paragraph({ text: "Contents", heading: HeadingLevel.HEADING_2 }));
let lastCollege = "";
letters.forEach((l, i) => {
  if (l.college !== lastCollege) {
    children.push(new Paragraph({ children: [new TextRun({ text: l.college, bold: true, size: 20 })], spacing: { before: 160, after: 60 } }));
    lastCollege = l.college;
  }
  children.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}.  ${l.name} — ${l.role}`, size: 20 })], indent: { left: 360 } }));
});

children.push(new Paragraph({ children: [new PageBreak()] }));

letters.forEach((l, i) => {
  children.push(new Paragraph({ children: [new TextRun({ text: l.college, bold: true, size: 18, color: "888888" })] }));
  children.push(new Paragraph({ text: `${i + 1}. ${l.name}`, heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({
    children: [new TextRun({ text: l.role, italics: true, color: "666666" })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC", space: 6 } },
    spacing: { after: 240 }
  }));
  children.push(new Paragraph({ children: [new TextRun({ text: "To:  ", bold: true }), new TextRun({ text: l.email })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Subject:  ", bold: true }), new TextRun({ text: l.subject })], spacing: { after: 280 } }));
  children.push(new Paragraph({ text: `Dear ${l.name},`, spacing: { after: 180 } }));
  l.body.forEach(p => children.push(new Paragraph({ text: p, spacing: { after: 180 } })));
  CLOSE.forEach(p => children.push(new Paragraph({ text: p, spacing: { after: 180 } })));
  SIG.forEach(s => children.push(new Paragraph({ text: s })));
  if (i < letters.length - 1) children.push(new Paragraph({ children: [new PageBreak()] }));
});

const doc = new Document({
  styles: { default: { document: { run: { font: "Calibri", size: 22 }, paragraph: { spacing: { line: 288 } } } } },
  sections: [{ properties: {}, children }]
});

Packer.toBuffer(doc).then(b => {
  fs.writeFileSync(process.argv[2], b);
  console.log("written", process.argv[2], b.length, "bytes;", letters.length, "letters");
});
