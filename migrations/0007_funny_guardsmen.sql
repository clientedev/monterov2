ALTER TABLE "site_settings" ALTER COLUMN "about_content" SET DEFAULT 'A Monteiro Corretora nasceu com a missão de tornar o seguro compreensível, acessível e verdadeiramente protetor para famílias e empresas em São Paulo.

Ao longo das últimas décadas, crescemos e nos tornamos uma das corretoras mais respeitadas da região. Nosso crescimento não mudou nossos valores fundamentais — tratar cada cliente com exclusividade e dedicação, garantindo a proteção do que é mais importante para você.';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "color" text DEFAULT 'default' NOT NULL;