const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

const ask = async (prompt, systemPrompt = '') => {
    const messages = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });
    const res = await groq.chat.completions.create({
        messages, model: MODEL, temperature: 0.7, max_tokens: 4096,
    });
    return res.choices[0].message.content.trim();
};

const extractJSON = (raw) => {
    const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON array found in response');
    return JSON.parse(match[0]);
};

const extractJSONObject = (raw) => {
    const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in response');
    return JSON.parse(match[0]);
};

module.exports = { ask, extractJSON, extractJSONObject, MODEL };
