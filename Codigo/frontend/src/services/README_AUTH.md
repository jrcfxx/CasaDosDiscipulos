# Sistema de Autenticação - Frontend

Sistema completo de autenticação integrado com o backend da Casa dos Discípulos.

## 📁 Estrutura

```
src/
├── services/
│   ├── authService.ts      # Serviço principal de autenticação
│   └── apiClient.ts         # Cliente Axios configurado com interceptors
├── hooks/
│   └── useAuth.ts           # Hook customizado para autenticação
├── components/
│   └── ProtectedRoute.tsx   # Componente de rota protegida
├── pages/
│   └── Login.tsx            # Página de login
└── types/
    └── index.ts             # Tipos TypeScript (Usuario, AuthResponse, etc.)
```

## 🔐 Funcionalidades

### 1. AuthService (`services/authService.ts`)

Serviço singleton que gerencia todas as operações de autenticação:

**Métodos:**

- `login(credentials)` - Realiza login e armazena token/usuário
- `register(data)` - Registra novo usuário
- `logout()` - Remove token e dados do usuário
- `isAuthenticated()` - Verifica se há usuário autenticado
- `getToken()` - Retorna o token JWT
- `getUser()` - Retorna os dados do usuário
- `isAdmin()` - Verifica se o usuário é admin

**Exemplo:**

```typescript
import authService from "../services/authService";

// Login
const response = await authService.login({ email, senha });
console.log(response.usuario, response.token);

// Verificar autenticação
if (authService.isAuthenticated()) {
  const user = authService.getUser();
  console.log(user.nome);
}

// Logout
authService.logout();
```

### 2. API Client (`services/apiClient.ts`)

Cliente Axios configurado com interceptors automáticos:

**Recursos:**

- ✅ Adiciona token JWT automaticamente em todas as requisições
- ✅ Trata erros 401 (não autorizado) fazendo logout automático
- ✅ Redireciona para login quando token expira
- ✅ Timeout de 10 segundos
- ✅ Base URL configurável via `REACT_APP_API_URL`

**Exemplo:**

```typescript
import api from "../services/apiClient";

// O token é adicionado automaticamente
const response = await api.get("/usuarios");
const usuarios = response.data;
```

### 3. Hook useAuth (`hooks/useAuth.ts`)

Hook React customizado para facilitar uso da autenticação em componentes:

**Retorna:**

```typescript
{
  user: Usuario | null,          // Dados do usuário
  isAuthenticated: boolean,      // Se está autenticado
  isAdmin: boolean,              // Se é admin
  loading: boolean,              // Estado de carregamento
  login: (email, senha) => void, // Função de login
  logout: () => void,            // Função de logout
  refreshUser: () => void        // Atualizar dados do usuário
}
```

**Exemplo:**

```typescript
import { useAuth } from "../hooks/useAuth";

function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div>
      <span>Olá, {user?.nome}</span>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
```

### 4. ProtectedRoute (`components/ProtectedRoute.tsx`)

Componente para proteger rotas que requerem autenticação:

**Props:**

- `children` - Componente filho a ser renderizado
- `requireAdmin` - Se true, só permite admin

**Exemplo:**

```typescript
import ProtectedRoute from '../components/ProtectedRoute';

// No App.tsx ou nas rotas
<Route
  path="/admin"
  element={
    <ProtectedRoute requireAdmin>
      <AdminPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/perfil"
  element={
    <ProtectedRoute>
      <PerfilPage />
    </ProtectedRoute>
  }
/>
```

### 5. Página de Login (`pages/Login.tsx`)

Página de login refatorada com:

- ✅ Validação de campos
- ✅ Estados de loading
- ✅ Mensagens de erro amigáveis
- ✅ Integração com authService
- ✅ Acessibilidade (ARIA labels, autocomplete)
- ✅ Desabilita campos durante loading

## 🔄 Fluxo de Autenticação

### Login

```
1. Usuário preenche email e senha
2. authService.login() envia POST /api/auth/login
3. Backend valida credenciais
4. Backend retorna { usuario, token }
5. authService armazena no localStorage
6. Usuário é redirecionado para home
```

### Requisições Autenticadas

```
1. Componente faz requisição via api.get/post/etc
2. Interceptor adiciona header: Authorization: Bearer {token}
3. Backend valida token JWT
4. Backend retorna dados ou erro 401
5. Se 401, interceptor faz logout e redireciona
```

### Logout

```
1. Usuário clica em "Sair"
2. authService.logout() remove token e usuário
3. Usuário é redirecionado para /login
```

## 🛡️ Segurança

### Token JWT

- Armazenado em `localStorage` com chave `token`
- Adicionado automaticamente em todas as requisições
- Validado pelo backend em rotas protegidas

### Proteção de Rotas

- `ProtectedRoute` verifica autenticação antes de renderizar
- Redireciona para `/login` se não autenticado
- Suporta verificação de nível admin

### Expiração de Token

- Interceptor detecta erro 401
- Faz logout automático
- Redireciona para login

## 📦 Tipos TypeScript

```typescript
// Usuario
interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  tipo: "admin" | "usuario";
  ativo: boolean;
  data_cadastro: string;
}

// LoginCredentials
interface LoginCredentials {
  email: string;
  senha: string;
}

// RegisterData
interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  tipo: "admin" | "usuario";
}

// AuthResponse
interface AuthResponse {
  message: string;
  usuario: Usuario;
  token: string;
}
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### Backend Requirements

O backend deve ter os seguintes endpoints:

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `PUT /api/auth/password` - Atualizar senha

## 🎨 CSS

O arquivo `Login.css` inclui estilos para:

- Container de login centralizado
- Formulário com campos elegantes
- Mensagens de erro estilizadas
- Estados de loading e disabled
- Responsividade

## 🧪 Testes

### Testar Login

```typescript
// Email válido: qualquer email cadastrado no backend
// Senha: a senha do usuário

// Exemplo (após rodar seeds):
Email: admin@casadosdiscipulos.com
Senha: admin123
```

### Verificar Token

```typescript
// No console do navegador:
localStorage.getItem("token");
localStorage.getItem("usuario");
```

## 📝 Boas Práticas

1. **Sempre use authService** - Não acesse localStorage diretamente
2. **Use apiClient para requisições** - Token é adicionado automaticamente
3. **Proteja rotas sensíveis** - Use `<ProtectedRoute>`
4. **Trate erros** - Sempre use try/catch em operações de autenticação
5. **Valide no frontend** - Mas confie na validação do backend

## 🚀 Próximos Passos

- [ ] Implementar refresh token
- [ ] Adicionar "Lembrar-me"
- [ ] Página de registro
- [ ] Recuperação de senha
- [ ] Autenticação de dois fatores
- [ ] Login social (Google, Facebook)

## 📖 Referências

- [Backend Auth Routes](../../backend/src/routes/authRoutes.js)
- [Backend Auth Controller](../../backend/src/controllers/authController.js)
- [Backend Auth Service](../../backend/src/services/authService.js)
