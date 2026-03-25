ALTER TABLE "tasks" ALTER COLUMN "status" SET DEFAULT 'pendencia';
UPDATE tasks SET status = 'pendencia' WHERE status = 'todo';
UPDATE tasks SET status = 'revisao' WHERE status = 'in_progress';
UPDATE tasks SET status = 'fechado' WHERE status = 'done';