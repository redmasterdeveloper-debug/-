/**
 * Verification suite for UR SKY News Firestore Security Rules (Passcode-Gated Admin).
 */
export interface DirtyDozenScenario {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'create' | 'update' | 'delete' | 'get' | 'list';
  expected: 'PERMISSION_DENIED';
  description: string;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Unpaired News Create',
    collectionPath: 'news/art-unpaired',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Attempting to create a news article without an atomic admin_tokens batch write.'
  },
  {
    id: 2,
    name: 'Wrong Admin Secret Code',
    collectionPath: 'admin_tokens/create_art2',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Attempting to create an admin token with code WRONG123.'
  },
  {
    id: 3,
    name: 'Mismatched Token Action',
    collectionPath: 'news/art-mismatch',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Attempting news create paired with a delete token.'
  },
  {
    id: 4,
    name: 'Shadow Field Injection',
    collectionPath: 'news/art-shadow',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Sending extra undeclared field isFeatured=true.'
  },
  {
    id: 5,
    name: 'Client Timestamp Forgery',
    collectionPath: 'news/art-time-forge',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Supplying client-side createdAt instead of serverTimestamp().'
  },
  {
    id: 6,
    name: 'Invalid Category Value',
    collectionPath: 'news/art-bad-cat',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Sending category outside the 5 approved editorial categories.'
  },
  {
    id: 7,
    name: 'Resource Poisoning / Invalid ID',
    collectionPath: 'news/invalid.id$123',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    description: 'Document ID violates ^[a-zA-Z0-9_\\-]+$ or imageUrl exceeds 350000 bytes.'
  },
  {
    id: 8,
    name: 'Admin Tokens Read Scraping',
    collectionPath: 'admin_tokens',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    description: 'Attempting to read or list /admin_tokens is strictly blocked.'
  },
  {
    id: 9,
    name: 'Unpaired News Delete',
    collectionPath: 'news/art-1',
    operation: 'delete',
    expected: 'PERMISSION_DENIED',
    description: 'Attempting to delete a news article without an atomic delete token.'
  },
  {
    id: 10,
    name: 'Admin Token Mutation',
    collectionPath: 'admin_tokens/create_art1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Attempting to update an existing admin token.'
  },
  {
    id: 11,
    name: 'Direct News Update Blocked',
    collectionPath: 'news/art-1',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    description: 'Updating news documents directly is disabled.'
  },
  {
    id: 12,
    name: 'Unpublished Draft Listing',
    collectionPath: 'news',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    description: 'Listing documents without isPublished == true filter.'
  }
];
