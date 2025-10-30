<!-- 5ca2c206-175d-4527-850e-6a92cf7c0e0a f04c48f7-4067-4fe7-a291-85edcfebe297 -->
# SQLite Database Implementation for Discord Moderation Tool

## Overview

This plan implements a comprehensive SQLite database system to track moderation actions, user history, and enable appeals and analytics functionality.

## Key Files & Structure

Create the following file structure:

```
src/
├── database/
│   ├── index.ts          # Database connection & initialization
│   ├── models/           # TypeScript models
│   ├── migrations/       # Database migration files
│   └── operations/       # CRUD operations
└── types/
    └── database.ts       # Database type definitions
```

## Database Schema

**Three main tables:**

- `users` - Store user info (Discord ID, username, etc.)
- `actions` - Store moderation actions with metadata
- `action_types` - Define available action types (warning, mute, ban, etc.)

## Implementation Approach

Work through the following phases in order:

1. **Database Setup**: Install `better-sqlite3` and create database connection module
2. **Schema Creation**: Implement migrations for users, actions, and action_types tables
3. **TypeScript Integration**: Create type definitions and model classes
4. **CRUD Operations**: Implement database operations for users and actions
5. **Command Integration**: Update existing moderation commands to log actions
6. **Advanced Features**: Add appeals system and analytics
7. **Testing**: Write tests and optimize performance

## Key Integration Points

- Modify existing commands in `src/commands/` to log actions
- Update `env.ts` for database configuration
- Add database initialization to bot startup

## Benefits

- Complete audit trail of moderation actions
- Track repeat offenders and patterns
- Enable appeals system
- Generate moderation analytics
- Maintain compliance records

### To-dos

- [ ] Install better-sqlite3 dependencies and create database connection module
- [ ] Create migration files for users, actions, and action_types tables
- [ ] Define TypeScript interfaces and models for database entities
- [ ] Implement CRUD operations for users and actions
- [ ] Update existing moderation commands to log actions to database
- [ ] Implement appeals system and analytics queries
- [ ] Write tests and optimize database performance