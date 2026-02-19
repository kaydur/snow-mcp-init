---
inclusion: fileMatch
fileMatchPattern: "**/service-portal*"
---

# Service Portal Development Guide

## Overview

Service Portal is ServiceNow's AngularJS-based framework for building custom user interfaces. It uses AngularJS 1.5.x and Bootstrap 3.3.7 to create responsive, interactive portals for end users.

## Widget Architecture

### Widget Components

A Service Portal widget consists of up to 7 components:

1. **HTML Template** (required) - AngularJS template with directives
2. **CSS/SCSS** (optional) - Styles automatically scoped to the widget
3. **Client Script** (optional) - AngularJS controller running in browser
4. **Server Script** (optional) - Server-side JavaScript with ServiceNow API access
5. **Link Function** (optional) - Direct DOM manipulation
6. **Option Schema** (optional) - JSON schema for widget configuration
7. **Demo Data** (optional) - JSON test data for development

### Widget Lifecycle

```
1. Server Script executes first
   ↓
2. Initializes data object
   ↓
3. Sends data to client as JSON
   ↓
4. Client Controller receives data
   ↓
5. HTML Template renders with data
   ↓
6. Link Function executes (if present)
```

## Server-Side Development

### $sp API Object

The `$sp` object provides server-side methods for Service Portal:

```javascript
// Server Script
(function() {
  // Get current record
  var gr = $sp.getRecord();
  
  // Get URL parameter
  var id = $sp.getParameter('id');
  
  // Get embedded widget
  data.childWidget = $sp.getWidget('widget-id', {
    table: 'incident',
    sys_id: id
  });
  
  // Get display value for reference field
  data.assignedTo = $sp.getDisplayValue(gr, 'assigned_to');
  
  // Get menu HREF
  data.href = $sp.getMenuHREF(gr);
  
  // Get portal configuration
  var portal = $sp.getPortal();
  data.portalTitle = portal.title;
  
  // Get form configuration
  data.form = $sp.getForm('incident', id);
  
  // Get catalog item
  data.catalogItem = $sp.getCatalogItem('sys_id');
  
  // Get activity stream
  data.stream = $sp.getStream('incident', id);
  
  // Get list columns
  data.columns = $sp.getListColumns('incident');
  
  // Get field values
  data.values = $sp.getValues({
    table: 'incident',
    sys_id: id,
    fields: 'number,short_description,priority'
  });
})();
```

### Server Script Objects

Three global objects are available in server scripts:

```javascript
// input - Data sent from client controller
if (input && input.action === 'submit') {
  // Process client request
  var result = processData(input.data);
  data.result = result;
}

// options - Widget instance configuration
var title = options.title || 'Default Title';
var showDetails = options.show_details || false;

// data - Object sent to client controller
data.message = 'Hello from server';
data.records = getRecords();
data.config = {
  title: title,
  showDetails: showDetails
};
```

### Best Practices - Server Scripts

```javascript
// GOOD: Use Script Includes for data operations
var utils = new IncidentUtils();
data.incidents = utils.getOpenIncidents();

// BAD: Inline data operations in server script
var gr = new GlideRecord('incident');
gr.addQuery('active', true);
gr.query();
// ... lots of code

// GOOD: Use $sp.getRecord() for current record
var gr = $sp.getRecord();

// BAD: Use GlideRecord when $sp method available
var gr = new GlideRecord('incident');
gr.get(sys_id);

// GOOD: Use getDisplayValue() for reference fields
data.assignedTo = $sp.getDisplayValue(gr, 'assigned_to');

// BAD: Multiple queries for display values
var userGr = new GlideRecord('sys_user');
userGr.get(gr.getValue('assigned_to'));
data.assignedTo = userGr.getDisplayValue('name');
```

## Client-Side Development

### Client Controller Structure

