import { Knex } from "knex"

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE routes (
      topic_id text not null,
      channel_id text not null,
      team_id text not null,
      primary key (topic_id, channel_id, team_id)
    );
  `)
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('routes')
}