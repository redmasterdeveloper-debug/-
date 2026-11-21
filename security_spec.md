# UR SKY News — Firestore Security Specification (Passcode-Gated Admin)

## 1. Data Invariants
1. Every `/news/{articleId}` document must have a valid alphanumeric/dash/underscore `articleId`, a non-empty `title` (3–200 chars), an approved editorial `category`, an `authorName` (2–100 chars), `content` (10–15000 chars), a validated `imageUrl` (`<= 350000` chars), `isPublished == true`, and server-enforced `createdAt == request.time`.
2. Creating or deleting a `/news/{articleId}` document is allowed only when paired atomically in the same Firestore batch with a valid `/admin_tokens/{action}_{articleId}` document containing `code == 'URSKY2027'` and `createdAt == request.time`.
3. `/admin_tokens/{tokenId}` documents are strictly write-only (`allow read: if false`), ensuring the passcode is never exposed via reads or list queries.
4. Public visitors may read (`get` / `list`) `/news` documents only where `resource.data.isPublished == true`.

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Unpaired News Create**: Client attempts `setDoc('/news/art1', validArticle)` without an atomic `/admin_tokens/create_art1` batch write.
2. **Wrong Secret Code Token**: Client attempts batch create with `code: 'WRONG123'`.
3. **Mismatched Token Action**: Client attempts `create` on `/news/art1` paired with `delete_art1` token.
4. **Shadow/Ghost Field Injection**: Client attempts `create` on `/news/art4` with extra field `isAdminOverride: true`.
5. **Client-Forged Timestamp**: Client attempts `create` with client-supplied `createdAt` instead of `serverTimestamp()`.
6. **Invalid Category Injection**: Client attempts `create` with `category: 'شائعات'`.
7. **Oversized Image / Resource Poisoning**: Client attempts `create` with `imageUrl` > 350000 bytes or invalid ID `../hack`.
8. **Token Collection Read/List Scraping**: Any client attempts `getDoc('/admin_tokens/create_art1')` or `getDocs('/admin_tokens')`.
9. **Unpaired News Delete**: Client attempts `deleteDoc('/news/art1')` without atomic `/admin_tokens/delete_art1`.
10. **Token Reuse / Update**: Client attempts `updateDoc('/admin_tokens/create_art1', ...)`.
11. **Direct News Update**: Client attempts `updateDoc('/news/art1', ...)` (`allow update: if false`).
12. **Unpublished Article Read**: Client attempts `get` or `list` on unpublished documents where `isPublished != true`.
