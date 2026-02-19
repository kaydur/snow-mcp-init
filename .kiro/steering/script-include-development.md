---
inclusion: fileMatch
fileMatchPattern: "**/scriptInclude*"
---

# Script Include Development Guide

## Script Include Types

### 1. Class-Based Script Includes (Most Common)

Used for reusable business logic with state and methods.

```javascript
var IncidentUtils = Class.create();
IncidentUtils.prototype = {
    initialize: function() {
        // Constructor - runs when new IncidentUtils() is called
        this.tableName = 'incident';
    },
    
    getOpenCount: function() {
        var count = 0;
        var gr = new GlideQuery(this.tableName)
            .where('active', true)
            .aggregate('count')
            .toArray();
        
        if (gr && gr.length > 0) {
            count = parseInt(gr[0].count) || 0;
        }
        return count;
    },
    
    getPriorityBreakdown: function() {
        var breakdown = {};
        var results = new GlideQuery(this.tableName)
            .where('active', true)
            .aggregate('count', 'priority')
            .groupBy('priority')
            .toArray();
        
        results.forEach(function(result) {
            breakdown[result.priority] = parseInt(result.count) || 0;
        });
        
        return breakdown;
    },
    
    type: 'IncidentUtils'
};
```

**Usage:**
```javascript
var utils = new IncidentUtils();
var count = utils.getOpenCount();
var breakdown = utils.getPriorityBreakdown();
```

### 2. On-Demand Script Includes

Used for utility functions that don't require instantiation.

```javascript
var StringUtils = Class.create();
StringUtils.prototype = {
    // Static-like methods
    
    type: 'StringUtils'
};

// Add static methods
StringUtils.isEmpty = function(str) {
    return !str || str.trim().length === 0;
};

StringUtils.truncate = function(str, maxLength) {
    if (!str || str.length <= maxLength) {
        return str;
    }
    return str.substring(0, maxLength) + '...';
};
```

**Usage:**
```javascript
// No instantiation needed
if (StringUtils.isEmpty(description)) {
    // Handle empty description
}

var short = StringUtils.truncate(longText, 100);
```

### 3. Client-Callable Script Includes (GlideAjax)

Used for server-side logic called from client scripts.

```javascript
var IncidentAjaxHandler = Class.create();
IncidentAjaxHandler.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    
    // Client-callable methods
    getIncidentCount: function() {
        var state = this.getParameter('sysparm_state');
        
        var count = 0;
        var result = new GlideQuery('incident')
            .where('state', state)
            .aggregate('count')
            .toArray();
        
        if (result && result.length > 0) {
            count = parseInt(result[0].count) || 0;
        }
        
        return JSON.stringify({ count: count });
    },
    
    getAssignmentGroups: function() {
        var groups = [];
        var results = new GlideQuery('sys_user_group')
            .where('active', true)
            .select('sys_id', 'name')
            .limit(100)
            .toArray();
        
        results.forEach(function(group) {
            groups.push({
                sys_id: group.sys_id,
                name: group.name
            });
        });
        
        return JSON.stringify({ groups: groups });
    },
    
    type: 'IncidentAjaxHandler'
});
```

**Client-Side Usage:**
```javascript
// In a client script
var ga = new GlideAjax('IncidentAjaxHandler');
ga.addParam('sysparm_name', 'getIncidentCount');
ga.addParam('sysparm_state', '1');
ga.getXMLAnswer(function(response) {
    var data = JSON.parse(response);
    alert('Count: ' + data.count);
});
```

### 4. Advanced Reference Qualifier Script Includes

Used for dynamic reference field filtering.

```javascript
var AdvancedReferenceQualifier = Class.create();
AdvancedReferenceQualifier.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    
    getAssignmentGroupQuery: function() {
        // Get current record values
        var current = this.getParameter('sysparm_current');
        var category = this.getParameter('sysparm_category');
        
        // Build dynamic query based on context
        var query = 'active=true';
        
        if (category === 'hardware') {
            query += '^typeIN' + 'hardware,desktop,server';
        } else if (category === 'software') {
            query += '^type=software';
        }
        
        return query;
    },
    
    type: 'AdvancedReferenceQualifier'
});
```

**Usage in Dictionary:**
```javascript
// Reference qualifier field
javascript:new AdvancedReferenceQualifier().getAssignmentGroupQuery();
```

## GlideQuery Patterns in Script Includes

### Basic Query

```javascript
getActiveIncidents: function() {
    return new GlideQuery('incident')
        .where('active', true)
        .select('number', 'short_description', 'priority')
        .toArray();
}
```

### Query with Multiple Conditions

```javascript
getHighPriorityUnassigned: function() {
    return new GlideQuery('incident')
        .where('active', true)
        .where('priority', '<=', 2)
        .whereNull('assigned_to')
        .orderByDesc('sys_created_on')
        .limit(100)
        .toArray();
}
```

### Aggregation