```javascript
// Client Script
function($scope, spUtil, $location) {
  var c = this;
  
  // Access server data
  c.message = c.data.message;
  c.records = c.data.records;
  
  // Access widget options
  c.title = c.options.title;
  
  // Client-side methods
  c.onClick = function() {
    // Handle user interaction
    processClick();
  };
  
  c.submitForm = function() {
    // Send data to server
    c.server.update().then(function(response) {
      c.data = response.data;
    });
  };
  
  c.getData = function() {
    // Send specific data to server
    c.server.get({
      action: 'getData',
      id: c.recordId
    }).then(function(response) {
      c.data = response.data;
    });
  };
}
```

### spUtil Service

The `spUtil` service provides common client-side operations:

```javascript
// Client Script
function($scope, spUtil) {
  var c = this;
  
  // Watch for record updates
  spUtil.recordWatch($scope, 'incident', c.data.sys_id, function(name, data) {
    // Record was updated
    c.data = data;
  });
  
  // Update widget
  spUtil.update($scope);
  
  // Send data to server and update
  spUtil.get('widget-id', {
    action: 'getData',
    id: c.recordId
  }).then(function(response) {
    c.data = response.data;
  });
  
  // Show messages
  spUtil.addTrivialMessage('Operation completed');
  spUtil.addInfoMessage('Information message');
  spUtil.addErrorMessage('Error occurred');
}
```

### Client-Server Communication

```javascript
// CLIENT SCRIPT
function($scope) {
  var c = this;
  
  // Method 1: server.update() - uses ng-model bindings
  $scope.name = 'John';
  c.submitName = function() {
    c.server.update().then(function(response) {
      // Server script receives $scope.name in input object
      c.data = response.data;
    });
  };
  
  // Method 2: server.get() - pass explicit data
  c.getData = function() {
    c.server.get({
      action: 'fetchData',
      recordId: c.recordId,
      filters: c.filters
    }).then(function(response) {
      // Server script receives data in input object
      c.data = response.data;
    });
  };
}

// SERVER SCRIPT
(function() {
  // Receive data from client
  if (input) {
    if (input.action === 'fetchData') {
      var recordId = input.recordId;
      var filters = input.filters;
      
      // Process and return data
      data.result = processData(recordId, filters);
    }
    
    // Access ng-model values from server.update()
    if (input.name) {
      data.greeting = 'Hello, ' + input.name;
    }
  }
})();
```

## HTML Template Development

### AngularJS Directives

```html
<!-- Conditional rendering -->
<div ng-if="c.data.showDetails">
  Details content
</div>

<!-- Loop through array -->
<ul>
  <li ng-repeat="item in c.data.items track by item.sys_id">
    {{item.name}}
  </li>
</ul>

<!-- Two-way data binding -->
<input ng-model="c.searchText" type="text" />

<!-- Click handler -->
<button ng-click="c.onClick()">Click Me</button>

<!-- Show/Hide -->
<div ng-show="c.data.isVisible">Visible content</div>
<div ng-hide="c.data.isHidden">Hidden content</div>

<!-- Dynamic classes -->
<div ng-class="{'active': c.isActive, 'disabled': c.isDisabled}">
  Content
</div>

<!-- Dynamic styles -->
<div ng-style="{'color': c.textColor, 'font-size': c.fontSize}">
  Styled content
</div>

<!-- Bind HTML (use with caution) -->
<div ng-bind-html="c.data.htmlContent"></div>

<!-- Form submission -->
<form ng-submit="c.submitForm()">
  <input ng-model="c.formData.name" />
  <button type="submit">Submit</button>
</form>
```

### AngularJS Filters

```html
<!-- Order by -->
<li ng-repeat="person in c.data.people | orderBy: 'age'">
  {{person.name}} - {{person.age}}
</li>

<!-- Filter -->
<li ng-repeat="item in c.data.items | filter: {active: true}">
  {{item.name}}
</li>

<!-- Limit -->
<li ng-repeat="item in c.data.items | limitTo: 5">
  {{item.name}}
</li>

<!-- Date formatting -->
<span>{{c.data.createdOn | date: 'short'}}</span>

<!-- Currency -->
<span>{{c.data.price | currency}}</span>

<!-- Number formatting -->
<span>{{c.data.value | number: 2}}</span>
```

### One-Time Binding (Performance)

