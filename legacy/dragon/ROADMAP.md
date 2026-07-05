# Dragon Backend Refactoring: 4-Day Fast-Track

This roadmap documents the strategic plan to simplify the Dragon Institute Backend. The goal is to move from a cloud-complex (AWS/Serverless) architecture to a high-performance, local-only Express server.

## Context & Constraints
- **User Background:** Senior Backend Developer (.NET ERP, MSSQL, Dapper). Familiar with Controller-Service-Repository patterns.
- **Goal:** Deep understanding and refactoring of the Node.js/Express/Mongoose stack in 4 days.
- **Deployment:** Localhost only (no AWS S3, no Serverless).
- **Core Technology:** Express.js, MongoDB (Mongoose), Node.js.

## The 4-Day Plan

### Day 1: Architecture Cleanup & Entry Point
- [ ] **Simplify `app.js`**:
    - Remove all AWS Lambda/Serverless-http logic.
    - Clean up CORS and redundant headers.
    - Consolidate request parsing (Body-parser).
- [ ] **Dependency Audit**:
    - Identify and remove unused modules to speed up startup.
- [ ] **Pattern Mapping**:
    - Map .NET ERP concepts (Dapper/MSSQL) to Node.js (Mongoose/MongoDB).

### Day 2: The Data Layer (Mongoose & Repositories)
- [ ] **Schema Review**:
    - Understand Mongoose Models (equivalent to C# classes/POCOs).
    - Review Indexes and Validations.
- [ ] **Repository Optimization**:
    - Analyze `repository/` layer.
    - Optimize queries for performance.

### Day 3: Business Logic & Flow (Services & Controllers)
- [ ] **Service Layer Refactoring**:
    - Trace request flows: `Route -> Controller -> Service -> Repository`.
    - Extract business logic from controllers into services (Standard ERP practice).
- [ ] **Error Handling**:
    - Implement a global error handling middleware to replace scattered `try/catch` blocks.

### Day 4: Local Storage & Final Optimization
- [ ] **S3 to Local Migration**:
    - Refactor `fileService.js` to use Node.js `fs` module.
    - Create `/uploads` static directory.
- [ ] **Uninstall AWS SDKs**:
    - Remove `@aws-sdk/*` dependencies.
- [ ] **Final Performance Pass**:
    - Connection pooling in Mongoose.
    - Lazy loading for mailing and templates.

---

## Technical Debt to Address
- **AWS Coupling:** Current file management and mailing are tightly coupled with AWS services.
- **Middleware Redundancy:** Multiple CORS and header configurations in `app.js`.
- **Commented Code:** Large blocks of legacy/serverless code causing friction in understanding.

## Status
- [x] Initial System Analysis
- [x] Project Name Proposals
- [x] 4-Day Fast-Track Roadmap Defined
- [ ] Phase 1 Implementation Started
