# @slip/core

> Slip auth core logic

```shell
pnpm install
```
### Tests

```shell
pnpm test
```

```typescript
import sqlite from "db0/connectors/better-sqlite3";
import { createDatabase } from "db0";

const db = createDatabase(sqlite({}));
const auth = new SlipAuthCore(
  db,
  {
    users: "slip_users",
    sessions: "slip_sessions",
    oauthAccounts: "slip_oauth_accounts",
  },
  {
    sessionMaxAge: 60 * 60 * 24 * 7, // 7 days
  }
);
```