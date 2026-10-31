# AGENTS.md — Agent Operating Guidelines for Arpeggiate

This document defines the architectural principles, type system requirements, and API documentation standards for AI agents contributing to the Arpeggiate codebase.

## 1. Project Overview & Mission

Arpeggiate is a small, headless keyboard shortcuts engine built from mathematical first principles.

### Monorepo Structure

- @arpeggiate/core: Zero-dependency core engine.
- @arpeggiate/react: Headless React bindings, providing zero CSS and zero bundled UI.

## 2. The Prime Directive: 100% Compile-Time Type Safety with 0 Runtime Overhead

Non-Negotiable Constraint: All key validity, stroke structure, sequential grammar, and keymap dictionaries must be strictly validated at compile time. The runtime cost of this validation must be zero.

## 3. Minimal Public API

A user of this library needs only these abilities:
- Define a mapping from keys to action IDs
- Be informed when an action ID is invoked
- Specify an element inside which this library is active
- Reset the active keyboard state and sequence buffer

Everything else must be private.

Every public API (class, method, function, variable, etc.) must have a doc comment.

## 4. Terminology Guidelines

All contributors and AI agents must strictly adhere to the formal vocabulary defined in [GLOSSARY.md](GLOSSARY.md). Consistent terminology must be maintained across code, types, doc comments, test descriptions, and commit messages.
