# Nosso Local

Uma plataforma de delivery completa onde empresas podem cadastrar suas lojas e produtos, e clientes podem fazer compras online. A plataforma oferece gestão completa de múltiplas lojas por usuário, com catálogo de produtos individual para cada estabelecimento.

## Funcionalidades

### Para Empresas/Usuários

- **Autenticação**
  - Página de login independente (`/login`)
  - Login com Google OAuth
  - Magic Link via email
  - Redirecionamento automático após autenticação
  - Proteção de rotas que requerem autenticação

- **Gestão de Lojas**
  - Cadastro de múltiplas lojas por usuário
  - Edição completa de informações (nome, CNPJ, telefone, descrição)
  - Integração com ViaCEP para preenchimento automático de endereços brasileiros
  - Validação de dados de contato e documentos
  - Sistema de exclusão com confirmação

- **Gestão de Produtos**
  - Cadastro de produtos por loja
  - Edição de nome, descrição, preço e imagem
  - Controle de disponibilidade (ativar/desativar produtos)
  - Listagem visual com imagens e informações completas
  - Sistema de exclusão com confirmação

- **Perfil de Usuário**
  - Atualização de dados pessoais (nome, CPF, telefone)
  - Gerenciamento de múltiplos endereços
  - Dashboard com abas para lojas e dados pessoais
  - Visualização de todas as lojas cadastradas

- **Carrinho de Compras**
  - Adição de produtos ao carrinho
  - Gestão de itens no carrinho
  - Redirecionamento para login se não autenticado
  - Retorno automático após login

### Sistema

- Sistema de autenticação seguro (Google OAuth)
- Validação de propriedade (usuário → loja → produto)
- Interface responsiva e moderna com Tailwind CSS
- API RESTful completa para todas as operações
- Máscaras automáticas para CPF, CNPJ, CEP e telefone

## Tecnologias Utilizadas

- **Frontend**: Next.js 16.1.1, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma 5.22.0
- **Autenticação**: NextAuth.js 4 (Google OAuth)
- **Componentes**: IMaskInput para máscaras de entrada
- **APIs Externas**: ViaCEP para busca de endereços brasileiros
- **Deploy**: Vercel (recomendado)

## Pré-requisitos

- Node.js 18+
- PostgreSQL
- Conta Google para OAuth

## Instalação

1. **Clone o repositório**

   ```bash
   git clone https://github.com/tiagogarrais/nosso-local.git
   cd nosso-local
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   - Copie o arquivo `.env.example` para `.env.local`
   - Preencha as variáveis necessárias:

     ```env
     DATABASE_URL=postgresql://usuario:senha@localhost:5433/tiago_delivery
     NEXTAUTH_URL=http://localhost:3000
     NEXTAUTH_SECRET=seu-secret-aleatorio-aqui
     GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=seu-client-secret
     EMAIL_SERVER_HOST=smtp.gmail.com
     EMAIL_SERVER_PORT=587
     EMAIL_SERVER_USER=seu@email.com
     EMAIL_SERVER_PASS=sua-senha-de-app
     EMAIL_FROM=seu@email.com
     ```

   - **IMPORTANTE**: Nunca commite o arquivo `.env.local` no git! Ele está protegido pelo `.gitignore`

4. **Gere o NEXTAUTH_SECRET**

   ```bash
   openssl rand -base64 32
   ```

5. **Configure o Google OAuth**
   - Acesse [Google Cloud Console](https://console.cloud.google.com/)
   - Crie um projeto e habilite a API do Google+
   - Configure as credenciais OAuth 2.0
   - Adicione `http://localhost:3000/api/auth/callback/google` às URIs autorizadas

## Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

Este comando irá:

- ✅ Gerar o cliente Prisma
- ✅ Iniciar o servidor Next.js em [http://localhost:3000](http://localhost:3000)

### Desenvolvimento com Migrações

```bash
npm run dev:migrate
```

Aplica migrações automaticamente no banco remoto e inicia o servidor.

### Comandos Úteis

```bash
npm run prisma:studio    # Abre interface visual do banco remoto
npm run prisma:migrate   # Cria novas migrações
npm run prisma:deploy    # Aplica migrações no banco remoto
npm run db:reset         # Reset completo do banco remoto (cuidado!)
```

### Produção

```bash
npm run build
npm start
```

## ⚠️ Segurança

### Arquivos Sensíveis Protegidos

Os seguintes arquivos **NÃO DEVEM** ser commitados e estão protegidos pelo `.gitignore`:

- ✅ `.env.local` - Contém credenciais e secrets
- ✅ `.env` - Variáveis de ambiente
- ✅ `node_modules/` - Dependências
- ✅ `.next/` - Build do Next.js

### Boas Práticas

1. **Nunca exponha suas credenciais** em código fonte
2. **Use o arquivo `.env.local`** para desenvolvimento local
3. **Gere um NEXTAUTH_SECRET único** para produção
4. **Em produção**, use serviços gerenciados para credenciais

## Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # NextAuth.js
│   │   ├── addresses/     # API de endereços
│   │   ├── cart/          # API do carrinho
│   │   ├── countries/     # API de países
│   │   ├── pix-keys/      # API de chaves PIX
│   │   ├── profile/       # API de perfil
│   │   ├── stores/        # API de lojas
│   │   │   └── [id]/      # Operações por loja (PUT, DELETE)
│   │   └── products/      # API de produtos
│   │       └── [id]/      # Operações por produto (PUT, DELETE)
│   ├── login/             # Página de login independente
│   ├── painel/            # Painel do usuário
│   ├── lojas/             # Listagem de lojas
│   │   └── [slug]/        # Página da loja
│   │       ├── carrinho/  # Carrinho específico da loja
│   │       ├── checkout/  # Checkout da loja
│   │       └── meus-pedidos/ # Pedidos da loja
│   ├── produtos/          # Listagem de produtos
│   ├── store/             # Página de cadastro/edição de lojas
│   ├── products/          # Gestão de produtos
│   │   ├── page.js        # Listagem de produtos
│   │   ├── new/           # Novo produto
│   │   └── edit/          # Editar produto
│   ├── globals.css        # Estilos globais
│   ├── layout.js          # Layout principal
│   └── page.js            # Página inicial
├── components/            # Componentes reutilizáveis
│   ├── AddressForm.js     # Formulário de endereços
│   └── StoreForm.js       # Formulário de loja com ViaCEP
├── lib/                   # Utilitários
│   ├── auth.js            # Configuração NextAuth
│   ├── email.js           # Configuração de email
│   └── prisma.js          # Cliente Prisma
prisma/
├── schema.prisma          # Schema do banco
│                          # (User, Store, Product, Cart, CartItem)
└── migrations/            # Migrações
    ├── 20260113190720_init
    ├── 20260113221049_add_store_fields
    ├── 20260113224538_allow_multiple_stores_per_user
    ├── 20260113232743_add_products
    └── 20260114054337_add_cart_and_cart_items
public/
└── estados-cidades2.json  # Dados de estados brasileiros
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento (conecta ao banco remoto)
- `npm run dev:migrate` - Desenvolvimento COM aplicação automática de migrações no banco remoto
- `npm run build` - Build para produção
- `npm start` - Inicia o servidor de produção
- `npm run prisma:studio` - Abre interface visual do banco remoto
- `npm run prisma:migrate` - Cria migrações em desenvolvimento
- `npm run prisma:deploy` - Aplica migrações em produção
- `npm run db:reset` - Reset completo do banco remoto (cuidado!)
- `npm run update-version` - Atualiza versão e cache buster do service worker

## Atualização de Versão e Cache Buster

Para atualizar a versão da aplicação e invalidar o service worker em produção, use o script automático:

```bash
npm run update-version patch   # Incrementa patch (1.0.0 → 1.0.1)
npm run update-version minor   # Incrementa minor (1.0.0 → 1.1.0)
npm run update-version major   # Incrementa major (1.0.0 → 2.0.0)
```

### O que o script faz:

1. Atualiza a versão semântica no `package.json`
2. Incrementa o cache buster do service worker (`v9` → `v10`)
3. Atualiza todos os nomes de cache no `public/service-worker.js`:
   - `nosso-local-vX`
   - `static-vX`
   - `dynamic-vX`
4. Cria um commit automático com mensagem: `chore: bump version to X.Y.Z (sw-vN)`
5. Após executar, apenas faça `git push` para sincronizar

### Exemplo:

```bash
$ npm run update-version patch

✅ Versão atualizada: 1.0.0 → 1.0.1
✅ Cache version atualizada: v9 → v10
✅ Service worker atualizado
✅ Commit criado automaticamente

💡 Não esqueça de fazer: git push
```

## Funcionalidades Implementadas

### Autenticação e Segurança

- ✅ Página de login independente com redirecionamento
- ✅ Login com Google OAuth
- ✅ Magic Link via email
- ✅ Proteção de rotas autenticadas
- ✅ Redirecionamento automático após login

### Gestão de Lojas

- ✅ Cadastro de múltiplas lojas por usuário
- ✅ Edição completa de informações da loja
- ✅ Exclusão de lojas com validação de propriedade
- ✅ Integração com ViaCEP para busca automática de endereços
- ✅ Máscaras para CNPJ, telefone e CEP
- ✅ Conversão automática de códigos de estado para siglas (UF)

### Gestão de Produtos

- ✅ Listagem de produtos por loja
- ✅ Cadastro de novos produtos
- ✅ Edição de produtos existentes
- ✅ Exclusão de produtos com confirmação
- ✅ Controle de disponibilidade (ativar/desativar)
- ✅ Upload de imagens via URL
- ✅ Validação de preços e campos obrigatórios

### Perfil e Autenticação

- ✅ Login com Google OAuth e Magic Link
- ✅ Página de login independente (`/login`)
- ✅ Perfil com abas (Dados Pessoais, Endereços, Lojas)
- ✅ Atualização de dados pessoais
- ✅ Gerenciamento de múltiplos endereços
- ✅ Máscaras para CPF e telefone
- ✅ Redirecionamento inteligente após login

### Carrinho de Compras

- ✅ Carrinho de compras unificado para todas as lojas
- ✅ Adicionar produtos de diferentes lojas ao mesmo carrinho
- ✅ Atualizar quantidade de itens (botões + e - ou digitação direta com confirmação)
- ✅ Remover itens do carrinho
- ✅ Limpar carrinho completo
- ✅ Cálculo automático de subtotais e total (por loja no checkout)
- ✅ Frete grátis baseado no valor mínimo da loja
- ✅ Notificações toast não intrusivas (sem mover layout)
- ✅ Proteção: redireciona para login se não autenticado

## Modelo de Dados

### User (NextAuth)

- `id`: String (UUID)
- `name`: String
- `email`: String (único)
- `emailVerified`: DateTime
- `image`: String
- `stores`: Store[] (relação)

### Usuario (Dados Extras)

- `id`: String (UUID)
- `userId`: String (referência ao User)
- `name`: String
- `cpf`: String
- `phone`: String
- `addresses`: Json

### Store

- `id`: String (UUID)
- `userId`: String (referência ao User)
- `name`: String
- `cnpj`: String
- `phone`: String
- `description`: String
- `address`: Json (rua, número, complemento, bairro, cidade, estado, CEP)
- `products`: Product[] (relação)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Product

- `id`: String (UUID)
- `storeId`: String (referência à Store)
- `name`: String
- `description`: String
- `price`: Float
- `image`: String (URL)
- `available`: Boolean (default: true)
- `createdAt`: DateTime
- `updatedAt`: DateTime

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Suporte

Para dúvidas ou problemas, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.
