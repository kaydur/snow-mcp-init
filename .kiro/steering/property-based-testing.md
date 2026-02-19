---
inclusion: auto
---

# Property-Based Testing Guidelines

## Overview

Property-based testing (PBT) validates that code satisfies universal properties across many generated inputs, rather than testing specific examples. We use `fast-check` for all property-based tests.

## When to Use Property-Based Testing

### Good Candidates for PBT

- **Transformation functions**: Input → Output with invariants
- **Validation logic**: Rules that must hold for all inputs
- **Query builders**: Generated queries must be syntactically valid
- **Parsers and serializers**: Round-trip properties
- **Security validators**: Blacklist patterns must always be detected

### Not Ideal for PBT

- Integration tests with external systems
- UI interaction tests
- Tests requiring specific database state
- Time-dependent behavior

## Property Categories

### 1. Invariant Properties

Properties that always hold regardless of input:

```typescript
// Example: Query builder always produces valid encoded queries
fc.assert(
  fc.property(
    fc.array(fc.string()),
    (states) => {
      const query = buildQuery({ state: states });
      // Property: Result is always a string
      expect(typeof query).toBe('string');
      // Property: No SQL injection characters
      expect(query).not.toMatch(/[;'"]/);
    }
  ),
  { numRuns: 100 }
);
```

### 2. Round-Trip Properties

Data survives transformation and reverse transformation:

```typescript
// Example: Serialize then deserialize returns original
fc.assert(
  fc.property(
    fc.record({
      sys_id: fc.hexaString({ minLength: 32, maxLength: 32 }),
      number: fc.string(),
      priority: fc.integer({ min: 1, max: 5 })
    }),
    (incident) => {
      const summary = toSummary(incident);
      const detail = toDetail(incident);
      expect(detail.sys_id).toBe(incident.sys_id);
      expect(detail.priority).toBe(incident.priority);
    }
  )
);
```

### 3. Oracle Properties

Compare against a simpler reference implementation:

```typescript
// Example: Complex query builder matches simple implementation
fc.assert(
  fc.property(
    fc.array(fc.integer({ min: 1, max: 5 })),
    (priorities) => {
      const complexResult = buildPriorityQuery(priorities);
      const simpleResult = priorities.map(p => `priority=${p}`).join('^OR');
      expect(complexResult).toContain(simpleResult);
    }
  )
);
```

### 4. Idempotence Properties

Applying operation multiple times has same effect as once:

```typescript
// Example: Validation gives same result on repeated calls
fc.assert(
  fc.property(
    fc.string(),
    (script) => {
      const result1 = validator.validate(script);
      const result2 = validator.validate(script);
      expect(result1).toEqual(result2);
    }
  )
);
```

### 5. Security Properties

Security constraints must hold for all inputs:

```typescript
// Example: Blacklisted patterns always detected
fc.assert(
  fc.property(
    fc.constantFrom('eval', 'Function', 'gs.executeNow'),
    fc.string(),
    fc.string(),
    (dangerous, prefix, suffix) => {
      const script = `${prefix}${dangerous}(${suffix})`;
      const result = validator.validateScriptInclude(script);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  ),
  { numRuns: 100 }
);
```

## Arbitrary Generators

### Built-in Arbitraries

```typescript
// Primitives
fc.string()                    // Any string
fc.integer()                   // Any integer
fc.boolean()                   // true or false
fc.float()                     // Any float

// Constrained primitives
fc.integer({ min: 1, max: 5 }) // Priority values
fc.string({ minLength: 1 })    // Non-empty strings
fc.hexaString({ minLength: 32, maxLength: 32 }) // sys_id format

// Collections
fc.array(fc.string())          // Array of strings
fc.record({                    // Object with specific shape
  name: fc.string(),
  age: fc.integer()
})

// Choices
fc.constantFrom('New', 'In Progress', 'Closed') // Enum values
fc.oneof(fc.string(), fc.constant(null))        // String or null
```

### Custom Arbitraries

Create domain-specific generators:

```typescript
// ServiceNow sys_id generator
const sysIdArbitrary = () => 
  fc.hexaString({ minLength: 32, maxLength: 32 });

// Incident number generator
const incidentNumberArbitrary = () =>
  fc.integer({ min: 1, max: 9999999 })
    .map(n => `INC${String(n).padStart(7, '0')}`);

// Valid incident state generator
const incidentStateArbitrary = () =>
  fc.constantFrom('1', '2', '3', '6', '7');

// Complete incident generator
const incidentArbitrary = () =>
  fc.record({
    sys_id: sysIdArbitrary(),
    number: incidentNumberArbitrary(),
    state: incidentStateArbitrary(),
    priority: fc.integer({ min: 1, max: 5 }),
    short_description: fc.string({ minLength: 1, maxLength: 100 })
  });
```

### Filtering and Mapping

```typescript
// Filter: Only even numbers
fc.integer().filter(n => n % 2 === 0)

// Map: Transform generated values
fc.integer({ min: 0, max: 100 }).map(n => n / 100) // Percentage

// Chain: Dependent generation
fc.integer({ min: 1, max: 10 }).chain(size =>
  fc.array(fc.string(), { minLength: size, maxLength: size })
)
```

## Test Configuration

### Number of Runs

```typescript
// Default: 100 runs (good for most cases)
fc.assert(fc.property(arb, prop), { numRuns: 100 });

// Quick smoke test: 10-20 runs
fc.assert(fc.property(arb, prop), { numRuns: 20 });

// Thorough validation: 1000+ runs
fc.assert(fc.property(arb, prop), { numRuns: 1000 });

// Security-critical: 10000+ runs
fc.assert(fc.property(arb, prop), { numRuns: 10000 });
```

