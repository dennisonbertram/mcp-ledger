# API Development - Sim by Dune

Source: page_25

`apis/` `cd apis
` `.dev.vars` `apis/` `DB_CONNECTION_STRING="your_database_connection_string_from_app_page"
` `npm install
` `npm run dev
` `http://localhost:8787` `apis/src/index.ts` `sim-idx` `import { App, db, types } from "sim-idx";
import { eq, sql } from "drizzle-orm";
import { poolCreated, ownerQueried } from "./db/schema/Listener";
` `sim-idx` `const app = App.create();
` `db.client(c)` `const rows = await db.client(c)
.select()
.from(poolCreated)
.limit(10);
` `/api/pools` `/api/owner-changed` `/api/pools/count` `pool_created` `// Endpoint to get the 10 most recent Uniswap V3 pools
app.get("/api/pools", async (c) => {
try {
    const rows = await db.client(c)
      .select()
      .from(poolCreated)
      .limit(10);
    return Response.json({ data: rows });
} catch (e) {
    console.error("Database operation failed:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
}
});
` `LIMIT 10` `OwnerChanged` `sim build
` `sim build` `apis/src/db/schema/Listener.ts` `ownerChanged` `owner_changed` `// Endpoint to get the 10 most recent owner changed events
app.get("/api/owner-changed", async (c) => {
try {
    const rows = await db.client(c)
      .select()
      .from(ownerChanged)
      .limit(10);
    return Response.json({ data: rows });
} catch (e) {
    console.error("Database operation failed:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
}
});
` ``// Endpoint to get the total number of pools
app.get("/api/pools/count", async (c) => {
try {
    const [{ total }] = await db.client(c)
      .select({ total: sql<number>`COUNT(*)` })
      .from(poolCreated);
    return Response.json({ data: total });
} catch (e) {
    console.error("Database operation failed:", e);
    return Response.json({ error: (e as Error).message }, { status: 500 });
}
});
`` `http://localhost:8787/api/pools` `http://localhost:8787/api/owner-changed` `http://localhost:8787/api/pools/count` `401 Unauthorized` `NODE_ENV` `production` `apis/src/index.ts` `import { App, db, types, middlewares } from "@duneanalytics/sim-idx";
import { eq, sql } from "drizzle-orm";
import { poolCreated, ownerChanged } from "./db/schema/Listener";
const app = App.create();
// Authentication middleware is applied to all routes by default
app.use("*", middlewares.authentication);
// Your endpoints...
app.get("/api/pools", async (c) => {
// ...
});
export default app;
` `middlewares.authentication` `app.use("*", middlewares.authentication)` `Authorization` `curl --request GET \
  --url https://<your-api-url>/api/pools \
  --header 'Authorization: Bearer YOUR_SIM_IDX_APP_ENDPOINTS_API_KEY'
` `<your-api-url>` `YOUR_SIM_IDX_APP_ENDPOINTS_API_KEY` `main`

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```

```