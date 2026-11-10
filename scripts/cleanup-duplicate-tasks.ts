/**
 * Limpeza de tarefas duplicadas do "Tarefas & Kanban" (todoist_tasks).
 *
 * Duplicatas consideradas (somente tarefas EM ABERTO e não excluídas):
 *  - Recorrentes: mesma série (título, regra, responsável, projeto, contato, lead, cliente, apólice).
 *    Mantém a ocorrência com vencimento mais antigo (é a "atual" da série).
 *  - Automáticas: mesma regra de automação + título + vínculos. Mantém a mais antiga.
 *
 * Segurança:
 *  - Por padrão roda em modo SIMULAÇÃO (não altera nada), só lista.
 *  - Com --apply faz SOFT DELETE (preenche deleted_at). Nada é apagado de verdade;
 *    as tarefas podem ser restauradas (deleted_at = NULL). Os IDs ficam no log de saída.
 *  - Nunca remove tarefas com comentários, com subtarefas concluídas ou que já estejam em andamento.
 *
 * Uso:
 *   npx tsx scripts/cleanup-duplicate-tasks.ts           # simulação
 *   npx tsx scripts/cleanup-duplicate-tasks.ts --apply   # aplica (soft delete)
 */
import pg from "pg";

const APPLY = process.argv.includes("--apply");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não definido");
  const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  const candidatesSql = `
    with base as (
      select t.*,
        (select count(*) from todoist_comments c where c.task_id = t.id) as comments_count,
        (select count(*) from todoist_subtasks s where s.task_id = t.id and s.completed) as done_subtasks,
        case
          when t.is_recurring then concat_ws('|', 'R', t.title, t.recurrence_rule, t.assigned_to, t.project_id, t.contact_id, t.lead_id, t.cliente_id, t.apolice_id)
          when t.auto_generated_by is not null then concat_ws('|', 'A', t.auto_generated_by, t.title, t.contact_id, t.lead_id, t.cliente_id, t.apolice_id)
        end as series_key
      from todoist_tasks t
      where t.deleted_at is null and t.status <> 'done'
        and (t.is_recurring or t.auto_generated_by is not null)
    ),
    ranked as (
      select *,
        row_number() over (
          partition by series_key
          order by
            (case when is_recurring then due_date end) asc nulls last,
            created_at asc, id asc
        ) as rn,
        count(*) over (partition by series_key) as group_size
      from base
    )
    select id, title, status, is_recurring, recurrence_rule, auto_generated_by, assigned_to, lead_id, to_char(due_date, 'DD/MM/YYYY HH24:MI') as due_txt,
           due_date, created_at, comments_count, done_subtasks, rn, group_size, series_key
    from ranked
    where group_size > 1
    order by series_key, rn`;

  const { rows } = await client.query(candidatesSql);

  const toRemove = rows.filter(
    (r: any) => Number(r.rn) > 1 && r.status === "todo" && Number(r.comments_count) === 0 && Number(r.done_subtasks) === 0
  );
  const kept = rows.filter((r: any) => !toRemove.includes(r));

  const groups = new Set(rows.map((r: any) => r.series_key)).size;
  console.log(`Grupos com duplicidade: ${groups}`);
  console.log(`Tarefas mantidas nesses grupos: ${kept.length}`);
  console.log(`Tarefas duplicadas a remover (soft delete): ${toRemove.length}\n`);

  for (const r of rows) {
    const action = toRemove.includes(r) ? "REMOVER" : "manter ";
    const due = r.due_txt || "-";
    console.log(`${action}  #${r.id}  venc: ${due} (UTC)  resp: ${r.assigned_to ?? "-"}  "${r.title}"${r.is_recurring ? ` [${r.recurrence_rule}]` : ` [auto: ${r.auto_generated_by}]`}`);
  }

  if (!APPLY) {
    console.log("\nModo SIMULAÇÃO: nada foi alterado. Rode com --apply para aplicar.");
    await client.end();
    return;
  }

  if (toRemove.length === 0) {
    console.log("\nNada a remover.");
    await client.end();
    return;
  }

  const ids = toRemove.map((r: any) => Number(r.id));
  await client.query("begin");
  try {
    const res = await client.query(
      `update todoist_tasks set deleted_at = now() where id = any($1::int[]) and deleted_at is null and status = 'todo'`,
      [ids]
    );
    await client.query("commit");
    console.log(`\n✅ ${res.rowCount} tarefa(s) duplicada(s) movidas para a lixeira (soft delete).`);
    console.log(`Para desfazer: update todoist_tasks set deleted_at = null where id in (${ids.join(",")});`);
  } catch (e) {
    await client.query("rollback");
    throw e;
  }
  await client.end();
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
