---
inclusion: auto
---

# Project Structure

## Directory Organization

```
src/
├── auth/              # Authentication management
├── client/            # ServiceNow API client layer
├── config/            # Configuration management
├── server/            # MCP protocol server implementation
├── service/           # Business logic for incident operations
├── tools/             # MCP tool definitions and handlers
├── types/             # TypeScript type definitions
├── utils/             # Shared utilities (logging, etc.)
├── index.ts           # Public API exports
└── main.ts            # Application entry point
```

## Layered Architecture

The codebase follows a strict layered architecture:

1. **MCP Protocol Layer** (`server/`): Handles MCP protocol communication and tool registration
2. **Service Layer** (`service/`): Implements business logic for incident operations
3. **API Client Layer** (`client/`): Manages HTTP communication with ServiceNow REST APIs
4. **Authentication Layer** (`auth/`): Handles credential management and session lifecycle
5. **Configuration Layer** (`config/`): Manages environment-based configuration

## Key Files

- `main.ts`: Entry point with server initialization and graceful shutdown
- `index.ts`: Public API exports for library usage
- `.env`: Environment configuration (not committed)
- `.env.example`: Template for required environment variables

## Build Output

- Compiled JavaScript: `dist/`
- Source maps: `dist/**/*.map`
- Type declarations: `dist/**/*.d.ts`
- Executable: `dist/main.js` (with shebang)

## Configuration Files

- `package.json`: Dependencies and npm scripts
- `tsconfig.json`: TypeScript compiler configuration
- `jest.config.js`: Test framework configuration
- `.eslintrc`: Linting rules with ServiceNow plugin

## Testing Structure

- Tests co-located with source files (e.g., `ServiceNowClient.test.ts`)
- Jest cache in `.jest_cache/`
- Coverage reports in `coverage/`

## Excluded from Build

- Test files (`**/*.test.ts`, `**/*.spec.ts`)
- Fluent directory (`src/fluent/**/*`)
- Node modules and build artifacts
