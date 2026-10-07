export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured in Vercel."
    });
  }

  const prompt = `
Generate ONE random science quiz question.

Requirements:
- Appropriate for students
- Multiple choice
- Exactly 4 choices
- Only ONE correct answer
- Include a short explanation
- Randomly choose a science topic such as physics, chemistry,
  biology, astronomy, Earth science, or environmental science.

Return ONLY valid JSON in this exact format:

{
  "question": "Question here",
  "choices": [
    "Choice A",
    "Choice B",
    "Choice C",
    "Choice D"
  ],
  "answer": 0,
  "explanation": "Short explanation here"
}

The answer must be 0, 1, 2, or 3.
Do not use Markdown.
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
            temperature: 1.0,
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
        error: "Gemini returned no question."
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
        error: "Gemini returned invalid quiz data."
      });
    }

    return res.status(200).json(quiz);

  } catch (error) {

    return res.status(500).json({
      error: "Failed to generate question.",
      details: error.message
    });

  }
}
