# Guia de Deploy na Vercel

## 📋 Pré-requisitos

O projeto está configurado para build na Vercel, mas você precisa configurar um banco de dados PostgreSQL em produção.

## 🗄️ Configurando o Banco de Dados

### Opção 1: Vercel Postgres (Recomendado)

1. **Acesse seu projeto na Vercel**
   - Vá para https://vercel.com/dashboard
   - Selecione seu projeto

2. **Adicione Vercel Postgres**
   - Clique na aba "Storage"
   - Clique em "Create Database"
   - Selecione "Postgres"
   - Escolha a região (preferencialmente a mesma do seu deploy)
   - Clique em "Create"

3. **Conecte ao seu projeto**
   - A Vercel automaticamente adicionará as variáveis de ambiente necessárias
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL` (use esta no DATABASE_URL)
   - `POSTGRES_URL_NON_POOLING`

4. **Configure a variável DATABASE_URL**
   - Vá em "Settings" → "Environment Variables"
   - Adicione ou atualize:
     ```
     DATABASE_URL=${POSTGRES_PRISMA_URL}
     ```

### Opção 2: Neon (Gratuito e Simples)

1. **Crie uma conta em https://neon.tech**

2. **Crie um novo projeto**
   - Nome: nosso-local-prod
   - Região: escolha a mais próxima

3. **Copie a Connection String**
   - Formato: `postgresql://user:password@host/database?sslmode=require`

4. **Adicione na Vercel**
   - Settings → Environment Variables
   - Nome: `DATABASE_URL`
   - Valor: cole a connection string do Neon

### Opção 3: Supabase (Gratuito)

1. **Crie um projeto em https://supabase.com**

2. **Obtenha a Connection String**
   - Project Settings → Database
   - Connection string (URI)

3. **Adicione na Vercel**
   - Use o formato com pooling: `postgresql://...?pgbouncer=true`

## 🔐 Variáveis de Ambiente Necessárias

Configure todas essas variáveis na Vercel (Settings → Environment Variables):

```env
# Banco de Dados
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=sua-chave-secreta-aqui
# Gere com: openssl rand -base64 32

# Google OAuth
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret

# Email (opcional)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=seu@email.com
EMAIL_SERVER_PASS=sua-senha-de-app
EMAIL_FROM=seu@email.com
```

## 📝 Aplicar Migrações

Após configurar o banco de dados:

### Método 1: Via Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Linkar projeto
vercel link

# Executar comando de migração
vercel env pull .env.production
npx dotenv -e .env.production -- prisma migrate deploy
```

### Método 2: Script de Deploy Automático

Adicione no `package.json`:

```json
"scripts": {
  "vercel-build": "prisma generate && prisma migrate deploy && next build"
}
```

A Vercel executará este script automaticamente no deploy.

## 🔄 Atualizar Google OAuth

Não esqueça de adicionar sua URL de produção nas URIs autorizadas:

1. Acesse https://console.cloud.google.com
2. Credentials → Seu OAuth Client
3. Adicione em "Authorized redirect URIs":
   ```
   https://seu-dominio.vercel.app/api/auth/callback/google
   ```

## ✅ Checklist Final

- [ ] Banco de dados PostgreSQL configurado
- [ ] Variável `DATABASE_URL` adicionada na Vercel
- [ ] Variável `NEXTAUTH_URL` com domínio correto
- [ ] Variável `NEXTAUTH_SECRET` gerada e adicionada
- [ ] Google OAuth configurado com URL de produção
- [ ] Migrações aplicadas no banco de produção
- [ ] Primeiro deploy realizado com sucesso

## 🐛 Troubleshooting

### Erro: "Can't reach database server"

- Verifique se a `DATABASE_URL` está correta
- Confirme que o banco aceita conexões SSL
- Adicione `?sslmode=require` ao final da URL se necessário

### Erro: "Table doesn't exist"

- Execute as migrações: `prisma migrate deploy`
- Ou adicione o script `vercel-build` no package.json

### Erro: "Invalid OAuth redirect"

- Adicione a URL da Vercel no Google Cloud Console
- Atualize `NEXTAUTH_URL` com o domínio correto

## 📚 Recursos

- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [Neon Database](https://neon.tech)
- [Supabase](https://supabase.com)
- [Prisma Deploy Docs](https://www.prisma.io/docs/guides/deployment)
