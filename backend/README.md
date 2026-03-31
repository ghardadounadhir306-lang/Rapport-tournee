<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Database (MySQL)

### Windows + XAMPP (command `mysql` not found)

XAMPP installs the client here (adjust the drive/folder if yours differs):

`C:\xampp\mysql\bin\mysql.exe`

Add that folder to your user **PATH**, or call the executable with its full path. From the **repository root** (`R.tournee`), to apply `004_app_users.sql`:

```powershell
Get-Content -Raw backend/sql/patches/004_app_users.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root -p r_tournee
```

If the MySQL `root` user has **no password** (default XAMPP), omit `-p`:

```powershell
Get-Content -Raw backend/sql/patches/004_app_users.sql | & "C:\xampp\mysql\bin\mysql.exe" -u root r_tournee
```

Alternative: open **phpMyAdmin** (http://localhost/phpmyadmin), select database `r_tournee`, tab **SQL**, paste the contents of `backend/sql/patches/004_app_users.sql`, and execute.

---

1) Copy env file and adjust credentials:

```bash
$ cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

2) Create the database schema (creates DB `r_tournee` by default).

From the `backend` folder, **Git Bash / cmd**:

```bash
mysql -u root -p < sql/schema.mysql.sql
```

**PowerShell** does not support `<` redirection for files. Use one of these:

```powershell
# from backend folder — pipe the file into mysql
Get-Content -Raw sql/schema.mysql.sql | mysql -u root -p
```

Or call cmd for classic redirection:

```powershell
cmd /c "mysql -u root -p < sql/schema.mysql.sql"
```

If you already have tables/data and only want to add the Excel import table:

```bash
mysql -u root -p < sql/patches/001_create_tms_import_rows.sql
```

3) **Existing database** (schema already applied without `app_users`): add the table.

From the **repository root** (`R.tournee`):

```bash
mysql -u root -p r_tournee < backend/sql/patches/004_app_users.sql
```

**PowerShell** (from repository root):

```powershell
Get-Content -Raw backend/sql/patches/004_app_users.sql | mysql -u root -p r_tournee
```

Or:

```powershell
cmd /c "mysql -u root -p r_tournee < backend/sql/patches/004_app_users.sql"
```

Fresh installs from `sql/schema.mysql.sql` now include `app_users` automatically.

### Seed TMS Excel export (CSV) into `tms_import_rows`

From `backend/`, with MySQL running and `backend/.env` pointing at your database:

```bash
npm run seed:tms
```

The script reads `Copie de ExcelFile_2026-03-13T10_19_12.xlsx - Sheet1.csv` from your **Downloads** folder (Windows), or set `TMS_SEED_CSV` to the full path of the CSV. It ensures `ottmt` is `VARCHAR(64)` and adds `voyhrf` if missing, then replaces all rows in `tms_import_rows` with the file contents.

Optional manual patch (if you prefer not to auto-migrate): `sql/patches/005_fix_tms_columns.sql`.

**GPS & contrôle opérationnel** — si la base a été créée avant cette fonctionnalité, appliquer :

```powershell
Get-Content -Raw backend/sql/patches/006_gps_tms_form_and_points.sql | mysql -u root -p r_tournee
```

Cela ajoute `tms_form_id` sur `gps_points`, rend `tournee_id` nullable, et les colonnes `gps_*` sur `tms_form_data`. Les nouvelles installations via `sql/schema.mysql.sql` incluent déjà la structure `gps_points` à jour.

Endpoints : `POST /api/gps/points`, `POST /api/gps/points/batch`, `GET /api/gps/tournee/:id`, `GET /api/alerts`. Variable optionnelle : `GPS_MIN_POINTS_REAL_ROUTE` (défaut `3`) pour l’alerte « tournée sans trace GPS ».

`GET /api/tms` loads up to `TMS_LIST_MAX_ROWS` rows from `tms_import_rows` (default **100000**), then **deduplicates** by TMS identifier (`tms-…`) for the sidebar. Previously only **50** rows were loaded, which collapsed to a few dozen unique tours even when the database held tens of thousands of lines.

## Stack (R.Tournee)

- **API**: NestJS on Node.js (no PHP, no Apache). REST routes are under `/tms`, `/api/tms`, `/users`, `/api/users`, etc.
- **SMTP**: Optional; required to create users from the admin screen. Set `SMTP_*` and `MAIL_*` in `.env` (see `.env.example`).
- **Frontend**: The Vite app in `../frontend` calls this API via `/api/...` in development (proxy) or `VITE_API_URL` in production builds.

The backend reads these variables:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Optional: `DB_LOGGING=true`
- Optional: `TMS_LIST_MAX_ROWS` (default `100000`) — cap for `/api/tms` list loading

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Import Excel (TMS)

Upload the `.xlsx` file as multipart field name `file`:

```bash
$ curl -F "file=@C:\\path\\to\\file.xlsx" http://localhost:3001/tms/import
```

Then check imported rows:

```bash
$ curl http://localhost:3001/tms
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