```html
<!-- BAD: Creates watcher, updates on every digest cycle -->
<h1>{{c.data.title}}</h1>

<!-- GOOD: One-time binding, no watcher after initial render -->
<h1>{{::c.data.title}}</h1>

<!-- Use one-time binding for static data -->
<div class="panel">
  <div class="panel-heading">{{::c.options.title}}</div>
  <div class="panel-body">
    <!-- Dynamic content still uses regular binding -->
    <p>{{c.data.message}}</p>
  </div>
</div>
```

### Bootstrap 3.3.7 Components

```html
<!-- Grid System -->
<div class="container">
  <div class="row">
    <div class="col-md-6">Left column</div>
    <div class="col-md-6">Right column</div>
  </div>
</div>

<!-- Panel -->
<div class="panel panel-default">
  <div class="panel-heading">{{::c.options.title}}</div>
  <div class="panel-body">
    Content
  </div>
</div>

<!-- Buttons -->
<button class="btn btn-primary">Primary</button>
<button class="btn btn-success">Success</button>
<button class="btn btn-danger">Danger</button>

<!-- Forms -->
<div class="form-group">
  <label for="name">Name</label>
  <input type="text" class="form-control" id="name" ng-model="c.name" />
</div>

<!-- Alerts -->
<div class="alert alert-info">
  Information message
</div>

<!-- Modal -->
<div class="modal fade" id="myModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">Modal Title</h4>
      </div>
      <div class="modal-body">
        Modal content
      </div>
      <div class="modal-footer">
        <button class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
```

### Embedded Widgets

```html
<!-- Embed widget with options -->
<widget id="widget-id" options="c.widgetOptions"></widget>

<!-- Embed widget in ng-repeat -->
<div ng-repeat="item in c.data.items">
  <widget id="item-widget" options="item"></widget>
</div>

<!-- Server-side widget embedding -->
<!-- In server script: data.childWidget = $sp.getWidget('widget-id', {param: value}); -->
<sp-widget widget="c.data.childWidget"></sp-widget>
```

## CSS/SCSS Development

### SCSS Variables

```scss
// Use theme variables for consistency
.widget-container {
  background-color: $panel-bg;
  border-color: $panel-border;
  padding: $padding-base-vertical $padding-base-horizontal;
}

// Define widget-specific variables
$widget-primary-color: #007bff;
$widget-spacing: 15px;

.widget-header {
  color: $widget-primary-color;
  margin-bottom: $widget-spacing;
}
```

### SCSS Nesting

```scss
.widget-container {
  padding: 20px;
  
  .widget-header {
    font-size: 24px;
    margin-bottom: 10px;
    
    &:hover {
      color: $primary-color;
    }
  }
  
  .widget-body {
    padding: 10px;
    
    p {
      line-height: 1.5;
    }
  }
}
```

### CSS Scoping

```scss
// Widget CSS is automatically scoped
// .my-class becomes .v<widget-sys-id> .my-class

// This means you can use simple class names without conflicts
.container {
  // Only affects this widget
}

// But be aware of inheritance from parent CSS
// Use specific names to avoid conflicts
.my-widget-container {
  // More specific, less likely to conflict
}
```

## Link Function Development

### Link Function Structure

```javascript
// Link Function
function(scope, element, attrs, controller) {
  // Direct DOM manipulation
  var headerElement = element.find('.widget-header');
  headerElement.css('color', scope.options.headerColor);
  
  // Listen for events
  element.on('click', '.clickable', function() {
    scope.$apply(function() {
      controller.handleClick();
    });
  });
  
  // Initialize third-party libraries
  element.find('.datepicker').datepicker({
    onSelect: function(date) {
      scope.$apply(function() {
        controller.selectedDate = date;
      });
    }
  });
  
  // Cleanup on destroy
  scope.$on('$destroy', function() {
    element.off('click');
    element.find('.datepicker').datepicker('destroy');
  });
}
```

### When to Use Link Function

```javascript
// GOOD: Use link function for DOM manipulation
// - Initializing jQuery plugins
// - Direct DOM access
// - Event listeners on DOM elements
// - Measuring element dimensions

// BAD: Use link function for business logic
// - Data processing
// - API calls
// - State management
// These should be in the controller
```

