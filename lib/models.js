// Model catalogue from OpenRouter + credit/plan rules (server-side only)

// Monthly credits per plan. 1 credit = one message on a budget model.
export const PLAN_CREDITS = {
  single_standard: 600,
  single_all: 600,
  dual_standard: 1000,
  dual_all: 1000,
};
export const DEFAULT_CREDITS = 600;

// Models costing more than this (USD per 1M output tokens) are hidden — too expensive to resell.
const MAX_OUTPUT_PRICE = 30;

// Credits charged per message, by the model's output price (USD per 1M tokens).
export function creditsForPrice(outPerM) {
  if (outPerM <= 1) return 1;
  if (outPerM <= 5) return 2;
  if (outPerM <= 12) return 4;
  return 8;
}

const PROVIDER_NAMES = {
  openai: 'OpenAI', anthropic: 'Anthropic', google: 'Google', 'x-ai': 'xAI',
  deepseek: 'DeepSeek', 'meta-llama': 'Meta', meta: 'Meta', mistralai: 'Mistral', qwen: 'Qwen',
  moonshotai: 'Moonshot', 'z-ai': 'Zhipu', cohere: 'Cohere', perplexity: 'Perplexity',
  microsoft: 'Microsoft', nvidia: 'NVIDIA', amazon: 'Amazon', minimax: 'MiniMax',
};

// Standard plans = ChatGPT + Claude models only. "_all" plans = every model.
export function planAllows(plan, modelId) {
  if (plan && plan.endsWith('_all')) return true;
  return modelId.startsWith('openai/') || modelId.startsWith('anthropic/');
}

export function periodStart(accessExpiresAt) {
  if (accessExpiresAt) {
    const d = new Date(accessExpiresAt);
    d.setDate(d.getDate() - 30);
    return d;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Curated list shown to customers, in this order. Set SHOW_ALL_MODELS=true in Vercel to show every model instead.
export const FEATURED = [
  { id: 'openai/gpt-6-sol', tag: "OpenAI's flagship - best all-rounder" },
  { id: 'openai/gpt-6-luna', tag: 'Fast and cheap for everyday chat' },
  { id: 'openai/gpt-5.4-mini', tag: 'Quick, smart, low cost' },
  { id: 'openai/gpt-5.3-codex', tag: 'Specialist for coding' },
  { id: 'openai/o3', tag: 'Deep reasoning, maths and logic' },
  { id: 'openai/gpt-4o', tag: 'The classic ChatGPT experience' },
  { id: 'openai/gpt-oss-120b', tag: 'OpenAI open model, very cheap' },
  { id: 'anthropic/claude-opus-5.5', tag: "Anthropic's most capable - complex work" },
  { id: 'anthropic/claude-sonnet-5', tag: 'Great writing and coding, balanced' },
  { id: 'anthropic/claude-sonnet-4.6', tag: 'Previous Sonnet, very reliable' },
  { id: 'anthropic/claude-haiku-4.5', tag: 'Fast Claude for quick tasks' },
  { id: 'google/gemini-3.1-pro-preview', tag: "Google's top model - long documents" },
  { id: 'google/gemini-3.8-flash', tag: 'Fast Gemini, great value' },
  { id: 'google/gemini-3.5-flash-lite', tag: 'Lightest Gemini, quick answers' },
  { id: 'google/gemma-4-31b-it', tag: 'Google open model, cheap' },
  { id: 'x-ai/grok-4.7', tag: "xAI's latest Grok" },
  { id: 'x-ai/grok-4.20', tag: 'Huge memory for very long files' },
  { id: 'deepseek/deepseek-v4-pro-0813', tag: 'Strong reasoning at a low price' },
  { id: 'deepseek/deepseek-v4.1-flash', tag: 'Fast DeepSeek, great value' },
  { id: 'deepseek/deepseek-r1-0528', tag: 'Step-by-step reasoning' },
  { id: 'meta/muse-spark-1.3', tag: "Meta's latest AI" },
  { id: 'meta-llama/llama-4-maverick', tag: 'Meta Llama, fast and cheap' },
  { id: 'qwen/qwen3.8-max-0902', tag: "Alibaba's top model, multilingual" },
  { id: 'qwen/qwen3.8-flash', tag: 'Fast Qwen, very cheap' },
  { id: 'mistralai/mistral-medium-3-5', tag: 'Mistral all-rounder' },
  { id: 'mistralai/mistral-large-2512', tag: 'Mistral Large, good value' },
  { id: 'moonshotai/kimi-k3', tag: 'Long research and multi-step tasks' },
  { id: 'z-ai/glm-5.3', tag: 'Strong coding and tool use' },
  { id: 'perplexity/sonar-pro', tag: 'Searches the web - live answers with sources' },
  { id: 'minimax/minimax-m3', tag: 'Reads very long documents, low cost' },
];

let cache = { at: 0, list: null };

export async function getModels() {
  if (cache.list && Date.now() - cache.at < 60 * 60 * 1000) return cache.list;
  const res = await fetch('https://openrouter.ai/api/v1/models', { cache: 'no-store' });
  if (!res.ok) {
    if (cache.list) return cache.list;
    throw new Error('Could not load model list');
  }
  const { data } = await res.json();
  const list = (data || [])
    .filter(m => {
      const out = m.architecture?.output_modalities || ['text'];
      const price = Number(m.pricing?.completion || 0) * 1e6;
      return out.includes('text') && !out.includes('image') && !out.includes('audio')
        && !m.id.includes(':batch') && !m.id.startsWith('openrouter/') && !m.id.startsWith('~')
        && price <= MAX_OUTPUT_PRICE && Number(m.pricing?.request || 0) === 0;
    })
    .map(m => {
      const provider = m.id.split('/')[0];
      const outPerM = Number(m.pricing?.completion || 0) * 1e6;
      return {
        id: m.id,
        name: (m.name || m.id).replace(/^[^:]+:\s*/, ''),
        provider: PROVIDER_NAMES[provider] || provider,
        credits: creditsForPrice(outPerM),
        free: m.id.endsWith(':free'),
        created: m.created || 0,
      };
    })
    .sort((a, b) => b.created - a.created);
  const byId = new Map(list.map(m => [m.id, m]));
  const featured = FEATURED.filter(f => byId.has(f.id)).map(f => ({ ...byId.get(f.id), tag: f.tag }));
  const final = process.env.SHOW_ALL_MODELS === 'true' || featured.length === 0 ? list : featured;
  cache = { at: Date.now(), list: final };
  return final;
}

export async function findModel(id) {
  const list = await getModels();
  return list.find(m => m.id === id) || null;
}

// Credits used in the current billing period (falls back to message count if the credits column is missing)
export async function creditsUsed(db, userId, since) {
  const { data, error } = await db
    .from('chat_logs')
    .select('credits')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());
  if (!error) return (data || []).reduce((sum, r) => sum + (r.credits || 1), 0);
  const { count } = await db
    .from('chat_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since.toISOString());
  return count || 0;
}

export async function logUsage(db, userId, model, credits, messageCount) {
  const { error } = await db.from('chat_logs').insert({ user_id: userId, model, message_count: messageCount, credits });
  if (error) await db.from('chat_logs').insert({ user_id: userId, model, message_count: messageCount });
}
