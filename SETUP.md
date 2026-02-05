# Configuração do Projeto Montero V2

Este projeto utiliza Node.js, Express, PostgreSQL e Prisma.

## Pré-requisitos

- Node.js (v18+)
- PostgreSQL Database

## Passo 1: Instalação

Instale as dependências:
```bash
npm install
```

## Passo 2: Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto ou configure no seu ambiente (Replit Secrets):

```env
# Banco de Dados
DATABASE_URL="postgresql://user:password@host:port/dbname"

# Autenticação
JWT_SECRET="sua_chave_secreta_jwt_aqui"

# Cloudinary (Opcional se usar upload, mas recomendado configurar)
# CLOUDINARY_CLOUD_NAME="..."
# CLOUDINARY_API_KEY="..."
# CLOUDINARY_API_SECRET="..."

# Porta (Padrão 5000)
PORT=5000
```

## Passo 3: Configuração do Banco de Dados

Envie o esquema do Prisma para o banco de dados:
```bash
npx prisma db push
```

## Passo 4: Rodar o Projeto

### Desenvolvimento (com Hot Reload)
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## Primeiro Acesso Admin

Ao se registrar pela primeira vez (`/register` ou via API), o sistema verificará se não existem usuários. O primeiro usuário criado será automaticamente **ADMIN**.

## Funcionalidades

- **Login/Cadastro**: `/login`, `/register`
- **Painel Admin**: `/admin` (Gerenciar Posts, Comentários, Hero, Configurações)
- **Site Público**: Home (com Carrossel e Depoimentos), Blog, Contato.

## Deploy no Replit

O arquivo `.replit` já está configurado. Certifique-se de adicionar as Secrets no painel do Replit.