## Option Schema Development

### Option Schema Structure

```json
[
  {
    "name": "title",
    "label": "Widget Title",
    "type": "string",
    "default_value": "My Widget"
  },
  {
    "name": "show_details",
    "label": "Show Details",
    "type": "boolean",
    "default_value": false
  },
  {
    "name": "max_items",
    "label": "Maximum Items",
    "type": "integer",
    "default_value": 10
  },
  {
    "name": "table",
    "label": "Table",
    "type": "reference",
    "ed_name": "sys_db_object"
  },
  {
    "name": "primary_field",
    "label": "Primary Field",
    "type": "field_name"
  },
  {
    "name": "secondary_fields",
    "label": "Secondary Fields",
    "type": "field_list"
  }
]
```

### Accessing Options

```javascript
// Server Script
(function() {
  var title = options.title || 'Default Title';
  var showDetails = options.show_details || false;
  var maxItems = options.max_items || 10;
  
  data.config = {
    title: title,
    showDetails: showDetails,
    maxItems: maxItems
  };
})();

// Client Script
function() {
  var c = this;
  
  // Access options
  c.title = c.options.title;
  c.showDetails = c.options.show_details;
}

// HTML Template
<h1>{{::c.options.title}}</h1>
<div ng-if="c.options.show_details">
  Details content
</div>
```

## Performance Best Practices

### One-Time Bindings

```html
<!-- Use :: for static data -->
<h1>{{::c.data.title}}</h1>
<p>{{::c.options.description}}</p>

<!-- Regular binding for dynamic data -->
<p>{{c.data.liveCounter}}</p>
```

### Avoid Excessive Watchers

```javascript
// BAD: Creates many watchers
$scope.$watch('c.data.field1', function() { });
$scope.$watch('c.data.field2', function() { });
$scope.$watch('c.data.field3', function() { });

// GOOD: Watch object once
$scope.$watch('c.data', function(newVal, oldVal) {
  if (newVal.field1 !== oldVal.field1) {
    // Handle field1 change
  }
}, true);

// BETTER: Use ng-change in template
<input ng-model="c.data.field" ng-change="c.onFieldChange()" />
```

### Use Script Includes

```javascript
// BAD: Data logic in server script
(function() {
  var gr = new GlideRecord('incident');
  gr.addQuery('active', true);
  gr.addQuery('priority', '<=', 2);
  gr.orderByDesc('sys_created_on');
  gr.setLimit(100);
  gr.query();
  
  var incidents = [];
  while (gr.next()) {
    incidents.push({
      sys_id: gr.getValue('sys_id'),
      number: gr.getValue('number'),
      // ... more fields
    });
  }
  data.incidents = incidents;
})();

// GOOD: Use Script Include
(function() {
  var utils = new IncidentUtils();
  data.incidents = utils.getHighPriorityIncidents(100);
})();
```

### Navigation

```javascript
// BAD: Full page reload
$window.location.href = '/sp?id=ticket&sys_id=' + sysId;

// GOOD: Single page navigation
$location.search({
  id: 'ticket',
  sys_id: sysId
});
```

## Security Best Practices

### XSS Prevention

```html
<!-- BAD: Unsafe HTML binding -->
<div ng-bind-html="c.data.userInput"></div>

<!-- GOOD: Sanitize first -->
<div ng-bind-html="c.data.sanitizedInput"></div>

<!-- In client script -->
function($sce) {
  var c = this;
  c.data.sanitizedInput = $sce.trustAsHtml(c.data.userInput);
}
```

### Avoid Dangerous Patterns

```javascript
// NEVER use eval
eval(userInput); // DANGEROUS

// NEVER use Function constructor
new Function(userInput)(); // DANGEROUS

// NEVER use innerHTML directly
element[0].innerHTML = userInput; // DANGEROUS

// Use Angular's built-in sanitization
<div ng-bind-html="c.data.content"></div>
```

### Validate Server-Side

