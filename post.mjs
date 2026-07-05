import { readFile } from 'node:fs/promises';

const MINT = process.env.CVNT_MINT || '2mNVZ6aEjrGwiUVCfz7XGWpiXuWzgBDoznwE579upump';
const DASHBOARD = `https://api.streamflow.finance/v2/api/token-dashboards/SOLANA/${MINT}`;
const DECIMALS = 6;

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
  const locked = toTokens(byType.TOKEN_LOCK?.tokensLocked);
  const supply = toTokens(d.tokenSupply);
  // Never post a zeroed-out summary if the upstream returned nothing usable.
  if (staked <= 0 && locked <= 0) throw new Error('dashboard returned no staked/locked amounts');
  return { staked, locked, supply };
}

function caption({ staked, locked, supply }) {
  const total = staked + locked;
  const pct = supply > 0 ? ((total / supply) * 100).toFixed(1) : null;
  return [
    '</> Covenant $CVNT',
    '',
    `Staked: ${fmt(staked)} CVNT`,
    `Locked: ${fmt(locked)} CVNT`,
    '',
    pct ? `${fmt(total)} CVNT secured onchain (${pct}% of supply)` : `${fmt(total)} CVNT secured onchain`,
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
  form.append('video', new Blob([video], { type: 'video/mp4' }), 'stakelock.mp4');
  const res = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, { method: 'POST', body: form });
  const body = await res.json();
  if (!body.ok) throw new Error(`telegram sendVideo failed: ${JSON.stringify(body)}`);
  console.log(`posted message ${body.result?.message_id} to ${chat}`);
}

await post(caption(await readTotals()));
