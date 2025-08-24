# App Folder Structure - Sim by Dune

Source: page_39

`my-idx-app/
├── sim.toml                       # App configuration
├── abis/                          # JSON ABIs for the contracts you want to index
├── apis/                          # TypeScript/Edge runtime APIs (Node.js project)
│   ├── drizzle.config.ts          # Drizzle ORM configuration
│   └── src/                       # API source code
│       ├── index.ts               # Main API entry point
│       └── db/                    # Database schema and utilities
│           └── schema/            # Auto-generated database schema
│               └── Listener.ts    # Schema generated from listener events
└── listeners/                     # Foundry project for indexing logic
    ├── src/
    │   └── Main.sol               # Triggers contract and main listener logic
    ├── test/
    │   └── Main.t.sol             # Unit tests for your listener
    └── lib/
        ├── sim-idx-sol/           # Core Sim IDX framework (DSL, context, helpers)
        └── sim-idx-generated/     # Code generated from the ABIs you add
` `sim init` `sim.toml` `name` `[listeners]` `[app]
name = "my-test"
` `name` `[listeners]
codegen_naming_convention = "plain"
` `codegen_naming_convention` `[listeners]` `"plain"` `onSwapFunction` `"abi_prefix"` `ABI1$onSwapFunction` `abis/` `abis/UniswapV3Factory.json` `sim abi add` `listeners/lib/sim-idx-generated/` `apis/` `src/index.ts` `src/db/schema/Listener.ts` `sim build` `listeners/` `Triggers` `src/Main.sol` `.sol` `src/` `test/` `.t.sol` `Main.t.sol` `SwapHandlers.t.sol` `sim build` `lib/sim-idx-sol/` `lib/sim-idx-generated/` `abis/YourContract.json` `sim abi add` `listeners/src/` `listeners/test/` `*.t.sol` `apis/src/` `main`

```

```

```

```

```

```