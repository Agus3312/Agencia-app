# Agencia Admin Dashboard - Documentación

## 📋 Estructura del Proyecto

```
AppWeb/
├── index.html                 # Página principal (punto de entrada)
├── 
├── css/
│   ├── global.css            # Estilos globales y utilidades
│   ├── components.css        # Estilos de componentes reutilizables
│   └── theme.css             # Configuración de tema y variables
│
├── js/
│   ├── app.js                # Punto de entrada de la aplicación
│   ├── router.js             # Sistema de navegación SPA
│   │
│   ├── components/
│   │   ├── sidebar.js        # Componente de navegación lateral
│   │   └── header.js         # Componente del encabezado
│   │
│   └── utils/
│       └── helpers.js        # Funciones auxiliares reutilizables
│
├── pages/
│   ├── dashboard.html        # Dashboard principal
│   ├── admin.html            # Admin View (Developer Portal)
│   ├── teams.html            # Team Management
│   ├── projects.html         # Proyectos (placeholder)
│   ├── reports.html          # Reportes (placeholder)
│   └── settings.html         # Configuración (placeholder)
│
└── assets/                   # Recursos (imágenes, etc.)
```

## 🚀 Características Principales

### 1. **Navegación Dinámica (SPA)**
- Router basado en hash (#dashboard, #admin, #teams, etc.)
- Carga dinámica de páginas sin recargar
- Caché de páginas para mejor rendimiento
- Navegación instántanea entre secciones

### 2. **Componentes Modulares**
- **Sidebar**: Navegación persistente con menú dinámico
- **Header**: Barra superior con búsqueda, notificaciones y botones de acción
- Componentes reutilizables a través de CSS

### 3. **Sistema de Temas**
- Soporte para tema oscuro/claro
- Variables CSS globales
- Transiciones suaves

### 4. **Optimizaciones**
- CSS separado por módulo (global, components, theme)
- JavaScript modular sin dependencias externas
- Preload de páginas frecuentes
- Caché local para mejor rendimiento

## 🎯 Páginas Disponibles

| Ruta | Título | Descripción |
|------|--------|-------------|
| `#dashboard` | Project Dashboard | Dashboard principal con métricas y proyectos activos |
| `#admin` | Admin View | Portal para desarrolladores con proyectos asignados |
| `#teams` | Team Management | Gestión de equipos con tarjetas de miembros |
| `#projects` | All Projects | Página de proyectos (en construcción) |
| `#reports` | Reports | Analytics y reportes (en construcción) |
| `#settings` | Settings | Configuración (en construcción) |

## 📦 Dependencias

- **Tailwind CSS** (CDN) - Framework de utilidades CSS
- **Google Fonts** - Tipografía Inter
- **Material Icons** - Iconos Material Symbols

## 🔧 Cómo Usar

### Navegación Programática
```javascript
// Navegar a una página
Router.goTo('dashboard');
Router.goTo('teams');
Router.goTo('admin');
```

### Agregar una Nueva Página

1. **Crear archivo HTML** en `pages/nueva-pagina.html`
```html
<div class="flex flex-col h-full overflow-y-auto">
    <!-- Contenido aquí -->
</div>
```

2. **Registrar en router.js**
```javascript
routes: {
    'nueva-pagina': {
        path: 'pages/nueva-pagina.html',
        title: 'Título de la Página'
    }
}
```

3. **Agregar al sidebar** en `js/components/sidebar.js`
```javascript
pages: [
    // ... otros items
    {
        id: 'nueva-pagina',
        title: 'Nueva Página',
        icon: 'icon_name',
        icon_name: 'Descripción del icono'
    }
]
```

## 🎨 Customización

### Cambiar colores
Editar `css/theme.css`:
```css
:root {
    --primary: #1d3faf;
    --background-dark: #0f172a;
    /* ... más variables */
}
```

### Agregar estilos globales
Agregar a `css/global.css`

### Estilos de componentes
Crear estilos en `css/components.css`

## 💡 Funciones Auxiliares Disponibles

Importadas desde `js/utils/helpers.js`:

```javascript
Helpers.formatDate(date)          // Formatear fecha
Helpers.capitalize(str)           // Capitalizar texto
Helpers.truncate(str, length)     // Truncar texto
Helpers.getInitials(name)         // Obtener iniciales
Helpers.debounce(func, wait)      // Función debounce
Helpers.throttle(func, limit)     // Función throttle
Helpers.getStorageItem(key)       // LocalStorage getter
Helpers.setStorageItem(key, val)  // LocalStorage setter
// ... y más
```

## 🔄 Flujo de Carga

1. **index.html** carga los scripts y CSS
2. **helpers.js** proporciona utilidades
3. **sidebar.js** renderiza la navegación
4. **header.js** renderiza el encabezado
5. **router.js** inicializa el ruteo
6. **app.js** inicializa la aplicación completa

## 📱 Responsive Design

La aplicación es completamente responsive:
- Tailwind CSS para mobile-first
- Grid adaptive
- Sidebar colapsable en móvil
- Menús adaptativos

## 🐛 Debugging

Activar modo debug en `js/app.js`:
```javascript
const App = {
    debug: true // Ver logs en consola
}
```

## 📝 Notas Importantes

- Todas las páginas usan Tailwind CSS (CDN)
- Sin dependencias npm requeridas
- Funciona con un simple servidor HTTP
- Compatible con navegadores modernos

## 🚀 Próximas Mejoras

- [ ] Sistema de autenticación
- [ ] Base de datos integrada
- [ ] Gráficos y analytics
- [ ] Notificaciones en tiempo real
- [ ] Exportar reportes
- [ ] API integration

---

**Versión:** 1.0.0  
**Última actualización:** 2024
