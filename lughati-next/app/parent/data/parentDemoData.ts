export const parentDemoData = {
  student: {
    name: "أحمد إبراهيم",
    className: "الصف الثاني الابتدائي",
    section: "الفصل الأول",
    attendanceDays: 5,
    absenceDays: 0,
  },

  dailyTasks: [
  {
    id: 1,
    icon: "📖",
    title: "قراءة النص",
    completed: true,
  },
  {
    id: 2,
    icon: "✍️",
    title: "التدريب على الإملاء",
    completed: true,
  },
  {
    id: 3,
    icon: "📝",
    title: "حل الواجب",
    completed: true,
  },
  {
    id: 4,
    icon: "🎤",
    title: "تسجيل القراءة",
    completed: false,
  },
  {
    id: 5,
    icon: "📚",
    title: "الفهم القرائي",
    completed: true,
  },
],

  weeklyProgress: {
    completedTasks: 8,
    totalTasks: 10,
    readingStars: 4,
    spellingStars: 5,
    comprehensionStars: 3,
    badgesCount: 2,
    streakDays: 5,
  },

  skills: {
    strongestSkill: "الإملاء",
    supportSkill: "الفهم القرائي",
  },

  spelling: {
    title: "كلمات إملاء الغد",

    wordsCount: 5,words: ["المدرسة", "الكتاب", "المعلم", "التعاون", "النشاط"],
    masteredWords: 3,
    remainingWords: 2,
    readyForTest: false,
  },

  achievement: {
    title: "قارئ الأسبوع",
    description: "قرأ النص بصوت واضح والتزم بعلامات الترقيم.",
    icon: "🏆",
  },

  family: {
    recommendation:
      "استمعوا إلى قراءته لمدة خمس دقائق، وشجعوه بهدوء على إكمال النشاط المتبقي.",

    nextWeekStep:
      "اقرؤوا معه فقرة قصيرة، ثم اطرحوا عليه سؤالين بسيطين.",

    impactMessage:
      "أنجز ابنكم معظم مهامه اليوم. دقائق قليلة من دعمكم ستساعده على إكمال رحلته اليومية.",
  },

  teacher: {
    message:
      "أحمد طالب مجتهد، ويحتاج إلى مزيد من التدريب على فهم النص والإجابة عن الأسئلة.",
  },

  fares: {
    message:
      "أنت قريب جدًا من إكمال جميع مهامك، استمر يا بطل! 🌟",
  },
} as const;