```javascript
getCountByState: function() {
    var results = new GlideQuery('incident')
        .where('active', true)
        .aggregate('count', 'state')
        .groupBy('state')
        .toArray();
    
    var breakdown = {};
    results.forEach(function(result) {
        breakdown[result.state] = parseInt(result.count) || 0;
    });
    
    return breakdown;
}
```

### Complex Aggregation

```javascript
getAverageResolutionTime: function() {
    var results = new GlideQuery('incident')
        .where('state', '6') // Resolved
        .where('resolved_at', '!=', '')
        .select('sys_created_on', 'resolved_at')
        .toArray();
    
    var totalMinutes = 0;
    var count = 0;
    
    results.forEach(function(incident) {
        var created = new GlideDateTime(incident.sys_created_on);
        var resolved = new GlideDateTime(incident.resolved_at);
        var diff = GlideDateTime.subtract(created, resolved);
        totalMinutes += diff.getNumericValue() / 1000 / 60;
        count++;
    });
    
    return count > 0 ? totalMinutes / count : 0;
}
```

### Insert Operation

```javascript
createIncident: function(data) {
    var result = new GlideQuery('incident')
        .insert({
            short_description: data.short_description,
            description: data.description,
            priority: data.priority || 3,
            caller_id: data.caller_id,
            category: data.category
        })
        .get();
    
    return result ? result.sys_id : null;
}
```

### Update Operation

```javascript
assignIncident: function(incidentSysId, userId, groupId) {
    var result = new GlideQuery('incident')
        .where('sys_id', incidentSysId)
        .update({
            assigned_to: userId,
            assignment_group: groupId,
            state: '2' // In Progress
        })
        .toArray();
    
    return result.length > 0;
}
```

### Batch Update (Use with Caution)

```javascript
closeOldIncidents: function(daysOld) {
    var cutoffDate = new GlideDateTime();
    cutoffDate.addDaysLocalTime(-daysOld);
    
    var result = new GlideQuery('incident')
        .where('state', '!=', '6')
        .where('state', '!=', '7')
        .where('sys_created_on', '<', cutoffDate.getValue())
        .updateMultiple({
            state: '7', // Closed
            close_code: 'Closed/Resolved by Caller',
            close_notes: 'Auto-closed due to age'
        });
    
    return result;
}
```

## Security Best Practices

### Avoid Blacklisted Patterns

**Never use:**
- `eval()` - Arbitrary code execution
- `Function()` - Dynamic function creation
- `gs.executeNow()` - Server-side eval
- `gs.eval()` - Server-side eval
- `require()` - Module loading
- `import()` - Dynamic imports
- File system operations
- Network requests outside ServiceNow APIs

### Use GlideQuery Instead of GlideRecord

**Bad:**
```javascript
var gr = new GlideRecord('incident');
gr.addQuery('active', true);
gr.query();
while (gr.next()) {
    // Process records
}
```

**Good:**
```javascript
var results = new GlideQuery('incident')
    .where('active', true)
    .select('sys_id', 'number')
    .toArray();

results.forEach(function(record) {
    // Process records
});
```

### Validate Input Parameters

```javascript
getIncidentsByPriority: function(priority) {
    // Validate input
    if (!priority || priority < 1 || priority > 5) {
        gs.error('Invalid priority value: ' + priority);
        return [];
    }
    
    return new GlideQuery('incident')
        .where('priority', priority)
        .select('number', 'short_description')
        .toArray();
}
```

### Use Proper Logging

**Bad:**
```javascript
gs.print('Debug: ' + value); // Discouraged
```

**Good:**
```javascript
gs.info('Processing incident: ' + incidentNumber);
gs.warn('Unusual condition detected: ' + condition);
gs.error('Failed to process: ' + error);
```

## Error Handling

### Try-Catch Pattern

```javascript
processIncident: function(incidentSysId) {
    try {
        var incident = new GlideQuery('incident')
            .where('sys_id', incidentSysId)
            .selectOne('number', 'state', 'priority');
        
        if (!incident) {
            gs.warn('Incident not found: ' + incidentSysId);
            return { success: false, error: 'NOT_FOUND' };
        }
        
        // Process incident
        var result = this._performProcessing(incident);
        
        return { success: true, result: result };
    } catch (e) {
        gs.error('Error processing incident: ' + e.message);
        return { success: false, error: 'PROCESSING_ERROR', message: e.message };
    }
}
```

### Validation Pattern

```javascript
validateIncidentData: function(data) {
    var errors = [];
    
    if (!data.short_description || data.short_description.trim().length === 0) {
        errors.push('Short description is required');
    }
    
    if (data.priority && (data.priority < 1 || data.priority > 5)) {
        errors.push('Priority must be between 1 and 5');
    }
    
    if (!data.caller_id) {
        errors.push('Caller is required');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
```

## Testing Script Includes

### Unit Test Pattern

