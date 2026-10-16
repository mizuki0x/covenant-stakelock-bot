# covenant-stakelock-bot

Posts the total **staked** $CVNT and its share of supply to a Telegram group twice a day, with a short video.

The number comes straight from the Streamflow token dashboard for the CVNT mint
(`2mNVZ6…pump`), the same source as
[app.streamflow.finance](https://app.streamflow.finance/token-dashboard/solana/mainnet/2mNVZ6aEjrGwiUVCfz7XGWpiXuWzgBDoznwE579upump):

- **Staked** = `stats.byType.STAKE_POOL.tokensDeposited`
- **Share of supply** = staked / `tokenSupply`

It cross-checks against the on-chain stake-pool vaults.

The caption opens with the Covenant mark as a custom emoji (`MARK_EMOJI_ID`, default
`5949529723670373823`, set `cvnt_by_CovenantStakeBot`); the bot can send it because its
owner has Telegram Premium. The video (`assets/stakelock.mp4`) is the TOTAL STAKED clip with
an arrow pointing down at the caption; source in covenant-brand-render/notices (`totals`).

## Run locally

```bash
npm run dry          # print the message, don't post
TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... npm run post
```

## Deploy (Render cron)

Deployed as a Render cron job on the schedule in `render.yaml` (default `0 9,21 * * *`, twice daily UTC).
Set two env vars on the service:

| Var | Where it comes from |
|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather, when you create the bot |
| `TELEGRAM_CHAT_ID` | the group id (add the bot to the group first) |

Until both are set the job runs in dry-run mode and posts nothing.
