# Security Specification — 구구단 미로 탐험대 Leaderboard

## 1. Data Invariants
1. Every document in `/leaderboard/{studentId}` must have an ASCII `studentId` matching `^[a-zA-Z0-9_-]+$` (max 128 chars) equal to the document ID.
2. `nickname` must be a non-empty string between 1 and 20 characters and cannot be changed once created.
3. `classCode` must strictly equal `'2026'` on both create and update, and remains immutable (`'2026'`).
4. Numeric fields (`score`, `stars`, `solvedCount`, `clearedStages`, `bestAccuracy`) must be bounded integers (`score`: `0..1000000`, `stars`: `0..10000`, `solvedCount`: `0..50000`, `clearedStages`: `0..3`, `bestAccuracy`: `0..100`) and non-decreasing for `score`, `stars`, `solvedCount`, `clearedStages`, `bestAccuracy`.
5. `createdAt` must equal `request.time` on create and remain immutable on update.
6. `updatedAt` must equal `request.time` on both create and update.
7. `isPublic` must be `true` on create/update; reads are restricted to `resource.data.isPublic == true`.
8. Deletions are forbidden (`allow delete: if false`).
9. All other paths are denied by the default catch-all rule.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. **Wrong classCode**: `{ classCode: "1234", ... }` -> Rejected (`classCode != "2026"`).
2. **Shadow / Ghost Field on Create**: `{ ..., isAdmin: true }` -> Rejected (`hasOnly` key whitelist).
3. **Oversized Nickname**: `{ nickname: "가".repeat(50), ... }` -> Rejected (`nickname.size() <= 20`).
4. **Invalid Document ID**: `/leaderboard/../../admin` or Korean raw ID -> Rejected (`isValidId(studentId)`).
5. **Negative Score**: `{ score: -500, ... }` -> Rejected (`score >= 0`).
6. **Out-of-Bounds Score**: `{ score: 999999999, ... }` -> Rejected (`score <= 1000000`).
7. **Forged Client Timestamp**: `{ createdAt: Timestamp.fromDate(new Date(0)) }` -> Rejected (`createdAt == request.time`).
8. **Nickname Hijack on Update**: `{ nickname: "다른학생" }` -> Rejected (`incoming().nickname == existing().nickname`).
9. **Score Rollback Attack**: `{ score: existing.score - 10 }` -> Rejected (`incoming().score >= existing().score`).
10. **Immutable Field Tampering**: changing `createdAt` or `studentId` on update -> Rejected (`affectedKeys().hasOnly(...)` + equality checks).
11. **Delete Record Attack**: `deleteDoc(doc(db, 'leaderboard', id))` -> Rejected (`allow delete: if false`).
12. **Unprotected Collection Write**: writing to `/users/1` or `/admins/1` -> Rejected by global deny catch-all.
