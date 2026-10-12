# Quiz de Personalidad: Descubre tu Perfil de Liderazgo

Aplicación web interactiva basada en el **Test de Liderazgo** (5 situaciones reales) con **5 avatares procedimentales animados** generados con tecnología de **Bible Strong Avatar Lab**.

## 🚀 Inicio Rápido

```bash
cd quiz-liderazgo
pnpm install # o npm install
pnpm dev     # o npm run dev
```

Abre [http://localhost:5174](http://localhost:5174) en tu navegador.

## 🎯 Características

1. **5 Situaciones Reales del Test:**
   - Crisis de entrega con proyecto final.
   - Convocatoria de voluntarios para congreso estudiantil.
   - Manejo de retrasos e incumplimiento en el equipo.
   - Filosofía y mantra de trabajo en equipo.
   - Celebración y evaluación tras el éxito.

2. **5 Arquetipos de Liderazgo con Avatares Vivos:**
   - 🟥 **El Líder Estratégico (Mayoría A):** Avatar **Cubee** (Geométrico, decidido, rojo). Libro: *Extreme Ownership*.
   - 🟦 **El Líder Transformacional (Mayoría B):** Avatar **Nova** (Cápsula cian, futurista e inspirador). Libro: *Start with Why*.
   - 🟧 **El Líder Servicial (Mayoría C):** Avatar **Sunee** (Esfera solar dorada, cálido y protector). Libro: *El arte del liderazgo con empatía*.
   - 🟫 **El Líder Visionario Estratégico (Híbrido A + B):** Avatar **Freddy** (Terracota, audaz y pragmático). Libro: *Measure What Matters / Good to Great*.
   - 🟪 **El Líder Mentor & Catalizador (Híbrido B + C / Balance):** Avatar **Kirby** (Rosa, cercano y formador). Libro: *The Coaching Habit / Dare to Lead*.

3. **Interactividad con Avatares:**
   - Renderizados dinámicamente en SVG mediante el motor procedimental standalone.
   - Parpadeo natural, micro-movimientos y animaciones reactivas (`celebrate`, `happy`, `working`, `proud`, `excited`).
   - Toca el avatar en los resultados para alternar sus emociones.
   - Galería modal para explorar los 5 avatares simultáneamente.

4. **Acciones:**
   - Desglose porcentual detallado de tus decisiones (Resultados vs. Visión vs. Personas).
   - Botón para copiar el diagnóstico completo y compartirlo.
   - Botón para reiniciar el test.

## 🧪 Pruebas Automatizadas

```bash
pnpm test
```
Valida la integridad de las preguntas, datos de avatares, reglas de asignación y cálculo de porcentajes.
