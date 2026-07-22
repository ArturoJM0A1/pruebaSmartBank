# SmartBank - Guia de Estudio para Desarrollo Web

---

## Que es SmartBank?

Es una aplicacion web que **simula un banco real**. Tiene login, cuentas, tarjetas, transferencias, pagos de servicios, notificaciones, y mas.

Pero lo importante no es el banco. Lo importante es que **mientras lo construyes, aprendes todo esto:**

---

## Indice de Temas

| # | Tema | Donde esta en el proyecto |
|---|------|--------------------------|
| 1 | [HTML](#1-html) | `src/pages/`, `src/layouts/` |
| 2 | [CSS](#2-css) | `src/styles/` |
| 3 | [JavaScript Vanilla](#3-javascript-vanilla) | `src/utils/`, `src/services/`, `src/components/` |
| 4 | [APIs REST](#4-apis-rest) | `api/routes/`, `api/server.js` |
| 5 | [React](#5-react) | `implementations/react/` |
| 6 | [Vue.js](#6-vuejs) | `implementations/vue/` |
| 7 | [Angular](#7-angular) | `implementations/angular/` |
| 8 | [Web Components: LitElement](#8-litelement) | `implementations/lit-element/` |
| 9 | [Web Components: Polymer](#9-polymer) | `implementations/polymer/` |
| 10 | [Testing Unitario](#10-testing-unitario) | `tests/` |
| 11 | [Que es un Mock](#11-que-es-un-mock) | `tests/mocks/` |
| 12 | [CI/CD](#12-cicd) | `.github/workflows/` |
| 13 | [SonarQube](#13-sonarqube) | `docs/quality/` |
| 14 | [Integracion Continua](#14-integracion-continua) | `.github/workflows/ci.yml` |
| 15 | [Merge Request / Pull Request](#15-merge-request--pull-request) | `.github/pull_request_template.md` |
| 16 | [Git Flow](#16-git-flow) | `docs/git-workflow/` |
| 17 | [Git](#17-git) | `docs/git-workflow/GIT_WORKFLOW.md` |
| 18 | [Agile / Scrum](#18-agile--scrum) | `docs/agile/` |
| 19 | [Clonacion de Objetos en JS](#19-clonacion-de-objetos-en-javascript) | `src/utils/copy.js` |
| 20 | [Promesas en JS](#20-que-es-una-promesa-en-javascript) | `src/utils/async.js` |
| 21 | [Hoisting](#21-que-es-el-hoisting) | `docs/javascript-concepts/CONCEPTS.md` |
| 22 | [map vs forEach](#22-diferencia-entre-map-y-foreach) | `docs/javascript-concepts/CONCEPTS.md` |

---

## Inicio Rapido

```bash
# 1. Clonar el proyecto
cd "D:\AJM\Arturo DEV\guiaplexus\SmartBank"

# 2. Instalar dependencias (solo la primera vez)
npm install

# 3. Iniciar todo
npm start

# 4. Abrir en el navegador
# http://localhost:3000
```

**Credenciales de prueba:**
- Email: `juan.perez@email.com` Contrasena: `password123`
- Admin: `admin@smartbank.mx` Contrasena: `admin123`
- Premium: `maria.lopez@email.com` Contrasena: `password123`

---

## 1. HTML

**Que es:** HTML (HyperText Markup Language) es el esqueleto de toda pagina web. Sin HTML no hay nada visible.

**Que aprendes aqui:**
- Etiquetas semanticas: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`
- Formularios con validacion
- Accesibilidad (ARIA labels)
- Estructura de una SPA (Single Page Application)

**Archivos clave:**
- `src/index.html` - Punto de entrada de toda la app
- `src/pages/login.html` - Pagina de login
- `src/pages/dashboard.html` - Panel principal
- `src/pages/accounts.html` - Cuentas bancarias
- `src/layouts/main.html` - Layout base del banco

**Ejemplo real en el proyecto:**
```html
<!-- Este es el layout principal. Header, Sidebar y contenido -->
<div class="app-layout">
  <aside class="app-sidebar">...</aside>   <!-- Menu lateral -->
  <header class="app-header">...</header>   <!-- Barra superior -->
  <main class="app-main" id="appContent">  <!-- Contenido dinamico -->
    <!-- Aqui se cargan las paginas via JavaScript -->
  </main>
</div>
```

**Preguntas de entrevista:**
- Que diferencia hay entre `<div>` y `<section>`?
- Para que sirven los atributos `aria-label`?
- Que es una SPA y porque usa HTML dinamico?

---

## 2. CSS

**Que es:** CSS (Cascading Style Sheets) es la piel de la pagina. Controla colores, tamanos, posiciones, animaciones.

**Que aprendes aqui:**
- CSS Variables (Custom Properties) para temas
- Flexbox y CSS Grid para layouts
- Responsive Design (mobile-first)
- Dark Mode con CSS variables
- Animaciones y transiciones
- BEM naming convention

**Archivos clave:**
- `src/styles/variables.css` - Tokens de diseno (colores, espacios, fuentes)
- `src/styles/reset.css` - Reset moderno del navegador
- `src/styles/layout.css` - Sistema de layout con Grid y Flexbox
- `src/styles/components.css` - Estilos de botones, cards, formularios
- `src/styles/responsive.css` - Media queries para movil
- `src/styles/dark-theme.css` - Tema oscuro
- `src/styles/animations.css` - Animaciones CSS

**Ejemplo real:**
```css
/* Variables de diseno - cambias aqui y cambia TODO el proyecto */
:root {
  --color-primary-500: #3b82f6;  /* Azul principal */
  --spacing-4: 1rem;              /* Espaciado base */
  --radius-lg: 0.5rem;           /* Bordes redondeados */
}

/* Responsive: mobile-first */
.card { padding: var(--spacing-4); }

@media (min-width: 768px) {
  .card { padding: var(--spacing-6); }  /* Mas padding en desktop */
}
```

**Preguntas de entrevista:**
- Que es mobile-first y por que se usa?
- Cual es la diferencia entre Flexbox y Grid?
- Que son las CSS Variables y que ventaja tienen sobre SCSS?

---

## 3. JavaScript Vanilla

**Que es:** JavaScript puro, sin frameworks. Es el lenguaje que hace que las paginas web sean interactivas.

**Que aprendes aqui (todos estos conceptos estan aplicados en el proyecto):**

| Concepto | Donde se aplica |
|----------|----------------|
| Hoisting | `docs/javascript-concepts/CONCEPTS.md` |
| Scope | Variables dentro/fuera de funciones |
| Closures | `src/utils/helpers.js` (debounce, throttle) |
| Event Loop | `src/utils/async.js` |
| `this` | Event handlers en componentes |
| Arrow Functions | En todos los servicios |
| Modules (import/export) | Todos los archivos de `src/` |
| Promises | `src/utils/async.js` |
| Async/Await | `src/services/api.js` |
| Callbacks | Funciones de array, eventos |
| map, filter, reduce | Procesamiento de transacciones |
| Destructuring | Extraer datos de respuestas API |
| Spread/Rest | Copiar objetos, combinar arrays |
| Optional Chaining | Acceder a propiedades anidadas |
| Nullish Coalescing | Valores por defecto |

**Archivos clave:**
- `src/utils/helpers.js` - Funciones utilitarias (formatCurrency, debounce, etc.)
- `src/utils/validators.js` - Validacion de formularios
- `src/utils/copy.js` - Clonacion de objetos (shallow y deep copy)
- `src/utils/dom.js` - Manipulacion del DOM
- `src/utils/async.js` - Funciones asincronas (retry, queue, parallel)
- `src/services/api.js` - Cliente HTTP con Fetch API
- `src/store/store.js` - Estado global reactivo
- `src/router/router.js` - Enrutador SPA

**Ejemplo de Closure (debounce):**
```javascript
// Por que usa closure? Porque internamente "recuerda" el timer
// a pesar de que la funcion ya termino de ejecutarse.
function debounce(fn, delay) {
  let timer;  // Esta variable vive en el closure
  return function(...args) {
    clearTimeout(timer);    // Cada vez que llamas, cancela el anterior
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

**Preguntas de entrevista:**
- Que es el Event Loop y como funciona?
- Cual es la diferencia entre `var`, `let` y `const`?
- Que es un closure y dame un ejemplo real?
- Que es el hoisting?

---

## 4. APIs REST

**Que es:** Una API REST es la forma en que el frontend (lo que ve el usuario) se comunica con el backend (el servidor). Usa HTTP como lenguaje.

**Metodos HTTP que usa este proyecto:**

| Metodo | Que hace | Ejemplo en SmartBank |
|--------|----------|---------------------|
| `GET` | Obtener datos | `GET /api/accounts` - Ver mis cuentas |
| `POST` | Crear algo nuevo | `POST /api/auth/login` - Iniciar sesion |
| `PUT` | Reemplazar todo | `PUT /api/users/profile` - Actualizar perfil completo |
| `PATCH` | Actualizar parcial | `PATCH /api/cards/1/block` - Bloquear tarjeta |
| `DELETE` | Eliminar | `DELETE /api/beneficiaries/1` - Borrar beneficiario |

**Archivos clave:**
- `api/server.js` - Servidor Express que recibe las peticiones
- `api/routes/*.js` - Cada archivo es un grupo de endpoints
- `api/middleware/auth.js` - Verifica que el usuario este logueado
- `api/middleware/validation.js` - Valida que los datos sean correctos
- `api/middleware/errorHandler.js` - Maneja errores centralizadamente
- `src/services/api.js` - Cliente que HACE las peticiones desde el frontend

**Ejemplo real de una peticion:**
```javascript
// Frontend: src/services/api.js
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })  // Envia datos al servidor
  });
  const data = await response.json();  // Respuesta del servidor
  return data;  // { success: true, data: { token, user } }
}
```

**Status Codes que debes conocer:**
- `200` OK - Todo bien
- `201` Created - Se creo algo nuevo
- `400` Bad Request - Enviaste datos incorrectos
- `401` Unauthorized - No estas logueado
- `403` Forbidden - No tienes permiso
- `404` Not Found - No existe
- `500` Internal Server Error - El servidor exploto

**Preguntas de entrevista:**
- Cual es la diferencia entre PUT y PATCH?
- Que son los Headers HTTP?
- Que es JWT y como funciona la autenticacion?

---

## 5. React

**Que es:** Una libreria de Facebook para crear interfaces con componentes. Es el framework mas usado en la industria.

**Que aprenderas:**
- Componentes funcionales con Hooks
- `useState` - Manejar estado
- `useEffect` - Efectos secundarios (API calls)
- Custom Hooks (`useAuth`, `useFetch`, `useForm`)
- Redux Toolkit para estado global
- React Router para navegacion
- JSX (HTML dentro de JavaScript)

**Archivos clave:**
- `implementations/react/src/App.jsx` - Componente raiz con rutas
- `implementations/react/src/hooks/useAuth.js` - Custom hook de autenticacion
- `implementations/react/src/hooks/useFetch.js` - Hook para llamadas a API
- `implementations/react/src/store/slices/authSlice.js` - Estado de autenticacion

**Por que usar React sobre Vanilla JS?**
- Reutilizacion de componentes
- Manejo declarativo del estado
- Gran ecosistema (librerias para todo)
- Mas empleos disponibles

**Preguntas de entrevista:**
- Que son los Hooks y por que se usan?
- Cual es la diferencia entre `useState` y `useReducer`?
- Que es el Virtual DOM?

---

## 6. Vue.js

**Que es:** Un framework progresivo (puedes usar solo lo que necesitas). Mas facil de aprender que React.

**Que aprenderas:**
- Composition API (la forma moderna de Vue 3)
- `<script setup>` - Sintaxis concisa
- `ref()` y `reactive()` - Manejo de estado
- Composables (el equivalente a los Hooks de React)
- Pinia para estado global (similar a Redux pero mas simple)
- Vue Router
- Two-way data binding con `v-model`

**Archivos clave:**
- `implementations/vue/src/App.vue` - Componente raiz
- `implementations/vue/src/composables/useAuth.js` - Composable de auth
- `implementations/vue/src/store/auth.js` - Store con Pinia
- `implementations/vue/src/components/LoginForm.vue` - Formulario reactiva

**Comparacion rapida:**
```
React:  useState()         ->  const [count, setCount] = useState(0)
Vue:    ref()              ->  const count = ref(0)

React:  useEffect(() => {})  ->  se ejecuta despues del render
Vue:    watchEffect(() => {}) ->  se ejecuta cuando cambian dependencias
```

**Preguntas de entrevista:**
- Cual es la diferencia entre Options API y Composition API?
- Que es el two-way data binding?
- Por que Vue es "progresivo"?

---

## 7. Angular

**Que es:** Un framework completo de Google. Mas pesado pero muy completo. Usa TypeScript (JavaScript con tipos).

**Que aprenderas:**
- Componentes con decoradores (`@Component`)
- Servicios con Dependency Injection
- Observables y RxJS (programacion reactiva)
- Guards (proteger rutas)
- Interceptors (modificar peticiones HTTP)
- Signals (estado reactivo moderno)
- Standalone components (sin NgModule)

**Archivos clave:**
- `implementations/angular/src/app/app.component.ts` - Componente raiz
- `implementations/angular/src/app/core/services/auth.service.ts` - Servicio de auth
- `implementations/angular/src/app/core/guards/auth.guard.ts` - Guard de rutas
- `implementations/angular/src/app/core/interceptors/auth.interceptor.ts` - Interceptor HTTP
- `implementations/angular/src/app/shared/pipes/currency-format.pipe.ts` - Pipe personalizado

**Diferencia clave:**
```
React/Vue:  function App() { return <div>Hola</div> }     ->  JSX
Angular:    @Component({ template: '<div>Hola</div>' })     ->  Decorador
```

**Preguntas de entrevista:**
- Que es Dependency Injection?
- Que son los Observables y como se diferencian de las Promises?
- Para que sirven los Interceptors?

---

## 8. LitElement

**Que es:** Una libreria para crear **Web Components** (componentes nativos del navegador). Funcionan en cualquier framework o sin framework.

**Que aprenderas:**
- Shadow DOM (estilos encapsulados)
- Propiedades reactivas (`@property`)
- Lifecycle callbacks (`connectedCallback`, `updated`)
- Template HTML con `html` tag
- CSS con `css` tag
- Slots (composicion de componentes)
- Custom Events (comunicacion entre componentes)

**Archivos clave:**
- `implementations/lit-element/src/components/smartbank-card.js` - Tarjeta bancaria
- `implementations/lit-element/src/components/smartbank-button.js` - Boton con slots
- `implementations/lit-element/src/components/smartbank-modal.js` - Modal accesible
- `implementations/lit-element/src/components/smartbank-input.js` - Input con validacion

**Ejemplo:**
```javascript
import { LitElement, html, css } from 'lit';

class SmartBankCard extends LitElement {
  static properties = { balance: { type: Number } };

  static styles = css`
    .card { padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  `;

  render() {
    return html`<div class="card"><p>Saldo: $${this.balance}</p></div>`;
  }
}
customElements.define('smartbank-card', SmartBankCard);
```

**Uso:** `<smartbank-card balance="5000"></smartbank-card>`

**Preguntas de entrevista:**
- Que es el Shadow DOM?
- Cual es la ventaja de Web Components sobre componentes de framework?
- Que es el encapsulamiento de estilos?

---

## 9. Polymer

**Que es:** La implementacion original de Web Components de Google. **Hoy en dia se usa LitElement** (que es Polymer modernizado). Polymer es considerado "legacy" (obsoleto).

**Por que aprender Polymer:**
- Entender la evolucion de Web Components
- Mantener codigo viejo en empresas
- Comparar con LitElement para appreciate la mejora

**Archivos clave:**
- `implementations/polymer/src/components/smart-bank-card.html` - Tarjeta
- `implementations/polymer/src/components/smart-bank-button.html` - Boton
- `implementations/polymer/src/components/app-shell.html` - Shell de la app

**Polymer vs LitElement:**
```
Polymer:     HTML template en archivo .html separado
LitElement:  Todo en un solo archivo .js

Polymer:     Polymer({properties: {...}})
LitElement:  class MiComponente extends LitElement

Polymer:     Mas verboso, mas archivos
LitElement:  Mas conciso, moderno
```

**Consejo:** Si empiezas un proyecto nuevo, usa **LitElement**. Polymer es solo para mantener codigo existente.

---

## 10. Testing Unitario

**Que es:** Probar partes pequenas del codigo de forma automatica. Si cambias algo, el test te avisa si algo se rompio.

**Tipos de testing:**
- **Unitario:** Prueba una funcion aislada (ej: `formatCurrency(100)`)
- **Integracion:** Prueba que varias piezas trabajen juntas (ej: login + redirect)
- **E2E (End-to-end):** Simula un usuario real usando la app

**Archivos clave:**
- `tests/unit/utils/helpers.test.js` - Tests de funciones utilitarias
- `tests/unit/utils/validators.test.js` - Tests de validadores
- `tests/unit/utils/copy.test.js` - Tests de clonacion de objetos
- `tests/unit/services/api.test.js` - Tests del cliente HTTP
- `tests/unit/services/auth.test.js` - Tests de autenticacion
- `tests/unit/store/store.test.js` - Tests del estado global
- `tests/integration/transfer.test.js` - Test de flujo completo de transferencia
- `jest.config.js` - Configuracion de Jest (el framework de tests)

**Ejemplo de un test:**
```javascript
// tests/unit/utils/helpers.test.js
describe('formatCurrency', () => {
  it('deberia formatear pesos mexicanos', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00 MXN');
  });

  it('deberia manejar cero', () => {
    expect(formatCurrency(0)).toBe('$0.00 MXN');
  });

  it('deberia manejar numeros negativos', () => {
    expect(formatCurrency(-500)).toBe('-$500.00 MXN');
  });
});
```

**Para ejecutar:**
```bash
npm test              # Todos los tests
npm run test:watch    # Modo observador (re-ejecuta al guardar)
```

**Preguntas de entrevista:**
- Que es un test unitario y por que es importante?
- Que es la cobertura de codigo (coverage)?
- Cual es la diferencia entre `describe` y `it`?

---

## 11. Que es un Mock

**Que es:** Un **mock** es un objeto falso que simula el comportamiento de algo real. Se usa en testing para no depender de servicios externos.

**Ejemplo sin mock:**
```javascript
// ESTO es malo para tests porque depende de internet y de la API real
const response = await fetch('http://localhost:3000/api/accounts');
```

**Ejemplo con mock:**
```javascript
// ESTO es bueno para tests porque simula la respuesta
fetch.mockResponseOnce(JSON.stringify({
  success: true,
  data: [{ id: 1, balance: 5000 }]
}));
const accounts = await api.get('/accounts');
expect(accounts.data[0].balance).toBe(5000);
```

**Archivos clave:**
- `tests/mocks/mockData.js` - Datos falsos para tests
- `tests/mocks/mockFetch.js` - Simula respuestas de la API

**Terminos importantes:**
- **Mock:** Objeto falso que simula un servicio real
- **Spy:** Espia que verifica si una funcion fue llamada
- **Stub:** Reemplazo que siempre retorna el mismo valor

**Preguntas de entrevista:**
- Para que sirve un mock en testing?
- Cual es la diferencia entre mock y stub?
- Por que no debes probar con la API real?

---

## 12. CI/CD

**Que es:** CI/CD es un sistema automatico que **compila, prueba y despliega** tu codigo cada vez que haces push.

- **CI (Continuous Integration):** Cada push ejecuta tests y lint automaticamente
- **CD (Continuous Delivery):** El codigo listo para produccion se prepara automaticamente
- **CD (Continuous Deployment):** Se despliega a produccion automaticamente

**Archivos clave:**
- `.github/workflows/ci.yml` - Pipeline de integracion continua
- `.github/workflows/cd.yml` - Pipeline de despliegue

**Que hace el pipeline de CI:**
```
Push a GitHub
    ↓
Instalar dependencias (npm install)
    ↓
Ejecutar linter (npm run lint)
    ↓
Ejecutar tests (npm test)
    ↓
Compilar proyecto (npm run build)
    ↓
Todo verde? -> Codigo listo para merge
Algo rojo?  -> Rechazar el push
```

**Preguntas de entrevista:**
- Que es CI/CD?
- Que es GitHub Actions?
- Por que automatizar el pipeline?

---

## 13. SonarQube

**Que es:** Una herramienta que **analiza tu codigo** y te dice que tan bueno o malo es. Mide:

| Metrica | Que significa |
|---------|---------------|
| **Bugs** | Errores que van a causar problemas |
| **Vulnerabilities** | Problemas de seguridad (hackeables) |
| **Code Smells** | Codigo que funciona pero esta mal escrito (difcil de mantener) |
| **Duplicacion** | Codigo repetido (deberia reutilizarse) |
| **Coverage** | Porcentaje de codigo que tiene tests |

**Donde esta:**
- `docs/quality/QUALITY_GUIDE.md` - Guia completa

**Regla de oro:** Si SonarQube marca un problema, **corrigelo antes de hacer merge**. En empresas reales, un PR no se aprueba si tiene bugs o vulnerabilities.

---

## 14. Integracion Continua

**Que es:** La practica de que todos los desarrolladores **mezclen su codigo frecuentemente** (varias veces al dia). Cada mezcla se verifica automaticamente.

**Como funciona en este proyecto:**
1. Haces un commit y push
2. GitHub Actions se activa automaticamente
3. Ejecuta: install -> lint -> test -> build
4. Si todo pasa: el codigo se puede merge
5. Si algo falla: se te notifica para arreglarlo

**Por que importa:** Evita el "works on my machine" (en mi maquina si funciona). Si los tests pasan en CI, funciona en todas las maquinas.

---

## 15. Merge Request / Pull Request

**Que es:** Una forma de proponer cambios al codigo antes de que se mezclen con la rama principal.

**Flujo:**
1. Creas una rama nueva: `git checkout -b feature/login-page`
2. Haces tu codigo
3. Push: `git push origin feature/login-page`
4. En GitHub creas un **Pull Request** (PR)
5. Otro desarrollador **revisa** tu codigo
6. Si esta bien, se **merge** a develop
7. Si no, te pide cambios

**Template del PR (esta en el proyecto):**
- Descripcion de los cambios
- Tipo de cambio (feature, fix, etc.)
- Checklist de testing
- Notas para el reviewer

**Preguntas de entrevista:**
- Que es un Pull Request?
- Que es un Code Review?
- Por que no hacer push directo a main?

---

## 16. Git Flow

**Que es:** Una estrategia para organizar las ramas (branches) de git. Define que ramas existen y como se usan.

```
main          ← Produccion (nunca se toca directamente)
  └── develop ← Desarrollo (donde se integra todo)
       ├── feature/login     ← Nueva funcionalidad
       ├── feature/transfer  ← Otra funcionalidad
       ├── bugfix/fix-login  ← Correccion de bug
       └── hotfix/security   ← Fix urgente en produccion
```

**Comandos clave:**
```bash
git checkout -b feature/mi-funcionalidad develop  # Crear rama
git checkout develop                                # Volver a develop
git merge feature/mi-funcionalidad                  # Mezclar
git branch -d feature/mi-funcionalidad              # Eliminar rama
```

**Archivos clave:**
- `docs/git-workflow/GIT_WORKFLOW.md` - Guia completa de Git
- `docs/git-workflow/BRANCHING_STRATEGY.md` - Estrategia de ramas

**Preguntas de entrevista:**
- Que es Git Flow?
- Cual es la diferencia entre `merge` y `rebase`?
- Que es un hotfix?

---

## 17. Git

**Que es:** Un sistema de control de versiones. Guarda el historial de todos los cambios de tu codigo. Si algo se rompe, puedes volver atras.

**Comandos esenciales:**

```bash
git init                    # Crear repositorio
git clone <url>             # Clonar repositorio
git add .                   # Preparar cambios
git commit -m "mensaje"     # Guardar cambios
git push                    # Subir a GitHub
git pull                    # Bajar cambios
git branch                  # Ver ramas
git checkout -b nueva-rama  # Crear y entrar a rama
git merge rama              # Mezclar ramas
git log --oneline           # Ver historial
git stash                   # Guardar cambios temporalmente
git rebase develop          # Rebasar tu rama sobre develop
git cherry-pick <commit>    # Copiar un commit especifico
git tag v1.0.0              # Crear etiqueta de version
```

**Archivos clave:**
- `docs/git-workflow/GIT_WORKFLOW.md` - Guia completa
- `.github/pull_request_template.md` - Template de PR

---

## 18. Agile / Scrum

**Que es:** Una forma de **organizar el trabajo en equipo**. En vez de planear todo al inicio, trabajos en ciclos cortos llamados "Sprints" (1-2 semanas).

**Roles:**
- **Product Owner:** Decide QUE se construye
- **Scrum Master:** Ayuda al equipo a ser productivo
- **Dev Team:** Los que construyen

**Eventos:**
- **Sprint Planning:** Que vamos a hacer este sprint?
- **Daily Scrum:** Cada manana, 15 min: que hice, que hare, que me bloquea
- **Sprint Review:** Demo de lo que se hizo
- **Retrospective:** Que mejorar para el proximo sprint

**Archivos clave:**
- `docs/agile/PRODUCT_BACKLOG.md` - Lista de todo por hacer
- `docs/agile/USER_STORIES.md` - Historias de usuario (25+ historias)
- `docs/agile/SPRINT_PLANNING.md` - Template de planificacion
- `docs/agile/DAILY_SCRUM.md` - Template de daily
- `docs/agile/SPRINT_RETROSPECTIVE.md` - Template de retrospectiva
- `docs/agile/SCRUM_GUIDE.md` - Guia completa de Scrum

**Ejemplo de User Story:**
```
COMO usuario del banco
QUIERO iniciar sesion con mi email y password
PARA poder acceder a mi cuenta de forma segura

Criterios de aceptacion:
- DADO que estoy en la pagina de login
  CUANDO ingreso credenciales correctas
  ENTONCES debo ser redirigido al dashboard
```

**Preguntas de entrevista:**
- Que es un Sprint?
- Que es una User Story?
- Que es la retrospectiva y por que es importante?

---

## 19. Tipos de Clonacion de Objetos en JavaScript

Esta es una pregunta **muy comun** en entrevistas. En SmartBank lo encontraras en `src/utils/copy.js`.

### Copia Superficial (Shallow Copy)
Crea un nuevo objeto, pero los objetos anidados **siguen siendo la misma referencia**.

```javascript
const original = { nombre: "Juan", direccion: { ciudad: "CDMX" } };

// Shallow copy con Spread Operator
const copia = { ...original };

copia.direccion.ciudad = "Guadalajara";
console.log(original.direccion.ciudad); // "Guadalajara" (SE CAMBIO!)
```

**Metodos de Shallow Copy:**
```javascript
// 1. Spread Operator (el mas comun)
const copia = { ...original };

// 2. Object.assign()
const copia = Object.assign({}, original);

// 3. Array.slice() para arrays
const copiaArray = originalArray.slice();
```

### Copia Profunda (Deep Copy)
Crea un nuevo objeto Y tambien copia todos los objetos anidados. Son **completamente independientes**.

```javascript
const original = { nombre: "Juan", direccion: { ciudad: "CDMX" } };

// Deep copy con structuredClone (moderno)
const copia = structuredClone(original);

copia.direccion.ciudad = "Guadalajara";
console.log(original.direccion.ciudad); // "CDMX" (NO se cambio!)
```

**Metodos de Deep Copy:**
```javascript
// 1. structuredClone() (RECOMENDADO - moderno)
const copia = structuredClone(original);

// 2. JSON.parse(JSON.stringify()) (limitaciones)
const copia = JSON.parse(JSON.stringify(original));
// NO funciona con: fechas, undefined, funciones, null

// 3. Copia manual recursiva (para control total)
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  const copy = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    copy[key] = deepCopy(obj[key]);
  }
  return copy;
}
```

### Cuando usar cada una:

| Situacion | Metodo |
|-----------|--------|
| Objeto simple sin anidados | `{ ...obj }` o `Object.assign()` |
| Objeto con anidados (general) | `structuredClone(obj)` |
| Objeto con fechas/funciones | Copia manual o libreria (lodash) |
| Necesitas rapido y no hay anidados | Spread operator |

**Preguntas de entrevista:**
- Cual es la diferencia entre shallow y deep copy?
- Que limitaciones tiene `JSON.parse(JSON.stringify())`?
- Que es `structuredClone` y por que es mejor?

---

## 20. Que es una Promesa en JavaScript?

Una **Promise** es un objeto que representa el **resultado futuro** de una operacion asincrona (algo que toma tiempo).

**El problema sin Promises:**
```javascript
// Callback Hell (pesadilla)
fetchUser(id, function(user) {
  getOrders(user.id, function(orders) {
    getOrderDetails(orders[0].id, function(details) {
      console.log(details);  // 3 niveles de anidacion!
    });
  });
});
```

**La solucion con Promises:**
```javascript
fetchUser(id)
  .then(user => getOrders(user.id))
  .then(orders => getOrderDetails(orders[0].id))
  .then(details => console.log(details))
  .catch(error => console.error(error));  // Un solo lugar para errores
```

**La forma moderna (Async/Await):**
```javascript
// Lo mismo pero leyendo como codigo sincrono
async function getData() {
  try {
    const user = await fetchUser(id);
    const orders = await getOrders(user.id);
    const details = await getOrderDetails(orders[0].id);
    console.log(details);
  } catch (error) {
    console.error(error);
  }
}
```

**Los 3 estados de una Promise:**
```
Pending   → Todavia no termino (cargando)
Fulfilled → Termino exitosamente (exito)
Rejected  → Termino con error (fallo)
```

**En el proyecto lo encontraras en:**
- `src/utils/async.js` - fetchWithTimeout, retry, parallel
- `src/services/api.js` - Todas las llamadas a la API usan async/await

**Preguntas de entrevista:**
- Que es una Promise y cuales son sus 3 estados?
- Cual es la diferencia entre `.then()` y `async/await`?
- Que hace `Promise.all()` y `Promise.allSettled()`?

---

## 21. Que es el Hoisting?

**Hoisting** (elevacion) es un comportamiento de JavaScript donde las **declaraciones se "mueven"** al inicio de su ambito (scope) durante la compilacion.

```javascript
// ESTO FUNCIONA (la funcion se "eleva")
console.log(saludar("Juan")); // "Hola Juan"
function saludar(nombre) {
  return `Hola ${nombre}`;
}

// ESTO TAMBIEN FUNCIONA pero es undefined
console.log(miVar); // undefined (no error!)
var miVar = "SmartBank";

// ESTO DA ERROR (let/const no se elevan igual)
// console.log(miLet); // ReferenceError!
let miLet = "SmartBank";
```

**La regla:**
- `function` declarations: Se elevan COMPLETAMENTE (puedes usarlas antes de declararlas)
- `var`: Se eleva la declaration pero NO el valor (queda `undefined`)
- `let` / `const`: Se elevan pero no se pueden usar antes de declararlas (Temporal Dead Zone)

**En el proyecto lo veras en:** `docs/javascript-concepts/CONCEPTS.md`

**Preguntas de entrevista:**
- Que es el hoisting?
- Cual es la diferencia entre `var` y `let` en cuanto a hoisting?
- Que es la Temporal Dead Zone (TDZ)?

---

## 22. Diferencia entre map y forEach

Ambos recorren arrays, pero tienen un proposito diferente.

### `forEach` - Para hacer algo (no retorna nada)
```javascript
const usuarios = ["Juan", "Maria", "Carlos"];

// forEach solo ejecuta una accion por cada elemento
usuarios.forEach(nombre => {
  console.log(`Hola ${nombre}`);
});
// Resultado: imprime en consola, pero el valor de la variable es undefined

const resultado = usuarios.forEach(nombre => nombre);
console.log(resultado); // undefined ← forEach NO retorna nada
```

### `map` - Para transformar (SI retorna un nuevo array)
```javascript
const usuarios = ["Juan", "Maria", "Carlos"];

// map crea un NUEVO array con el resultado de cada iteracion
const saludos = usuarios.map(nombre => `Hola ${nombre}`);
console.log(saludos); // ["Hola Juan", "Hola Maria", "Hola Carlos"]

// El array original NO se modifica
console.log(usuarios); // ["Juan", "Maria", "Carlos"]
```

### Resumen:

| forEach | map |
|---------|-----|
| No retorna nada (`undefined`) | Retorna un nuevo array |
| Para efectos secundarios (logs, guardados) | Para transformar datos |
| No se puede encadenar | Se puede encadenar: `.map().filter().reduce()` |
| `const x = arr.forEach(...)` → `x` es `undefined` | `const x = arr.map(...)` → `x` es un array |

### Ejemplo real en SmartBank:
```javascript
// transformar transacciones para mostrarlas en pantalla
const transaccionesFormateadas = transactions.map(tx => ({
  texto: `${tx.type}: $${tx.amount}`,
  fecha: new Date(tx.date).toLocaleDateString(),
  esIngreso: tx.type === 'deposit'
}));

// Filtrar solo las transferencias
const soloTransferencias = transactions.filter(tx => tx.type === 'transfer');

// Calcular el saldo total
const saldoTotal = accounts.reduce((total, cuenta) => total + cuenta.balance, 0);
```

**Regla simple:** Si necesitas un **nuevo array**, usa `map`. Si solo quieres **hacer algo** con cada elemento, usa `forEach`.

**Preguntas de entrevista:**
- Por que `forEach` no sirve para transformar datos?
- Que otros metodos de array existen? (`filter`, `reduce`, `find`, `some`, `every`)
- Se pueden encadenar metodos de array?

---

## Estructura del Proyecto

```
SmartBank/
├── api/                    # Backend: API REST simulada
│   ├── server.js           # Servidor Express
│   ├── routes/             # Endpoints (GET, POST, PUT, etc.)
│   ├── middleware/          # Auth, validacion, errores
│   ├── models/             # Base de datos en memoria
│   └── seeds/              # Datos de prueba
├── src/                    # Frontend: Vanilla JavaScript
│   ├── components/         # Componentes UI reutilizables
│   ├── pages/              # Paginas de la app
│   ├── services/           # Comunicacion con la API
│   ├── utils/              # Funciones utilitarias
│   ├── store/              # Estado global
│   ├── router/             # Enrutador SPA
│   └── styles/             # CSS
├── implementations/        # Los mismos features en otros frameworks
│   ├── react/
│   ├── vue/
│   ├── angular/
│   ├── lit-element/
│   └── polymer/
├── tests/                  # Pruebas unitarias y de integracion
├── docs/                   # Toda la documentacion educativa
└── .github/                # CI/CD con GitHub Actions
```

---

## Comandos Utiles

```bash
npm install         # Instalar dependencias
npm start           # Iniciar servidor (localhost:3000)
npm run dev         # Iniciar en modo desarrollo
npm test            # Ejecutar pruebas
npm run lint        # Verificar calidad de codigo
npm run lint:fix    # Corregir errores automaticamente
```

---

## Licencia

MIT - Proyecto educativo. Usa libremente para aprender.
