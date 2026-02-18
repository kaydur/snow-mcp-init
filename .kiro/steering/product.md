---
inclusion: auto
---

# ServiceNow MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with read-only access to ServiceNow incident data through a standardized protocol interface.

## Core Capabilities

- Query incidents with flexible filtering (state, priority, assignment, custom queries)
- Retrieve complete incident details by sys_id or incident number
- List recently updated incidents
- Secure authentication with ServiceNow instances
- Comprehensive logging with sensitive data sanitization

## Key Principles

- Read-only access - no data modification capabilities
- Security-first design with credential sanitization
- Structured error handling with detailed context
- Layered architecture separating concerns
- Environment-based configuration