### Seed for Reproducibility

```typescript
// Use seed to reproduce failures
fc.assert(
  fc.property(arb, prop),
  { seed: 42, numRuns: 100 }
);
```

### Timeout Configuration

```typescript
// Set timeout for slow properties
fc.assert(
  fc.property(arb, prop),
  { timeout: 5000 } // 5 seconds
);
```

## Handling Failures

### Shrinking

When a property fails, fast-check automatically shrinks to minimal failing case:

```typescript
// Original failure: "asdkjfhaslkdjfhlaksjdhf"
// Shrunk to: "a"

// Use shrinking to understand root cause
fc.assert(
  fc.property(
    fc.string(),
    (input) => {
      // This will shrink to shortest failing string
      expect(validate(input)).toBe(true);
    }
  )
);
```

### Debugging Failed Properties

```typescript
// Add logging to understand failures
fc.assert(
  fc.property(
    fc.string(),
    (input) => {
      console.log('Testing with:', input);
      const result = transform(input);
      console.log('Result:', result);
      expect(result).toMatchSchema(schema);
    }
  )
);
```

### Pre-conditions

Use `fc.pre()` to skip invalid inputs:

```typescript
fc.assert(
  fc.property(
    fc.integer(),
    (n) => {
      fc.pre(n !== 0); // Skip when n is 0
      const result = 100 / n;
      expect(isFinite(result)).toBe(true);
    }
  )
);
```

## Common Patterns

### Testing Validation Functions

```typescript
describe('ScriptSecurityValidator Properties', () => {
  it('property: blacklisted patterns always detected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...BLACKLISTED_PATTERNS),
        fc.string(),
        (pattern, context) => {
          const script = `${context}${pattern}()`;
          const result = validator.validateScriptInclude(script);
          expect(result.isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('property: safe scripts always pass', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...SAFE_OPERATIONS)),
        (operations) => {
          const script = operations.join('; ');
          const result = validator.validateScriptInclude(script);
          expect(result.errors).toHaveLength(0);
        }
      )
    );
  });
});
```

### Testing Query Builders

```typescript
describe('Query Builder Properties', () => {
  it('property: query is always valid encoded query format', () => {
    fc.assert(
      fc.property(
        fc.record({
          state: fc.array(fc.string()),
          priority: fc.array(fc.integer({ min: 1, max: 5 }))
        }),
        (filters) => {
          const query = buildQuery(filters);
          // Must be string
          expect(typeof query).toBe('string');
          // Must use ServiceNow operators
          expect(query).toMatch(/^[a-zA-Z0-9_^=<>!]+$/);
        }
      )
    );
  });
});
```

### Testing Transformations

```typescript
describe('Transformation Properties', () => {
  it('property: summary contains subset of detail fields', () => {
    fc.assert(
      fc.property(
        incidentArbitrary(),
        (incident) => {
          const summary = toSummary(incident);
          const detail = toDetail(incident);
          
          // All summary fields present in detail
          expect(detail).toMatchObject(summary);
        }
      )
    );
  });
});
```

## Integration with Jest

### File Naming

```typescript
// Property tests in separate files
ServiceName.property.test.ts

// Or mixed with unit tests
ServiceName.test.ts // Contains both unit and property tests
```

### Test Organization

```typescript
describe('ServiceName', () => {
  describe('Unit Tests', () => {
    it('should handle specific case', () => {
      // Traditional unit test
    });
  });
  
  describe('Property Tests', () => {
    it('property: invariant holds for all inputs', () => {
      fc.assert(fc.property(arb, prop));
    });
  });
});
```

## Best Practices

1. **Start with simple properties**: Begin with basic invariants before complex properties
2. **Use meaningful property names**: Describe what property is being tested
3. **Keep properties focused**: One property per test
4. **Use appropriate numRuns**: Balance thoroughness with test speed
5. **Create domain-specific arbitraries**: Reuse generators across tests
6. **Document expected behavior**: Comment why property should hold
7. **Combine with unit tests**: Use both for comprehensive coverage
8. **Test security properties extensively**: Use high numRuns for security validation

## Common Pitfalls

### Avoid Tautologies

```typescript
// BAD: Property that always passes
fc.assert(
  fc.property(fc.string(), (s) => {
    const result = identity(s);
    expect(result).toBe(result); // Always true!
  })
);

// GOOD: Property that tests actual behavior
fc.assert(
  fc.property(fc.string(), (s) => {
    const result = identity(s);
    expect(result).toBe(s); // Tests identity function
  })
);
```

### Avoid Flaky Properties

```typescript
// BAD: Depends on current time
fc.assert(
  fc.property(fc.date(), (d) => {
    expect(d.getTime()).toBeLessThan(Date.now()); // Flaky!
  })
);

// GOOD: Tests relationship between inputs
fc.assert(
  fc.property(fc.date(), fc.date(), (d1, d2) => {
    const sorted = [d1, d2].sort();
    expect(sorted[0].getTime()).toBeLessThanOrEqual(sorted[1].getTime());
  })
);
```

### Avoid Over-Constraining

```typescript
// BAD: Too specific, not really property-based
fc.assert(
  fc.property(
    fc.constant('specific-value'),
    (val) => {
      expect(transform(val)).toBe('expected');
    }
  )
);

// GOOD: Tests general property
fc.assert(
  fc.property(
    fc.string(),
    (val) => {
      const result = transform(val);
      expect(typeof result).toBe('string');
    }
  )
);
```
