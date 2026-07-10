import { relations } from 'drizzle-orm';
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

export const checkinResponseEnum = pgEnum('checkin_response', [
  'yes',
  'partially',
  'not',
]);

export const managers = pgTable('managers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const learners = pgTable('learners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  managerId: uuid('manager_id')
    .notNull()
    .references(() => managers.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const commitments = pgTable('commitments', {
  id: uuid('id').primaryKey().defaultRandom(),
  learnerId: uuid('learner_id')
    .notNull()
    .references(() => learners.id)
    .unique(),
  label: text('label').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const checkins = pgTable(
  'checkins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    learnerId: uuid('learner_id')
      .notNull()
      .references(() => learners.id),
    weekNumber: integer('week_number').notNull(),
    token: uuid('token').notNull().unique(),
    response: checkinResponseEnum('response'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [unique('checkins_learner_week_unique').on(table.learnerId, table.weekNumber)],
);

export const managersRelations = relations(managers, ({ many }) => ({
  learners: many(learners),
}));

export const learnersRelations = relations(learners, ({ one, many }) => ({
  manager: one(managers, {
    fields: [learners.managerId],
    references: [managers.id],
  }),
  commitment: one(commitments, {
    fields: [learners.id],
    references: [commitments.learnerId],
  }),
  checkins: many(checkins),
}));

export const commitmentsRelations = relations(commitments, ({ one }) => ({
  learner: one(learners, {
    fields: [commitments.learnerId],
    references: [learners.id],
  }),
}));

export const checkinsRelations = relations(checkins, ({ one }) => ({
  learner: one(learners, {
    fields: [checkins.learnerId],
    references: [learners.id],
  }),
}));

export type Manager = typeof managers.$inferSelect;
export type Learner = typeof learners.$inferSelect;
export type Commitment = typeof commitments.$inferSelect;
export type Checkin = typeof checkins.$inferSelect;
export type CheckinResponse = (typeof checkinResponseEnum.enumValues)[number];
