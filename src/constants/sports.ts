export const SPORTS = [
  // Gym & Fitness
  "HIIT",
  "CrossFit",
  "Weightlifting",
  "Powerlifting",
  "Bodybuilding",
  "Functional Training",
  "Personal Trainer",
  "Calisthenics",
  "TRX / Suspension",
  "Bootcamp",

  // Cardio
  "Running",
  "Cycling",
  "Swimming",
  "Rowing",
  "Jump Rope",

  // Mind & Body
  "Yoga",
  "Pilates",
  "Stretching",
  "Meditation",
  "Tai Chi",
  "Barre",

  // Combat / Martial Arts
  "Boxing",
  "Kickboxing",
  "MMA",
  "Judo",
  "Wrestling",
  "Brazilian Jiu-Jitsu",
  "Karate",
  "Taekwondo",
  "Muay Thai",
  "Sambo",
  "Fencing",

  // Racquet & Ball Sports
  "Tennis",
  "Table Tennis",
  "Badminton",
  "Squash",
  "Padel",

  // Team Sports
  "Football",
  "Basketball",
  "Volleyball",
  "Rugby",
  "Handball",

  // Outdoor & Adventure
  "Rock Climbing",
  "Hiking",
  "Trail Running",
  "Skiing",
  "Snowboarding",
  "Surfing",
  "Kayaking",
  "Paragliding",
  "Horse Riding",

  // Dance & Movement
  "Dance Fitness",
  "Zumba",
  "Pole Fitness",
  "Acrobatics",
  "Gymnastics",
  "Cheerleading",

  // Other
  "Archery",
  "Golf",
  "Skateboarding",
  "Parkour",
  "Other",
] as const;

export const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all_levels", label: "All Levels" },
] as const;

export type Sport = (typeof SPORTS)[number];
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]["value"];
