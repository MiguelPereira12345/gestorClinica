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

## Mobile (Flutter)

O backend é o mesmo para a web (React) e para o mobile (Flutter). O que muda é apenas o **endereço** (base URL) que o frontend usa para chamar a API.

- Em desenvolvimento (backend a correr no teu PC):
	- **Android Emulator**: usa `http://10.0.2.2:3001` (porque `localhost` no emulador aponta para o próprio emulador, não para o teu PC)
	- **Dispositivo físico (Android/iOS)**: usa `http://<IP_DO_TEU_PC>:3001` (PC e telemóvel na mesma rede Wi‑Fi)
	- **iOS Simulator**: normalmente `http://localhost:3001` funciona

- Em produção:
	- Tens de ter o backend + base de dados online (Render/Railway/Fly.io/Azure/AWS/etc.) e usar `https://...`
	- No Flutter, aponta o `baseUrl` para esse domínio.

Nota: CORS só afeta browser (React / Flutter web). Flutter mobile não precisa de CORS.

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
