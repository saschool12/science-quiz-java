const fallbackQuestions = [
  {
    question: "What planet is known as the Red Planet?",
    choices: ["Venus", "Mars", "Jupiter", "Mercury"],
    answer: 1,
    explanation: "Mars appears reddish because iron minerals in its soil have oxidized."
  },
  {
    question: "What gas do humans need to breathe to survive?",
    choices: ["Carbon dioxide", "Nitrogen", "Oxygen", "Hydrogen"],
    answer: 2,
    explanation: "Humans use oxygen during cellular respiration to release energy from food."
  },
  {
    question: "What is the largest organ in the human body?",
    choices: ["Heart", "Liver", "Skin", "Lungs"],
    answer: 2,
    explanation: "The skin is the body's largest organ."
  },
  {
    question: "What force pulls objects toward Earth?",
    choices: ["Friction", "Gravity", "Magnetism", "Electricity"],
    answer: 1,
    explanation: "Gravity attracts objects toward Earth's center."
  },
  {
    question: "What is H2O commonly known as?",
    choices: ["Salt", "Oxygen", "Water", "Hydrogen"],
    answer: 2,
    explanation: "H2O is the chemical formula for water."
  },
  {
    question: "Which part of a plant absorbs most water from the soil?",
    choices: ["Flower", "Leaves", "Roots", "Stem"],
    answer: 2,
    explanation: "Roots absorb water and minerals from the soil."
  },
  {
    question: "How many planets are in our Solar System?",
    choices: ["7", "8", "9", "10"],
    answer: 1,
    explanation: "There are eight recognized planets in our Solar System."
  },
  {
    question: "What is the center of an atom called?",
    choices: ["Electron", "Nucleus", "Proton", "Molecule"],
    answer: 1,
    explanation: "The nucleus contains protons and neutrons."
  },
  {
    question: "Which organ pumps blood around the human body?",
    choices: ["Brain", "Liver", "Heart", "Kidney"],
    answer: 2,
    explanation: "The heart pumps blood through the circulatory system."
  },
  {
    question: "What is the boiling point of water at sea level?",
    choices: ["50°C", "75°C", "100°C", "150°C"],
    answer: 2,
    explanation: "Pure water boils at 100°C at standard atmospheric pressure."
  },
  {
    question: "Which planet is the largest in our Solar System?",
    choices: ["Earth", "Saturn", "Jupiter", "Neptune"],
    answer: 2,
    explanation: "Jupiter is the largest planet in our Solar System."
  },
  {
    question: "What process do plants use to make food using sunlight?",
    choices: ["Respiration", "Photosynthesis", "Digestion", "Fermentation"],
    answer: 1,
    explanation: "Plants use photosynthesis to convert light energy into chemical energy."
  },
  {
    question: "Which blood cells help fight infections?",
    choices: ["Red blood cells", "White blood cells", "Platelets", "Plasma"],
    answer: 1,
    explanation: "White blood cells are important parts of the immune system."
  },
  {
    question: "What is the chemical symbol for gold?",
    choices: ["Go", "Gd", "Au", "Ag"],
    answer: 2,
    explanation: "Gold has the chemical symbol Au."
  },
  {
    question: "Which natural satellite orbits Earth?",
    choices: ["Mars", "The Moon", "Venus", "Titan"],
    answer: 1,
    explanation: "The Moon is Earth's natural satellite."
  },
  {
    question: "What type of energy comes from moving objects?",
    choices: ["Kinetic energy", "Chemical energy", "Nuclear energy", "Potential energy"],
    answer: 0,
    explanation: "Kinetic energy is the energy of motion."
  },
  {
    question: "Which layer of Earth do we live on?",
    choices: ["Core", "Mantle", "Crust", "Outer core"],
    answer: 2,
    explanation: "Humans live on Earth's solid outer layer, the crust."
  },
  {
    question: "What instrument is used to measure temperature?",
    choices: ["Barometer", "Thermometer", "Speedometer", "Hygrometer"],
    answer: 1,
    explanation: "A thermometer measures temperature."
  },
  {
    question: "Which particle has a negative electrical charge?",
    choices: ["Proton", "Neutron", "Electron", "Nucleus"],
    answer: 2,
    explanation: "Electrons carry a negative electric charge."
  },
  {
    question: "What is the closest star to Earth?",
    choices: ["Sirius", "Polaris", "The Sun", "Betelgeuse"],
    answer: 2,
    explanation: "The Sun is the closest star to Earth."
  }
];

function getFallback() {
  const question =
    fallbackQuestions[
      Math.floor(Math.random() * fallbackQuestions.length)
    ];

  return {
    ...question,
    source: "fallback"
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // No API key = use backup questions
  if (!apiKey) {
    return res.status(200).json(getFallback());
  }

  const topics = [
    "physics",
    "chemistry",
    "biology",
    "astronomy",
    "Earth science",
    "environmental science",
    "human body",
    "space"
  ];

  const topic =
    topics[Math.floor(Math.random() * topics.length)];

  const prompt = `
Create ONE random ${topic} multiple-choice science question.

Difficulty: easy to medium.
Exactly 4 choices.
Only ONE correct answer.

Return ONLY valid JSON:
{
  "question": "string",
  "choices": ["string", "string", "string", "string"],
  "answer": 0,
  "explanation": "short explanation"
}

The answer must be 0, 1, 2, or 3.
`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 300,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Quota, overload, 429, or other Gemini error
      return res.status(200).json(getFallback());
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(200).json(getFallback());
    }

    let quiz;

    try {
      quiz = JSON.parse(text);
    } catch {
      return res.status(200).json(getFallback());
    }

    if (
      !quiz.question ||
      !Array.isArray(quiz.choices) ||
      quiz.choices.length !== 4 ||
      !Number.isInteger(quiz.answer) ||
      quiz.answer < 0 ||
      quiz.answer > 3
    ) {
      return res.status(200).json(getFallback());
    }

    return res.status(200).json({
      question: quiz.question,
      choices: quiz.choices,
      answer: quiz.answer,
      explanation: quiz.explanation || "Good job!",
      source: "ai"
    });

  } catch {
    // Network/server/model problem = keep the game playable
    return res.status(200).json(getFallback());
  }
}
