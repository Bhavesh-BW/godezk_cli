# GoDezk CLI - Complete Development Journey & Handover

This document is the complete handover guide for the GoDezk CLI project.

## Completed

-   CLI Scaffold
-   Persistent Configuration
-   Authentication Foundation
-   Workflow Catalog
-   Workflow Installation
-   Installed Workflow Management

## Open Issue

The only known issue is uninstalling an installation that is referenced
by deployments.

Expected backend fix: - Detect dependent deployments before delete. -
Return a friendly API error instead of a raw PostgreSQL foreign-key
constraint message.

------------------------------------------------------------------------

------------------------------------------------------------------------

# GoDezk CLI Development Journey

## Project Goal

Build a production-quality, installable CLI named **`gdk`** that allows
operators to interact with the GoDezk backend entirely from the
terminal.

Long-term examples:

``` bash
gdk auth login
gdk workflow list
gdk workflow install <id>
gdk deploy create
gdk exec watch
```

------------------------------------------------------------------------

# Milestone 1 -- Project Scaffolding

## Environment

-   Node.js v22.13.1
-   npm 11.11.1
-   TypeScript 5.9.x (stable)
-   VS Code
-   Git

## Initial Project Structure

``` text
godezk-cli/
├── bin/
│   └── gdk
├── src/
│   ├── api/
│   ├── commands/
│   ├── config/
│   ├── utils/
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Packages Installed

Runtime

-   commander
-   axios
-   chalk
-   conf
-   ora
-   inquirer

Development

-   typescript
-   ts-node
-   @types/node

## CLI Bootstrap

Configured:

-   `package.json`
-   `bin/gdk`
-   TypeScript compilation
-   npm global linking

Verified:

``` bash
npm run build
npm link
gdk
gdk --help
```

Result:

-   Global `gdk` command works.
-   CLI can be executed from any directory.

------------------------------------------------------------------------

# Milestone 2 -- Command Registration

The application was refactored into a modular architecture.

Instead of placing all logic inside `index.ts`, command registration was
separated.

## Architecture

``` text
index.ts
│
├── registerAuthCommands()
└── registerConfigCommands()
```

Created:

``` text
src/
└── commands/
    ├── auth.ts
    └── config.ts
```

Current command tree:

``` text
gdk
├── auth
└── config
```

Verified:

``` bash
gdk auth --help
gdk config --help
```

------------------------------------------------------------------------

# Milestone 3 -- Persistent Configuration

A dedicated configuration module was introduced.

Created:

``` text
src/config/config.ts
```

Responsibilities:

-   Store server URL
-   Read server URL
-   Abstract the underlying storage implementation

Current API:

``` ts
setServer(url)
getServer()
```

The command layer never interacts directly with the storage library.

Architecture:

``` text
CLI Command
      │
      ▼
commands/config.ts
      │
      ▼
config/config.ts
      │
      ▼
conf library
```

Implemented commands:

``` bash
gdk config set server http://localhost:8090
gdk config get server
gdk config list
```

Verified:

-   Configuration persists after closing and reopening the terminal.

------------------------------------------------------------------------

# Git Workflow

Repository initialized.

Recommended workflow adopted:

``` text
main
│
├── Initial CLI Scaffold
├── Persistent Configuration
│
└── dev
```

Development takes place on `dev`, while `main` remains stable.

Suggested commit style:

``` text
feat(config): add persistent configuration
feat(auth): implement login command
refactor(cli): separate command registration
```

------------------------------------------------------------------------

# Current Architecture

``` text
src
│
├── api
├── commands
│   ├── auth.ts
│   └── config.ts
├── config
│   └── config.ts
├── utils
└── index.ts
```

------------------------------------------------------------------------

# Achievements

-   Installable CLI
-   Global `gdk` command
-   Modular command registration
-   Persistent configuration
-   Git workflow established
-   Clean project structure

------------------------------------------------------------------------

# Next Milestone

Implement the HTTP communication layer.

Planned files:

``` text
src/api/
├── client.ts
└── auth.ts
```

Flow:

``` text
gdk auth login
        │
        ▼
