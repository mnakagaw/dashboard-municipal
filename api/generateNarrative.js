// api/generateNarrative.js
export default async function handler(req, res) {
    const { prompt } = req.body;

    try {
        const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-5.1",
                messages: [{ role: "user", content: prompt }],
            }),
        });

        const json = await r.json();
        return res.status(200).json(json);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "OpenAI request failed" });
    }
}