```javascript
// Server Script
(function() {
  if (input && input.action === 'submit') {
    // Validate input
    if (!input.data || typeof input.data !== 'object') {
      data.error = 'Invalid input';
      return;
    }
    
    // Sanitize strings
    var name = String(input.data.name || '').substring(0, 100);
    
    // Validate numbers
    var priority = parseInt(input.data.priority);
    if (isNaN(priority) || priority < 1 || priority > 5) {
      data.error = 'Invalid priority';
      return;
    }
    
    // Process validated data
    data.result = processData(name, priority);
  }
})();
```

## Common Patterns

### Loading State

```javascript
// Client Script
function() {
  var c = this;
  
  c.loading = false;
  
  c.loadData = function() {
    c.loading = true;
    c.server.get({action: 'loadData'}).then(function(response) {
      c.data = response.data;
      c.loading = false;
    });
  };
}

// HTML Template
<div ng-if="c.loading">
  <i class="fa fa-spinner fa-spin"></i> Loading...
</div>
<div ng-if="!c.loading">
  <!-- Content -->
</div>
```

### Error Handling

```javascript
// Client Script
function(spUtil) {
  var c = this;
  
  c.submitForm = function() {
    c.server.update().then(
      function(response) {
        // Success
        spUtil.addInfoMessage('Form submitted successfully');
        c.data = response.data;
      },
      function(error) {
        // Error
        spUtil.addErrorMessage('Error submitting form: ' + error.message);
      }
    );
  };
}
```

### Pagination

```javascript
// Client Script
function() {
  var c = this;
  
  c.currentPage = 1;
  c.pageSize = 10;
  
  c.nextPage = function() {
    c.currentPage++;
    c.loadPage();
  };
  
  c.prevPage = function() {
    if (c.currentPage > 1) {
      c.currentPage--;
      c.loadPage();
    }
  };
  
  c.loadPage = function() {
    c.server.get({
      action: 'loadPage',
      page: c.currentPage,
      pageSize: c.pageSize
    }).then(function(response) {
      c.data.items = response.data.items;
      c.data.totalPages = response.data.totalPages;
    });
  };
}
```

### Modal Dialog

```javascript
// Client Script
function($uibModal) {
  var c = this;
  
  c.openModal = function() {
    var modalInstance = $uibModal.open({
      template: '<div class="modal-body">Modal content</div>',
      controller: function($scope, $uibModalInstance) {
        $scope.close = function() {
          $uibModalInstance.close();
        };
      }
    });
    
    modalInstance.result.then(function() {
      // Modal closed
    });
  };
}
```

## Testing Widgets

### Demo Data

```json
{
  "incidents": [
    {
      "sys_id": "abc123",
      "number": "INC0010001",
      "short_description": "Test incident",
      "priority": 2
    }
  ],
  "config": {
    "title": "Test Widget",
    "showDetails": true
  }
}
```

### Widget Previewer

1. Open widget in Widget Editor
2. Click hamburger menu → "Enable Preview"
3. Click eye icon to open previewer
4. Add demo data in "Demo Data (JSON)" tab
5. Preview widget with test data

## Common Pitfalls

### Don't Use $scope.$apply() Unnecessarily

```javascript
// BAD: Unnecessary $apply
$scope.$apply(function() {
  c.data.value = newValue;
});

// GOOD: Angular handles digest cycle
c.data.value = newValue;

// ONLY use $apply when outside Angular context
element.on('click', function() {
  $scope.$apply(function() {
    c.handleClick();
  });
});
```

### Don't Manipulate DOM in Controller

```javascript
// BAD: DOM manipulation in controller
function() {
  var c = this;
  c.changeColor = function() {
    $('.widget-header').css('color', 'red');
  };
}

// GOOD: Use ng-style or ng-class
function() {
  var c = this;
  c.headerColor = 'black';
  c.changeColor = function() {
    c.headerColor = 'red';
  };
}

// HTML
<div class="widget-header" ng-style="{'color': c.headerColor}">
  Header
</div>
```

### Don't Forget Track By in ng-repeat

```html
<!-- BAD: No track by -->
<li ng-repeat="item in c.data.items">
  {{item.name}}
</li>

<!-- GOOD: Track by unique identifier -->
<li ng-repeat="item in c.data.items track by item.sys_id">
  {{item.name}}
</li>
```
