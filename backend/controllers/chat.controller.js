export const generateChatResponse = async (req, res) => {
  try {
    const { history } = req.body;

    // 1) Validate request
    if (!history || !Array.isArray(history)) {
      return res.status(400).json({
        error: "Invalid request: history must be an array",
      });
    }

    // 2) Check API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("Missing GEMINI_API_KEY in .env");
      return res.status(500).json({
        error: "Server misconfiguration: API key missing",
      });
    }

    // 3) Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: history,
        }),
      }
    );

    const data = await response.json();

    // 4) Handle Gemini errors explicitly
    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        error: data,
      });
    }

    // 5) Validate response structure
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Unexpected Gemini response:", data);
      return res.status(500).json({
        error: "Invalid response from Gemini",
      });
    }

    // 6) Send clean response
    return res.json({
      reply: text,
    });

  } catch (error) {
    console.error("Chat controller error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};