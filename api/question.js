export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "GEMINI_API_KEY is not configured."
        });
    }

    const topics = [
        "physics",
        "chemistry",
        "biology",
        "astronomy",
        "Earth science",
        "environmental science",
        "human body",
        "space",
        "animals",
        "general science"
    ];

    const topic =
        topics[Math.floor(Math.random() * topics.length)];

    const randomSeed =
        Math.floor(Math.random() * 1000000);

    const prompt = `
Create ONE random ${topic} multiple-choice science question.

Make it interesting and suitable for students.

Use exactly 4 answer choices.
Only one answer can be correct.

Return ONLY JSON:

{
  "question": "string",
  "choices": ["string", "string", "string", "string"],
  "answer": 0,
  "explanation": "short explanation"
}

"answer" must be 0, 1, 2, or 3.

Random seed: ${randomSeed}
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
                        temperature: 1,
                        responseMimeType: "application/json"
                    }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "Gemini API request failed."
            });
        }

        const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            return res.status(500).json({
                error: "Gemini returned an empty response."
            });
        }

        const quiz = JSON.parse(text);

        if (
            !quiz.question ||
            !Array.isArray(quiz.choices) ||
            quiz.choices.length !== 4 ||
            !Number.isInteger(quiz.answer) ||
            quiz.answer < 0 ||
            quiz.answer > 3
        ) {
            return res.status(500).json({
                error: "Invalid quiz data from Gemini."
            });
        }

        return res.status(200).json(quiz);

    } catch (error) {
        return res.status(500).json({
            error: "Failed to generate question."
        });
    }
}
