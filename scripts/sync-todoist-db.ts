import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function syncTodoistTables() {
  console.log('Syncing Todoist tables to database...');

  const tables = [
    sql`CREATE TABLE IF NOT EXISTS todoist_projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color TEXT NOT NULL DEFAULT '#0F6570',
      icon TEXT NOT NULL DEFAULT 'Folder',
      status TEXT NOT NULL DEFAULT 'active',
      created_by INTEGER NOT NULL REFERENCES users(id),
      deadline TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    sql`CREATE TABLE IF NOT EXISTS todoist_project_members (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES todoist_projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    sql`CREATE TABLE IF NOT EXISTS todoist_labels (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    sql`CREATE TABLE IF NOT EXISTS todoist_tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      project_id INTEGER REFERENCES todoist_projects(id),
      assigned_to INTEGER REFERENCES users(id),
      created_by INTEGER NOT NULL REFERENCES users(id),
      priority TEXT NOT NULL DEFAULT 'P3',
      status TEXT NOT NULL DEFAULT 'todo',
      kanban_column TEXT NOT NULL DEFAULT 'a_fazer',
      due_date TIMESTAMP,
      due_time TEXT,
      completed_at TIMESTAMP,
      completed_by INTEGER REFERENCES users(id),
      is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
      recurrence_rule TEXT,
      contact_id INTEGER REFERENCES contacts(id),
      lead_id INTEGER REFERENCES leads(id),
      cliente_id INTEGER REFERENCES clientes(id),
      apolice_id INTEGER REFERENCES apolices(id),
      auto_generated_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,
    sql`CREATE TABLE IF NOT EXISTS todoist_subtasks (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    sql`CREATE TABLE IF NOT EXISTS todoist_task_labels (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      label_id INTEGER NOT NULL REFERENCES todoist_labels(id) ON DELETE CASCADE
    );`,
    sql`CREATE TABLE IF NOT EXISTS todoist_comments (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      attachment_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    sql`CREATE TABLE IF NOT EXISTS todoist_activity_logs (
      id SERIAL PRIMARY KEY,
      task_id INTEGER NOT NULL REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      action TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    sql`CREATE TABLE IF NOT EXISTS todoist_automations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      event_type TEXT NOT NULL,
      trigger_condition TEXT,
      action_task_title TEXT NOT NULL,
      action_priority TEXT NOT NULL DEFAULT 'P2',
      assignee_option TEXT NOT NULL DEFAULT 'record_owner',
      specific_assignee_id INTEGER REFERENCES users(id),
      days_offset INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    sql`CREATE TABLE IF NOT EXISTS todoist_notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES todoist_tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );`
  ];

  for (const statement of tables) {
    try {
      await db.execute(statement);
    } catch (e: any) {
      console.log('Statement note:', e.message);
    }
  }

  console.log('Todoist tables verified!');
}

syncTodoistTables()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