```javascript
// In a test script
(function testIncidentUtils() {
    var utils = new IncidentUtils();
    
    // Test getOpenCount
    var count = utils.getOpenCount();
    gs.info('Open incident count: ' + count);
    
    // Test getPriorityBreakdown
    var breakdown = utils.getPriorityBreakdown();
    gs.info('Priority breakdown: ' + JSON.stringify(breakdown));
    
    // Assertions
    if (typeof count !== 'number') {
        gs.error('TEST FAILED: getOpenCount should return a number');
    }
    
    if (typeof breakdown !== 'object') {
        gs.error('TEST FAILED: getPriorityBreakdown should return an object');
    }
    
    gs.info('All tests passed');
})();
```

### Property-Based Test Pattern (External)

```typescript
// In fast-check test file
describe('IncidentUtils Properties', () => {
  it('property: getOpenCount always returns non-negative number', () => {
    fc.assert(
      fc.property(
        fc.nat(),
        (mockCount) => {
          // Mock GlideQuery to return mockCount
          const result = service.getOpenCount();
          expect(result).toBeGreaterThanOrEqual(0);
          expect(typeof result).toBe('number');
        }
      )
    );
  });
});
```

## Performance Optimization

### Limit Query Results

```javascript
// Bad: No limit
var results = new GlideQuery('incident')
    .where('active', true)
    .toArray();

// Good: With limit
var results = new GlideQuery('incident')
    .where('active', true)
    .limit(1000)
    .toArray();
```

### Select Only Needed Fields

```javascript
// Bad: Select all fields
var results = new GlideQuery('incident')
    .where('active', true)
    .toArray();

// Good: Select specific fields
var results = new GlideQuery('incident')
    .where('active', true)
    .select('sys_id', 'number', 'short_description')
    .toArray();
```

### Use Indexed Fields in Queries

```javascript
// Good: Uses indexed fields (sys_id, state, active)
var results = new GlideQuery('incident')
    .where('active', true)
    .where('state', '1')
    .toArray();

// Avoid: Custom fields may not be indexed
var results = new GlideQuery('incident')
    .where('u_custom_field', 'value')
    .toArray();
```

## Common Patterns

### Singleton Pattern

```javascript
var ConfigManager = Class.create();
ConfigManager.prototype = {
    initialize: function() {
        this.config = {};
        this._loadConfig();
    },
    
    _loadConfig: function() {
        // Load configuration once
        var results = new GlideQuery('sys_properties')
            .where('name', 'STARTSWITH', 'myapp.')
            .select('name', 'value')
            .toArray();
        
        results.forEach(function(prop) {
            this.config[prop.name] = prop.value;
        }, this);
    },
    
    get: function(key) {
        return this.config[key];
    },
    
    type: 'ConfigManager'
};

// Usage: Create once, reuse
var config = new ConfigManager();
var value = config.get('myapp.setting');
```

### Factory Pattern

```javascript
var NotificationFactory = Class.create();
NotificationFactory.prototype = {
    createNotification: function(type, data) {
        switch(type) {
            case 'email':
                return new EmailNotification(data);
            case 'sms':
                return new SMSNotification(data);
            case 'push':
                return new PushNotification(data);
            default:
                throw new Error('Unknown notification type: ' + type);
        }
    },
    
    type: 'NotificationFactory'
};
```

### Builder Pattern

```javascript
var IncidentBuilder = Class.create();
IncidentBuilder.prototype = {
    initialize: function() {
        this.data = {
            priority: 3,
            state: '1'
        };
    },
    
    withShortDescription: function(desc) {
        this.data.short_description = desc;
        return this;
    },
    
    withPriority: function(priority) {
        this.data.priority = priority;
        return this;
    },
    
    withCaller: function(callerId) {
        this.data.caller_id = callerId;
        return this;
    },
    
    build: function() {
        var result = new GlideQuery('incident')
            .insert(this.data)
            .get();
        
        return result ? result.sys_id : null;
    },
    
    type: 'IncidentBuilder'
};

// Usage
var incidentId = new IncidentBuilder()
    .withShortDescription('Network issue')
    .withPriority(2)
    .withCaller(userSysId)
    .build();
```

## Documentation Standards

### JSDoc Comments

```javascript
/**
 * Utility class for incident management operations
 * @class IncidentUtils
 */
var IncidentUtils = Class.create();
IncidentUtils.prototype = {
    /**
     * Initialize the IncidentUtils instance
     * @constructor
     */
    initialize: function() {
        this.tableName = 'incident';
    },
    
    /**
     * Get count of open incidents
     * @returns {number} Count of open incidents
     */
    getOpenCount: function() {
        // Implementation
    },
    
    /**
     * Get breakdown of incidents by priority
     * @returns {Object} Object with priority as key and count as value
     * @example
     * // Returns: { "1": 5, "2": 10, "3": 20 }
     * var breakdown = utils.getPriorityBreakdown();
     */
    getPriorityBreakdown: function() {
        // Implementation
    },
    
    type: 'IncidentUtils'
};
```
