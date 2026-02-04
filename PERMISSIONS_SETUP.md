# Sistema de Permissões - Guia de Configuração

## Variáveis de Ambiente

Para configurar o sistema de permissões de gerentes de lojas, adicione as seguintes variáveis ao seu arquivo `.env`:

### Administradores (já existe)

```env
ADMIN_EMAILS=admin1@email.com,admin2@email.com
```

### Gerentes de Lojas (NOVA)

```env
STORE_MANAGER_EMAILS=gerente1@email.com,gerente2@email.com,gerente3@email.com
```

## Hierarquia de Permissões

1. **USER** (padrão)
   - Pode criar e gerenciar suas próprias lojas
   - Pode gerenciar produtos e pedidos de suas lojas

2. **STORE_MANAGER** (configurado via `STORE_MANAGER_EMAILS`)
   - Todas as permissões de USER
   - Pode criar lojas em nome de outros usuários
   - Pode gerenciar qualquer loja do sistema
   - Pode gerenciar produtos de qualquer loja

3. **ADMIN** (configurado via `ADMIN_EMAILS`)
   - Todas as permissões de STORE_MANAGER
   - Acesso ao painel administrativo
   - Pode visualizar estatísticas do sistema
   - Pode configurar notificações

## Como Funciona

### Atribuição Automática de Roles

As roles são atribuídas automaticamente baseadas nos emails configurados no `.env`:

- Se o email está em `ADMIN_EMAILS` → role = ADMIN
- Se o email está em `STORE_MANAGER_EMAILS` → role = STORE_MANAGER
- Caso contrário → role = USER

### Cadastro de Lojas por Gerentes

Quando um usuário com role STORE_MANAGER ou ADMIN acessa a página de cadastro de lojas, um campo adicional é exibido permitindo:

1. Buscar o usuário proprietário pelo email
2. Selecionar o proprietário da loja
3. Criar a loja em nome desse usuário

**Importante:** O campo `userId` da loja será do proprietário, e o campo `createdBy` registrará quem criou (gerente/admin).

### Gerenciamento de Lojas

Gerentes e admins podem:

- Editar qualquer loja
- Adicionar/editar produtos de qualquer loja
- Gerenciar chaves PIX de qualquer loja
- Visualizar e gerenciar pedidos de qualquer loja

Proprietários de lojas podem gerenciar apenas suas próprias lojas.

## Exemplo de Configuração

```env
# .env
DATABASE_URL=postgresql://...

# Administradores (acesso total)
ADMIN_EMAILS=tiago@empresa.com,joao@empresa.com

# Gerentes (podem cadastrar lojas para outros)
STORE_MANAGER_EMAILS=maria@empresa.com,carlos@empresa.com,ana@empresa.com

# Outras configurações...
```

## Testando as Permissões

1. Configure os emails no `.env`
2. Reinicie a aplicação
3. Faça login com um email de gerente
4. Acesse a página de cadastro de lojas
5. Você verá o campo "Proprietário da Loja" para buscar e selecionar o dono

## Campos no Banco de Dados

### User

- `role`: UserRole (USER | STORE_MANAGER | ADMIN) - Define as permissões
- Valor padrão: USER

### Store

- `userId`: ID do proprietário da loja (quem recebe os lucros)
- `createdBy`: ID de quem criou a loja (null se foi auto-cadastro)

## Migração de Dados Existentes

Todas as lojas existentes mantiveram seus proprietários originais (`userId`).
O campo `createdBy` foi adicionado como `NULL` para lojas existentes (indica auto-cadastro).

## Aviso em Lojas Criadas pela Equipe

Quando um gerente ou admin cria uma loja para um proprietário, um aviso aparece na página pública da loja informando que foi cadastrada pela equipe e oferecendo contato para reivindicação.

### Personalizar Informações de Contato

Atualmente as informações de contato no aviso estão em:

- **Arquivo:** `src/app/lojas/[slug]/page.js`
- **WhatsApp:** https://wa.me/5511999999999
- **Email:** contato@nossolocal.com.br

Para personalizar, edite essas linhas no arquivo acima com seus dados reais de contato.
