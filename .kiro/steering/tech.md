---
inclusion: auto
---

# Technology Stack

## Core Technologies

- **Runtime**: Node.js 18+ with ES2022 modules
- **Language**: TypeScript 5.3+ with strict mode enabled
- **Protocol**: Model Context Protocol SDK (@modelcontextprotocol/sdk)
- **HTTP Client**: Axios for ServiceNow REST API communication
- **Configuration**: dotenv for environment variable management

## Development Tools

- **Build System**: TypeScript compiler (tsc)
- **Testing Framework**: Jest with ts-jest preset
- **Property-Based Testing**: fast-check for correctness properties
- **Linting**: ESLint with ServiceNow SDK plugin
- **Module System**: ES modules (type: "module" in package.json)

## TypeScript Configuration

- Target: ES2022
- Module: ES2022 with Node resolution
- Strict mode enabled
- Source maps and declarations generated
- Test files excluded from build output

## Common Commands

### Build
```bash
npm run build          # Compile TypeScript to dist/
```

### Testing
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

### Development
```bash
npm run dev           # Build and run server
npm start             # Run compiled server from dist/
```

### Running the Server
```bash
node dist/main.js     # Direct execution
```

## Testing Conventions

- Test files: `*.test.ts` or `*.spec.ts`
- Test location: Co-located with source files
- Coverage collected from `src/**/*.ts` (excluding tests)
- Jest cache stored in `.jest_cache/`
- Property-based tests use fast-check for generating test cases

## Module Resolution

- ES modules with `.js` extensions in imports (TypeScript convention)
- Module name mapper in Jest strips `.js` for TypeScript resolution
- All imports must use explicit file extensions
