# SmartBank - Banca Digital Educativa

## Visión General

SmartBank es una aplicación web educativa que simula un banco digital real. Está diseñada para enseñar desarrollo web profesional cubriendo desde fundamentos de JavaScript hasta arquitectura de software empresarial.

## Objetivos de Aprendizaje

### Tecnologías
| Tecnología | Propósito |
|-----------|-----------|
| Vanilla JavaScript | Fundamentos puros del lenguaje |
| React | Framework basado en componentes |
| Vue.js | Framework progresivo |
| Angular | Framework completo con TypeScript |
| LitElement | Web Components modernos |
| Polymer | Web Components (enfoque legacy) |

### Conceptos Cubiertos
- **JavaScript**: Hoisting, Scope, Closures, Event Loop, This, Arrow Functions, Modules, Promises, Async/Await, Métodos de Array, Destructuring, Spread/Rest, Optional Chaining
- **REST API**: GET, POST, PUT, PATCH, DELETE, Status Codes, Headers, JSON, Fetch API
- **Testing**: Unitarias, Mocks, Spies, Stubs, Coverage
- **Git**: Git Flow, Branches, PRs, Merge Requests, Rebase, Cherry Pick, Tags
- **CI/CD**: GitHub Actions, Integración Continua, Entrega Continua
- **Calidad**: SonarQube/SonarCloud, Bugs, Vulnerabilities, Code Smells
- **Agile**: Scrum, User Stories, Sprint Planning, Retrospective

## Estructura del Proyecto

```
SmartBank/
├── api/                    # Mock REST API (Express)
│   ├── server.js           # Servidor principal
│   ├── routes/             # Rutas de la API
│   ├── controllers/        # Lógica de negocio
│   ├── middleware/         # Middleware (auth, validation, errors)
│   ├── models/            # Modelos de datos
│   ├── seeds/             # Datos de prueba
│   └── utils/             # Utilidades del servidor
├── src/                    # Implementación Vanilla JS
│   ├── assets/            # Imágenes, iconos, fuentes
│   ├── components/        # Componentes UI reutilizables
│   ├── pages/             # Páginas/Vistas
│   ├── layouts/           # Layouts base
│   ├── services/          # Servicios (API, auth, storage)
│   ├── hooks/             # Custom Hooks (simulados)
│   ├── models/            # Modelos/Interfaces de datos
│   ├── utils/             # Funciones utilitarias
│   ├── constants/         # Constantes de la app
│   ├── styles/            # Estilos CSS globales
│   ├── router/            # Enrutador SPA
│   └── store/             # Estado global
├── implementations/       # Implementaciones por framework
│   ├── react/             # React
│   ├── vue/               # Vue.js
│   ├── angular/           # Angular
│   ├── lit-element/       # LitElement Web Components
│   └── polymer/           # Polymer Web Components
├── tests/                  # Suite de pruebas
│   ├── unit/              # Pruebas unitarias
│   ├── integration/       # Pruebas de integración
│   ├── e2e/               # End-to-end
│   ├── mocks/             # Mocks para testing
│   ├── fixtures/          # Datos de prueba
│   └── helpers/           # Utilidades de testing
├── docs/                   # Documentación educativa
│   ├── agile/             # Metodología ágil
│   ├── architecture/      # Arquitectura
│   ├── api/               # Documentación API
│   ├── javascript-concepts/ # Conceptos JS
│   ├── interview-prep/    # Preparación entrevistas
│   ├── modules/           # Lecciones por módulo
│   ├── git-workflow/      # Flujo de trabajo Git
│   ├── ci-cd/             # Integración continua
│   └── quality/           # Calidad de código
├── config/                 # Configuraciones
├── scripts/               # Scripts de automatización
├── .github/               # GitHub Actions y templates
└── package.json           # Dependencias del proyecto
```

## Inicio Rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/your-username/smartbank.git
cd smartbank

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor API y frontend
npm run dev

# 4. Abrir en navegador
# API: http://localhost:3000
# Frontend: http://localhost:3001
```

## Credenciales de Prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin@smartbank.com | Admin123! | Administrador |
| juan@smartbank.com | User123! | Usuario Regular |
| maria@smartbank.com | User123! | Usuario Premium |

## Scripts Disponibles

| Comando | Descripción |
|---------|------------|
| `npm start` | Inicia solo el servidor API |
| `npm run dev` | Inicia API + Frontend (desarrollo) |
| `npm run test` | Ejecuta todas las pruebas |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run lint` | Verifica código con ESLint |
| `npm run lint:fix` | Corrige errores automáticamente |
| `npm run format` | Formatea código con Prettier |
| `npm run sonar` | Analiza calidad con SonarQube |

## Fases de Desarrollo

| Fase | Estado | Descripción |
|------|--------|-------------|
| 1 | ✅ | Estructura, configuración, documentación |
| 2 | ✅ | API Mock REST completa |
| 3 | ✅ | Implementación Vanilla JavaScript |
| 4 | 🔄 | Implementación React |
| 5 | 🔄 | Implementación Vue.js |
| 6 | 🔄 | Implementación Angular |
| 7 | 🔄 | Web Components (LitElement + Polymer) |
| 8 | 🔄 | Suite de Testing completa |
| 9 | 🔄 | CI/CD, Git Flow, Agile |
| 10 | 🔄 | Documentación educativa final |

## Licencia

MIT - Proyecto educativo. Usa libremente para aprender.
