const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const GradingRecord = require('../models/GradingRecord');
const Farm = require('../models/Farm');

const isDbConnected = () => mongoose.connection.readyState === 1;

/* ── Gemini AI Integration ─────────────────────────────────── */

const SYSTEM_PROMPT = [
  'You are FruitGrade AI, an intelligent assistant embedded in a professional',
  'AI-powered Fruit Grading System used by farmers and agricultural operators.',
  '',
  'Your expertise covers:',
  '- Fruit quality grading: Grade A (premium), Grade B (standard), Grade C (economy),',
  '  Unripe (needs ripening), Rotten (spoilage), Wilted (dehydration damage)',
  '- Market recommendations for selling produce in Thailand',
  '- Farm management, batch traceability, and supply chain',
  '- Pricing and revenue optimization (THB currency)',
  '- Defect analysis: cracks, black spots, bruises, spoilage',
  '- Agricultural best practices for tomato cultivation',
  '',
  'Nearby markets: Talad Thai (Pathum Thani, wholesale), Si Mum Muang (Pathum Thani, wholesale),',
  'Or Tor Kor (Bangkok, premium), Makro Rangsit (retail), Similan Fresh Hub (Nonthaburi, distribution).',
  '',
  'Default prices (THB/kg): Grade A=240, Grade B=180, Grade C=90, Unripe=45.',
  'Standard tomato weight: ~150g per fruit (Grade A).',
  '',
  'Guidelines:',
  '- Be concise and professional. Use short paragraphs and bullet points.',
  '- When grading data is provided, reference actual numbers in your response.',
  '- Provide actionable advice, not just information.',
  '- If asked something outside your domain, politely redirect to fruit grading topics.',
  '- Respond in the same language the user writes in (Thai, English, or Chinese).',
].join('\n');

let geminiModel = null;

async function initGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('GEMINI_API_KEY not set — chatbot will use rule-based fallback');
    return;
  }
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    });
    console.log('Gemini AI chatbot initialized');
  } catch (err) {
    console.warn('Gemini init failed:', err.message);
  }
}

initGemini();

/* ── Dynamic Context Builder ───────────────────────────────── */

async function buildContext() {
  if (!isDbConnected()) return '';
  const parts = [];

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await GradingRecord.aggregate([
      { $match: { timestamp: { $gte: today } } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
    ]);
    if (records.length) {
      const lines = records.map((r) => `${r._id}: ${r.count}`).join(', ');
      const total = records.reduce((s, r) => s + r.count, 0);
      parts.push(`[Today's grading data: ${lines} | Total: ${total}]`);
    }
  } catch { /* DB unavailable */ }

  try {
    const farms = await Farm.find().lean();
    if (farms.length) {
      parts.push(`[Registered farms: ${farms.map((f) => f.name).join(', ')}]`);
    }
  } catch { /* DB unavailable */ }

  return parts.length ? parts.join('\n') : '';
}

/* ── Gemini Chat Handler ───────────────────────────────────── */

async function geminiReply(message, history) {
  const context = await buildContext();
  const chatHistory = (history || []).map((msg) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }],
  }));

  const chat = geminiModel.startChat({ history: chatHistory });
  const prompt = context
    ? `${context}\n\nUser message: ${message}`
    : message;

  const result = await chat.sendMessage(prompt);
  return result.response.text();
}

/* ── Rule-Based Fallback ───────────────────────────────────── */

const MARKET_DB = [
  { name: 'Talad Thai Market', location: 'Pathum Thani', distance: '15 km', type: 'wholesale' },
  { name: 'Si Mum Muang Market', location: 'Pathum Thani', distance: '8 km', type: 'wholesale' },
  { name: 'Or Tor Kor Market', location: 'Bangkok', distance: '30 km', type: 'premium' },
  { name: 'Makro Rangsit', location: 'Pathum Thani', distance: '12 km', type: 'retail' },
  { name: 'Similan Fresh Hub', location: 'Nonthaburi', distance: '25 km', type: 'distribution' },
];

