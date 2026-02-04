# Aplicar Migrações na Produção (Vercel)

## 🚨 Problema Identificado

As migrações do Prisma não foram aplicadas no banco de dados de produção, causando erro "column Store.image does not exist".

## ✅ Solução

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Login na Vercel

```bash
vercel login
```

### Passo 3: Linkar o projeto

```bash
cd /home/tiago/Documentos/Github/nosso-local
vercel link
```

### Passo 4: Baixar variáveis de ambiente da produção

```bash
vercel env pull .env.production
```

### Passo 5: Aplicar migrações na produção

```bash
npx dotenv -e .env.production -- prisma migrate deploy
```

### Passo 6: Verificar se funcionou

```bash
npx dotenv -e .env.production -- prisma db push --preview-feature
```

## 🔄 Método Alternativo (Deploy)

Se preferir, faça um novo deploy que irá executar automaticamente:

```bash
git add .
git commit -m "Forçar aplicação de migrações na produção"
git push origin main
```

O script `vercel-build` irá executar: `prisma generate && prisma migrate deploy && next build`

## 📋 Verificação

Após aplicar as migrações, teste a URL:
https://tiagodelivery.vercel.app/api/stores/check-slug?slug=test

Deve retornar: `{"available": true, "slug": "test"}`