commands/auth.ts
        │
        ▼
api/auth.ts
        │
        ▼
api/client.ts
        │
        ▼
GoDezk Backend
```

After that, authentication, token storage, and all workflow/deployment
APIs will reuse the same HTTP client.

------------------------------------------------------------------------

**Status:** Milestone 3 Complete ✅

------------------------------------------------------------------------

# Workflow Installation Design Notes (Review Before Implementation)

## Current Understanding

`gdk workflow list` represents the Workflow Catalog, not installed
workflows.

Workflow lifecycle:

Workflow Catalog -\> workflow show -\> workflow install -\> Installed
Workflow -\> activate / deactivate -\> Deployment

## Docker-style ID Support

Support both:

-   Full UUID
-   Short unique suffix (for example: 5708)

Behaviour:

-   Unique match -\> show workflow.
-   Multiple matches -\> ask for a longer ID.
-   No match -\> friendly error.

## Naming Recommendation

Keep CLI commands:

-   gdk workflow list
-   gdk workflow show
-   gdk workflow install

Internally separate:

src/api/ - workflowCatalog.ts - installedWorkflows.ts

src/types/ - workflowCatalog.ts - installedWorkflow.ts

## User Journey

Discover - gdk workflow list

Inspect - gdk workflow show `<id>`{=html}

Install - gdk workflow install `<id>`{=html}

Manage - gdk install list - gdk install activate - gdk install
deactivate - gdk install uninstall

Deploy - gdk deployment create

Observe - gdk exec watch

## Installation UX

Rather than requiring many CLI flags, installation should:

1.  Read workflow definition.
2.  Detect required parameters.
3.  Prompt for missing values.
4.  Submit configuration.

Example:

Camera URL: rtsp://192.168.1.10/live Confidence Threshold \[0.5\]: 0.7
Enable Smoke Detection? (Y/n): y

This provides a much better operator experience while still allowing
future automation.

## Next Milestone Scope

-   Implement workflow installation only.
-   Reuse existing authentication.
-   Reuse shared Axios client.
-   Keep installation separate from catalog logic.
-   Maintain strong TypeScript typing.
-   Continue milestone-based development.

------------------------------------------------------------------------

# GoDezk CLI - Milestone 7: Installed Workflow Management

## Objective

Implement management commands for **installed workflows**.

This milestone starts **after** Authentication, Workflow Catalog, and
Workflow Installation are complete.

------------------------------------------------------------------------

# Important Domain Separation

There are two different concepts:

## Workflow Catalog

Available workflow templates.

Commands:

``` bash
gdk workflow list
gdk workflow show <catalog-id>
gdk workflow install <catalog-id>
```

These commands work with **Catalog IDs**.

------------------------------------------------------------------------

## Installed Workflows

Workflow instances already installed for an organization.

Commands:

``` bash
gdk install list
gdk install show <installation-id>
gdk install activate <installation-id>
gdk install deactivate <installation-id>
gdk install uninstall <installation-id>
```

These commands work with **Installation IDs**, never Catalog IDs.

Do not mix these two concepts.

------------------------------------------------------------------------

# Architecture

Maintain the existing layered architecture:

``` text
commands
    ↓
api
    ↓
client.ts
    ↓
