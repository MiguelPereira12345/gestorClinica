# gestorClinica

## Backend (PostgreSQL + Express + Sequelize)

### 1) Criar base de dados no pgAdmin
- Criar uma base de dados (ex: `gestor_clinica`)
- Abrir o Query Tool e correr o script: [backend/sql/gestorClinica_init.sql](backend/sql/gestorClinica_init.sql)

O script único cria as tabelas principais (`utilizador`, `consulta`, `plano_tratamento`, `dependentes`, `historico_medico`, `medico`), as tabelas adicionais (ficheiros, notificações, audit, etc.) e inclui migrações idempotentes para BD já existentes.

Credenciais seed:
- Email: `admin@clinica.local`
- Password: `admin123`

### 2) Configurar variáveis de ambiente
- Copiar [backend/.env.example](backend/.env.example) para `backend/.env`
- Ajustar `DB_*` para apontar para o teu Postgres
- Definir `JWT_SECRET`

### 3) Instalar e arrancar
No diretório `backend`:
- `npm.cmd install`
- `npm.cmd run start`

Servidor por defeito: `http://localhost:3001`

## Autenticação (base PI4)

- `POST /login` devolve `{ token, user }`
- Rotas sensíveis (ex: `/consultas`, `/plano`, `/dependentes`, `/gestores`, `/api/*` e operações admin em `/utilizadores`) exigem header:

`Authorization: Bearer <token>`

## Frontend

O frontend atual usa diretamente:
- `POST /login`
- `POST /utilizadores` (registo)
- `POST /utilizadores/password-reset/request`

Se quiseres que o frontend passe a consumir as rotas protegidas, eu posso adicionar automaticamente o token às requests (via fetch wrapper/axios) e guardar no localStorage.