async function getGradeSummary() {
  if (!isDbConnected()) return 'Grading database is not available right now. Historical stats require MongoDB.';
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await GradingRecord.aggregate([
      { $match: { timestamp: { $gte: today } } },
      { $group: { _id: '$grade', count: { $sum: 1 } } },
    ]);
    if (!records.length) return 'No grading data recorded today yet.';
    const lines = records.map((r) => `${r._id}: ${r.count}`).join(', ');
    const total = records.reduce((s, r) => s + r.count, 0);
    return `Today's grading: ${lines} (total: ${total})`;
  } catch {
    return 'Grading database is not available right now.';
  }
}

async function getFarmList() {
  if (!isDbConnected()) return 'Farms are stored in-memory (no database). Use the Farms panel to add them.';
  try {
    const farms = await Farm.find().lean();
    if (!farms.length) return 'No farms registered yet. Add one in the Farms tab.';
    return 'Registered farms: ' + farms.map((f) => f.name).join(', ');
  } catch {
    return 'Farm database is not available right now.';
  }
}

function findMarkets(query) {
  const q = query.toLowerCase();
  let results = MARKET_DB;
  if (q.includes('wholesale')) results = results.filter((m) => m.type === 'wholesale');
  else if (q.includes('premium')) results = results.filter((m) => m.type === 'premium');
  else if (q.includes('retail')) results = results.filter((m) => m.type === 'retail');
  else if (q.includes('distribution') || q.includes('center')) results = results.filter((m) => m.type === 'distribution');
  return results.map((m) => `${m.name} (${m.location}, ~${m.distance}) [${m.type}]`).join('\n');
}

async function ruleBasedReply(message) {
  const msg = message.toLowerCase();

  if (msg.includes('market') || msg.includes('sell') || msg.includes('where') || msg.includes('distribution') || msg.includes('nearest')) {
    return `Here are nearby markets and distribution centers:\n\n${findMarkets(msg)}\n\nWould you like more details about any of these?`;
  }
  if (msg.includes('grade') || msg.includes('summary') || msg.includes('today') || msg.includes('stat') || msg.includes('count')) {
    return await getGradeSummary();
  }
  if (msg.includes('farm') || msg.includes('source') || msg.includes('origin')) {
    return await getFarmList();
  }
  if (msg.includes('rotten') || msg.includes('defect') || msg.includes('problem') || msg.includes('disease') || msg.includes('quality')) {
    return 'To identify disease hotspots, use the Farms tab to tag fruit batches by farm origin. Check the farm stats to see which farm has high rotten/wilted rates, then apply targeted treatment to that zone.';
  }
  if (msg.includes('price') || msg.includes('revenue') || msg.includes('cost') || msg.includes('money')) {
    return 'Current suggested prices (THB/kg):\n\u2022 Grade A: 240 THB/kg\n\u2022 Grade B: 180 THB/kg\n\u2022 Grade C: 90 THB/kg\n\u2022 Unripe: 45 THB/kg\n\nNote: standard tomato weight ~150g per fruit. You can update prices in the Analytics panel.';
  }
  if (msg.includes('help') || msg.includes('what can') || msg.includes('how')) {
    return 'I can help you with:\n\u2022 Finding nearby markets to sell your fruit\n\u2022 Viewing today\'s grading summary\n\u2022 Checking farm sources and disease hotspots\n\u2022 Pricing information and revenue estimates\n\nJust ask me a question!';
  }
  return 'I\'m your fruit grading assistant. I can help you find markets, check grading stats, manage farms, and answer pricing questions. Try asking "Where can I sell my fruit?" or "Show today\'s grades".';
}

/* ── Route Handler ─────────────────────────────────────────── */

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    let reply;
    let provider = 'rules';

    if (geminiModel) {
      try {
        reply = await geminiReply(message, history);
        provider = 'gemini';
      } catch (err) {
        console.warn('Gemini error, falling back to rules:', err.message);
        reply = await ruleBasedReply(message);
      }
    } else {
      reply = await ruleBasedReply(message);
    }

    res.json({ reply, provider, timestamp: Date.now() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