Backend
```

Business logic must not be placed inside command files.

------------------------------------------------------------------------

# Files To Create

``` text
src/api/installations.ts
src/commands/install.ts
src/types/installation.ts
```

------------------------------------------------------------------------

# Files To Modify

``` text
src/index.ts
```

Only register the new install command.

------------------------------------------------------------------------

# Commands To Implement

## 1. List Installations

``` bash
gdk install list
```

Display:

-   Installation ID
-   Workflow Name
-   Status
-   Version
-   Created At (if available)

------------------------------------------------------------------------

## 2. Show Installation

``` bash
gdk install show <installation-id>
```

Display detailed information for a single installation.

Support:

-   Full UUID
-   Last-N-character suffix resolution (same behaviour as workflow
    commands)

------------------------------------------------------------------------

## 3. Activate Installation

``` bash
gdk install activate <installation-id>
```

Expected output:

``` text
✅ Installation activated successfully.
```

------------------------------------------------------------------------

## 4. Deactivate Installation

``` bash
gdk install deactivate <installation-id>
```

Expected output:

``` text
✅ Installation deactivated successfully.
```

------------------------------------------------------------------------

## 5. Uninstall

``` bash
gdk install uninstall <installation-id>
```

Before uninstalling, ask for confirmation.

Example:

``` text
Are you sure you want to uninstall this workflow? (Y/n)
```

Do not uninstall without confirmation.

------------------------------------------------------------------------

# API Design

Create a dedicated API module.

Example:

``` text
api/installations.ts
```

It should expose functions similar to:

-   getInstallations()
-   getInstallation(id)
-   activateInstallation(id)
-   deactivateInstallation(id)
-   uninstallInstallation(id)

Reuse the existing Axios client.

Do not call Axios directly from command files.

------------------------------------------------------------------------

# TypeScript

Create:

``` text
types/installation.ts
```

Define proper interfaces.

Do not use `any`.

------------------------------------------------------------------------

# Error Handling

Continue using the existing error strategy.

Examples:

-   Not logged in
-   Installation not found
-   Network unavailable
-   Backend validation errors

Errors must remain user friendly.

------------------------------------------------------------------------

# Build Requirements

-   Project must compile successfully.
-   No breaking changes to authentication.
-   No breaking changes to workflow catalog.
-   Keep the project modular.

------------------------------------------------------------------------

# Out Of Scope

Do NOT implement:

-   Deployment commands
-   Execution commands
-   Device assignment
-   Runtime monitoring

Those belong to later milestones.

------------------------------------------------------------------------

# Goal

After this milestone the CLI should support the complete lifecycle:

``` text
Workflow Catalog
        ↓
Install
        ↓
List Installed Workflows
        ↓
Show Installation
        ↓
Activate
        ↓
Deactivate
        ↓
Uninstall
```

Only after this milestone is complete should we begin implementing
Deployment commands.

------------------------------------------------------------------------

# GoDezk CLI Journey - Workflow Installation & Management

## Completed

-   Installable CLI
-   Persistent configuration
-   Authentication
-   Workflow catalog
-   Workflow installation
-   Installed workflow management

## Commands Added

-   gdk install list
-   gdk install show `<installation-id>`{=html}
-   gdk install activate `<installation-id>`{=html}
-   gdk install deactivate `<installation-id>`{=html}
-   gdk install uninstall `<installation-id>`{=html}

## QA Results

Passed: - Build - Login/logout - Authentication guard - Installation
list - Installation details - Short ID support - Activate/deactivate -
Confirmation prompt

Known Issue: - Backend returns a raw PostgreSQL foreign-key error during
uninstall when deployments exist.

## Next Milestone

Deployment Management after backend uninstall error handling is
improved.

------------------------------------------------------------------------

# Workflow Uninstall Bug Report

## Summary

During QA, uninstalling an installation that is referenced by
deployments failed with a PostgreSQL foreign key constraint error.

## Observed Error

    update or delete on table "workflow_org_installations"
    violates foreign key constraint
    "workflow_org_deployments_installation_id_fkey"

## Analysis

The CLI is behaving correctly. The database is preventing deletion
because deployments still reference the installation.

The improvement belongs in the backend.

## Expected Backend Behaviour

-   Check for dependent deployments before deleting.
-   Return a friendly API error instead of the raw PostgreSQL error.

Suggested message:

    Cannot uninstall this workflow because active deployments exist.

    Please remove or deactivate the related deployments first.

## Instruction for Windsurf

Improve backend/API error handling for uninstall operations. Keep the
CLI flow unchanged. Translate database foreign-key violations into
user-friendly API responses.
