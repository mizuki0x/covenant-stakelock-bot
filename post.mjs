import { readFile } from 'node:fs/promises';

const MINT = process.env.CVNT_MINT || '2mNVZ6aEjrGwiUVCfz7XGWpiXuWzgBDoznwE579upump';
const DASHBOARD = `https://api.streamflow.finance/v2/api/token-dashboards/SOLANA/${MINT}`;
const DECIMALS = 6;
// The Covenant mark as a Telegram custom emoji (set cvnt_by_CovenantStakeBot);
// readers who can't see custom emoji get the fallback character instead.
const MARK_EMOJI_ID = process.env.MARK_EMOJI_ID || '5949529723670373823';
const MARK_FALLBACK = '🟪';

const toTokens = (v) => Number(v ?? 0) / 10 ** DECIMALS;
const fmt = (n) => Math.round(n).toLocaleString('en-US');

async function readTotals() {
  const res = await fetch(DASHBOARD, {
    headers: { accept: 'application/json', origin: 'https://app.streamflow.finance' },
  });
  if (!res.ok) throw new Error(`streamflow dashboard ${res.status}`);
  const d = await res.json();
  const byType = d.stats?.byType ?? {};
  const staked = toTokens(byType.STAKE_POOL?.tokensDeposited);
  const supply = toTokens(d.tokenSupply);
  // Never post a zeroed-out summary if the upstream returned nothing usable.
  if (staked <= 0) throw new Error('dashboard returned no staked amount');
  return { staked, supply };
}

function caption({ staked, supply }) {
  const pct = supply > 0 ? ((staked / supply) * 100).toFixed(1) : null;
  return [
    `${MARK_FALLBACK} Covenant $CVNT`,
    '',
    `Total staked: ${fmt(staked)} CVNT`,
    ...(pct ? [`${pct}% of total supply`] : []),
  ].join('\n');
}

async function post(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (process.env.DRY_RUN === '1' || !token || !chat) {
    console.log(`[dry-run — TELEGRAM_BOT_TOKEN/CHAT_ID unset]\n${text}`);
    return;
  }
  const video = await readFile(new URL('./assets/stakelock.mp4', import.meta.url));
  const form = new FormData();
  form.append('chat_id', chat);
  form.append('caption', text);
  form.append('caption_entities', JSON.stringify([
    { type: 'custom_emoji', offset: 0, length: MARK_FALLBACK.length, custom_emoji_id: MARK_EMOJI_ID },
  ]));
  form.append('video', new Blob([video], { type: 'video/mp4' }), 'stakelock.mp4');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, { method: 'POST', body: form });
  const body = await res.json();
  if (!body.ok) throw new Error(`telegram sendVideo failed: ${JSON.stringify(body)}`);
  console.log(`posted message ${body.result?.message_id} to ${chat}`);
}

await post(caption(await readTotals()));
