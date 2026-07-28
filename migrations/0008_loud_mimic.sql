CREATE TABLE IF NOT EXISTS "apolices" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_id" integer NOT NULL,
	"produto_id" integer,
	"seguradora_id" integer,
	"numero_apolice" text,
	"status" text DEFAULT 'ativa' NOT NULL,
	"inicio_vigencia" timestamp,
	"fim_vigencia" timestamp,
	"premio" text,
	"valor_segurado" text,
	"comissao" text,
	"corretor_id" integer,
	"observacoes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"cpf_cnpj" text,
	"data_nascimento" text,
	"telefone" text,
	"whatsapp" text,
	"email" text,
	"endereco" text,
	"cidade" text,
	"estado" text,
	"observacoes" text,
	"tags" text,
	"responsavel_comercial_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "produtos_seguro" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "seguradoras" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "site_name" SET DEFAULT 'Monteiro Seguros e Benefícios';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "primary_color" SET DEFAULT '#08454c';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "secondary_color" SET DEFAULT '#c65f54';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "hero_title" SET DEFAULT 'Proteção que Transforma,
Benefícios que Cuidam';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "hero_subtitle" SET DEFAULT 'A Monteiro Seguros e Benefícios é especializada em consultoria estratégica em proteção e benefícios para empresas e famílias.';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "about_title" SET DEFAULT 'Sobre a Monteiro Seguros e Benefícios';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "about_content" SET DEFAULT 'A Monteiro Seguros e Benefícios é especializada em oferecer consultoria estratégica em proteção e benefícios para empresas e famílias.

Mais do que comercializar seguros, atuamos como parceiros na construção de soluções que equilibram cuidado com pessoas, controle de custos e segurança financeira, tanto no ambiente corporativo quanto na vida pessoal.

Para empresas, desenvolvemos estratégias que fortalecem a retenção de talentos e organizam os benefícios de forma inteligente.

Para pessoas e famílias, criamos proteções personalizadas que garantem tranquilidade em todas as fases da vida.

Nosso trabalho começa antes da contratação e continua no dia a dia, garantindo que cada decisão esteja sempre alinhada ao momento e às necessidades de quem atendemos.';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "services_title" SET DEFAULT 'Soluções Completas em Proteção e Benefícios';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "services_subtitle" SET DEFAULT 'Planos personalizados para cada momento da sua vida e do seu negócio.';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "blog_subtitle" SET DEFAULT 'Fique por dentro das novidades e dicas do mercado de seguros e benefícios.';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "contact_email" SET DEFAULT 'contato@monteiroseguros.com.br';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "address" SET DEFAULT 'São Paulo, SP';--> statement-breakpoint
ALTER TABLE "site_settings" ALTER COLUMN "footer_text" SET DEFAULT 'Cuidar de pessoas é uma decisão estratégica. Benefícios não são custo. São estratégia.';--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "responsible_name" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "responsible_id" integer;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "anniversary_date" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "marital_status" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "product" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logo_scale" integer DEFAULT 150 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "logo_scale_mobile" integer DEFAULT 130 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "task_columns" text;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "lead_columns" text;--> statement-breakpoint
ALTER TABLE "apolices" DROP CONSTRAINT IF EXISTS "apolices_cliente_id_clientes_id_fk";--> statement-breakpoint
ALTER TABLE "apolices" ADD CONSTRAINT "apolices_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apolices" DROP CONSTRAINT IF EXISTS "apolices_produto_id_produtos_seguro_id_fk";--> statement-breakpoint
ALTER TABLE "apolices" ADD CONSTRAINT "apolices_produto_id_produtos_seguro_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos_seguro"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apolices" DROP CONSTRAINT IF EXISTS "apolices_seguradora_id_seguradoras_id_fk";--> statement-breakpoint
ALTER TABLE "apolices" ADD CONSTRAINT "apolices_seguradora_id_seguradoras_id_fk" FOREIGN KEY ("seguradora_id") REFERENCES "public"."seguradoras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apolices" DROP CONSTRAINT IF EXISTS "apolices_corretor_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "apolices" ADD CONSTRAINT "apolices_corretor_id_users_id_fk" FOREIGN KEY ("corretor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clientes" DROP CONSTRAINT IF EXISTS "clientes_responsavel_comercial_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_responsavel_comercial_id_users_id_fk" FOREIGN KEY ("responsavel_comercial_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "likes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "is_approved" boolean DEFAULT false NOT NULL;