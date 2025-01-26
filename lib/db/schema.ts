import { InferSelectModel } from 'drizzle-orm';
import {
  boolean,
  foreignKey,
  json,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core';

export const otpSessions = pgTable('otp_sessions', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  otp: varchar('otp', { length: 6 }), // Store plain OTP or hash it
  otpSentAt: timestamp('otp_sent_at').defaultNow(),
  isVerified: boolean('is_verified').default(false),
  sessionId: varchar('session_id', { length: 255 }),
  chatId: varchar('chat_id', { length: 255 }),
  otpStatus: varchar('otp_status', { length: 20 }).default('pending'), // 'pending', 'sent', 'verified'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  clerk_id: varchar('clerk_id'),
  email: varchar('email', { length: 64 }).notNull(),
  first_name: varchar('first_name'),
  last_name: varchar('last_name'),
  turnkeyUserId: uuid('turnkey_user_id').unique(),
},
(table): { turnkeyUserFK: ReturnType<typeof foreignKey> } => {
  return {
    turnkeyUserFK: foreignKey({
      columns: [table.turnkeyUserId],
      foreignColumns: [turnkeyUser.id],      
    }).onDelete('set null'),
  };
}
);

export type User = InferSelectModel<typeof user>;


export const turnkeyUser = pgTable(
  'TurnkeyUser',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id').notNull().unique(),
    turnkeyRootUserId: uuid('turnkey_root_user_id').notNull().unique(),
    subOrgId: uuid('sub_org_id').notNull(),
    userName: varchar('user_name', { length: 255 }).notNull(),
    userEmail: varchar('user_email', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    userFK: foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
    }).onDelete('cascade'),
    subOrgFK: foreignKey({
      columns: [table.subOrgId],
      foreignColumns: [subOrg.id],
    }).onDelete('cascade'),
  }),
);
export type TurnkeyUser = InferSelectModel<typeof turnkeyUser>;

export const turnkeyApikeys = pgTable(
  'TurnkeyUserApikeys',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    turnkeyUserId: uuid('turnkey_user_id').notNull(),
    // turnkeyApiKeyId: uuid('turnkey_api_key_id').notNull().unique(),
    publicKey: varchar('public_key', { length: 512 }).notNull(),
    privateKey: varchar('private_key', { length: 512 }).notNull(),
    apiKeyName: varchar('api_key_name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    turnkeyUserFK: foreignKey({
      columns: [table.turnkeyUserId],
      foreignColumns: [turnkeyUser.id],
    }).onDelete('cascade'),      
  }),
);
export type TurnkeyApikeys = InferSelectModel<typeof turnkeyApikeys>;

export const subOrg = pgTable(
  'TurnkeySubOrganization',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    turnkeySubOrganizationId: uuid('turnkey_sub_organization_id').notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: varchar('description', { length: 1024 }),
    walletId: uuid('wallet_id').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    walletFK: foreignKey({
      columns: [table.walletId],
      foreignColumns: [walletTable.id],
    }).onDelete('cascade'),
  }),
);
export type SubOrg = InferSelectModel<typeof subOrg>;


export const walletTable = pgTable('TurnkeyWallet', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  turnkeyWalletId: uuid('turnkey_wallet_id').notNull().unique(),
  walletName: varchar('wallet_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
export type WalletTable = InferSelectModel<typeof walletTable>;


export const walletAddress = pgTable(
  'TurnkeyWalletAddress',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    walletId: uuid('wallet_id').notNull(),    
    address: varchar('address', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    walletFK: foreignKey({
      columns: [table.walletId],
      foreignColumns: [walletTable.id],
    }).onDelete('cascade'),
  }),
);
export type WalletAddress = InferSelectModel<typeof walletAddress>;


export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId').references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;
