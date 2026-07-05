# covenant-stakelock-bot

Posts the total **staked** and **locked** $CVNT to a Telegram group twice a day, with a short video.

Numbers come straight from the Streamflow token dashboard for the CVNT mint
(`2mNVZ6…pump`), the same source as
[app.streamflow.finance](https://app.streamflow.finance/token-dashboard/solana/mainnet/2mNVZ6aEjrGwiUVCfz7XGWpiXuWzgBDoznwE579upump):

- **Staked** = `stats.byType.STAKE_POOL.tokensDeposited`
- **Locked** = `stats.byType.TOKEN_LOCK.tokensLocked`

Both cross-check against the on-chain stake-pool vaults and lock contracts.

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
