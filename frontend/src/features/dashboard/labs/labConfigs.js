/**
 * Skill Labs configuration: per-technology metadata + exercise libraries.
 *
 * Each tech has the same exercise shape so the LabExperience component can
 * render any tech without branching:
 *   {
 *     id           Unique slug used as the localStorage key suffix
 *     title        Human-readable exercise name
 *     difficulty   "Beginner" | "Intermediate" | "Advanced"
 *     instructions Short paragraph of what to build
 *     starter      Code map keyed by lang ({ html?, css?, js?, jsx? })
 *   }
 *
 * The `langs` field on the tech itself controls which editors show. The
 * `mode` field switches the iframe srcDoc builder ("vanilla" vs "react").
 */

export const LAB_TECHS = {
    html: {
        id: "html",
        label: "HTML",
        title: "HTML Workspace",
        tagline: "Semantic markup, structure, and accessibility",
        description:
            "Build pages with proper structure, semantic elements, and accessible defaults. Pure HTML — no styling, no scripts.",
        difficulty: "Beginner",
        langs: ["html"],
        mode: "vanilla",
        accent: "#f97316", // orange — HTML's classic
    },
    css: {
        id: "css",
        label: "CSS",
        title: "CSS Workspace",
        tagline: "Layout, typography, and responsive design",
        description:
            "Style pre-built HTML with modern CSS. Practice flexbox, grid, custom properties, and responsive breakpoints.",
        difficulty: "Beginner",
        langs: ["html", "css"],
        mode: "vanilla",
        accent: "#2563eb", // blue — CSS3 logo blue
    },
    javascript: {
        id: "javascript",
        label: "JavaScript",
        title: "JavaScript Workspace",
        tagline: "DOM, events, and browser APIs",
        description:
            "Wire interactivity into a page. Practice DOM lookups, event listeners, and common browser APIs.",
        difficulty: "Intermediate",
        langs: ["html", "css", "js"],
        mode: "vanilla",
        accent: "#eab308", // yellow — JS's classic
    },
    react: {
        id: "react",
        label: "React",
        title: "React Workspace",
        tagline: "Components, hooks, and state",
        description:
            "Build small React components with hooks. JSX is compiled in the browser via Babel — same as CodePen/JSFiddle.",
        difficulty: "Intermediate",
        langs: ["jsx", "css"],
        mode: "react",
        accent: "#06b6d4", // cyan — React's classic
    },
};

export const LAB_TECH_ORDER = ["html", "css", "javascript", "react"];

// ─────────────────────────────────────────────────────────────────────────
// Exercise libraries
// ─────────────────────────────────────────────────────────────────────────

const HTML_EXERCISES = [
    {
        id: "semantic-article",
        title: "Semantic article layout",
        difficulty: "Beginner",
        instructions:
            "Compose a blog-post layout using <header>, <article>, <section>, and <footer>. Include an <h1>, a publication date, and at least two paragraphs.",
        starter: {
            html: `<header>\n  <h1>Your Title</h1>\n  <p><time datetime="2026-05-26">May 26, 2026</time></p>\n</header>\n\n<article>\n  <section>\n    <h2>Introduction</h2>\n    <p>Write your opening paragraph here.</p>\n  </section>\n\n  <!-- Add more sections below -->\n</article>\n\n<footer>\n  <p>Written by you.</p>\n</footer>`,
        },
    },
    {
        id: "accessible-form",
        title: "Accessible contact form",
        difficulty: "Beginner",
        instructions:
            "Build a contact form with name, email, and message fields. Every input must have a <label> with a matching `for` attribute. Mark required fields with `required`.",
        starter: {
            html: `<form>\n  <div>\n    <label for="name">Your name</label>\n    <input id="name" name="name" type="text" required>\n  </div>\n\n  <!-- Add email and message fields below -->\n\n  <button type="submit">Send</button>\n</form>`,
        },
    },
    {
        id: "nav-landmark",
        title: "Primary navigation",
        difficulty: "Beginner",
        instructions:
            'Build a primary navigation using <nav> with an unordered list of links. Mark the current page link with `aria-current="page"`.',
        starter: {
            html: `<nav aria-label="Primary">\n  <ul>\n    <li><a href="#home" aria-current="page">Home</a></li>\n    <li><a href="#about">About</a></li>\n    <!-- Add two more links -->\n  </ul>\n</nav>`,
        },
    },
    {
        id: "data-table",
        title: "Data table with headers",
        difficulty: "Intermediate",
        instructions:
            'Build a table of three students with name, batch, and progress. Use <thead>, <tbody>, and <th scope="col">. Add a <caption> describing the table.',
        starter: {
            html: `<table>\n  <caption>Batch 2026-A progress</caption>\n  <thead>\n    <tr>\n      <th scope="col">Name</th>\n      <th scope="col">Batch</th>\n      <th scope="col">Progress</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>—</td>\n      <td>2026-A</td>\n      <td>—</td>\n    </tr>\n    <!-- Add two more rows -->\n  </tbody>\n</table>`,
        },
    },
];

const CSS_EXERCISES = [
    {
        id: "centered-card",
        title: "Center a card",
        difficulty: "Beginner",
        instructions:
            "Center the card both vertically and horizontally in the viewport using flexbox. Round the corners and add a soft shadow.",
        starter: {
            html: `<main>\n  <article class="card">\n    <h2>Welcome</h2>\n    <p>Center me in the viewport.</p>\n  </article>\n</main>`,
            css: `body {\n  font-family: system-ui;\n  min-height: 100vh;\n  margin: 0;\n  background: #f1f5f9;\n}\n\n.card {\n  background: white;\n  padding: 24px;\n  max-width: 320px;\n}\n\n/* Center .card inside <main> */\n`,
        },
    },
    {
        id: "flexbox-columns",
        title: "Three-column flexbox layout",
        difficulty: "Beginner",
        instructions:
            "Lay out three coloured columns side by side. They should wrap onto two rows when the viewport is narrower than ~600px.",
        starter: {
            html: `<section class="row">\n  <div class="col col-a">A</div>\n  <div class="col col-b">B</div>\n  <div class="col col-c">C</div>\n</section>`,
            css: `.row { padding: 24px; gap: 16px; }\n.col {\n  min-height: 120px;\n  display: grid;\n  place-items: center;\n  color: white;\n  font-weight: 600;\n  border-radius: 12px;\n}\n.col-a { background: #0ea5e9; }\n.col-b { background: #22c55e; }\n.col-c { background: #f97316; }\n\n/* Make .row a flexbox with wrapping columns */\n`,
        },
    },
    {
        id: "css-grid-gallery",
        title: "Responsive image grid",
        difficulty: "Intermediate",
        instructions:
            "Build a 3-column grid that becomes 2 columns at ~768px and 1 column at ~480px. Use CSS Grid, not media queries if possible (think `auto-fill`).",
        starter: {
            html: `<section class="gallery">\n  <div class="tile">1</div>\n  <div class="tile">2</div>\n  <div class="tile">3</div>\n  <div class="tile">4</div>\n  <div class="tile">5</div>\n  <div class="tile">6</div>\n</section>`,
            css: `.tile {\n  min-height: 140px;\n  display: grid;\n  place-items: center;\n  background: #e2e8f0;\n  border-radius: 8px;\n  font-weight: 600;\n}\n\n/* Make .gallery a responsive CSS Grid */\n`,
        },
    },
    {
        id: "hover-button",
        title: "Animated button hover",
        difficulty: "Intermediate",
        instructions:
            "Style the button so it lifts slightly on hover and shows a soft shadow underneath. Use `transition` for smoothness.",
        starter: {
            html: `<button class="cta">Click me</button>`,
            css: `body {\n  font-family: system-ui;\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n}\n\n.cta {\n  padding: 12px 20px;\n  border-radius: 8px;\n  border: none;\n  background: #0f172a;\n  color: white;\n  font-weight: 600;\n  cursor: pointer;\n}\n\n/* Add a hover transition that lifts the button */\n`,
        },
    },
];

const JS_EXERCISES = [
    {
        id: "counter",
        title: "Counter with state",
        difficulty: "Beginner",
        instructions:
            "Make the plus/minus buttons mutate the counter. Prevent it from going below 0. Bonus: disable the minus button when at 0.",
        starter: {
            html: `<div class="counter">\n  <button id="minus">−</button>\n  <span id="value">0</span>\n  <button id="plus">+</button>\n</div>`,
            css: `body { font-family: system-ui; display: grid; place-items: center; min-height: 100vh; }\n.counter { display: inline-flex; gap: 16px; align-items: center; font-size: 32px; }\nbutton { width: 48px; height: 48px; border-radius: 9999px; border: 1px solid #e2e8f0; background: white; font-size: 24px; cursor: pointer; }\nbutton:disabled { opacity: 0.4; cursor: not-allowed; }`,
            js: `const value = document.getElementById("value");\nconst plus = document.getElementById("plus");\nconst minus = document.getElementById("minus");\n\nlet n = 0;\n// TODO: wire plus.onclick and minus.onclick\n// TODO: disable minus when n === 0`,
        },
    },
    {
        id: "list-filter",
        title: "Filter a list from input",
        difficulty: "Beginner",
        instructions:
            "Render the array into the <ul>. Filter it as the user types. Show a 'No matches' message when filtered list is empty.",
        starter: {
            html: `<input id="q" placeholder="Search...">\n<ul id="list"></ul>\n<p id="empty" hidden>No matches.</p>`,
            css: `body { font-family: system-ui; padding: 24px; }\n#q { padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; width: 240px; }\nul { margin-top: 12px; padding: 0; list-style: none; }\nli { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }`,
            js: `const items = ["React", "Prisma", "Next.js", "Express", "TailwindCSS", "PostgreSQL"];\nconst list = document.getElementById("list");\nconst empty = document.getElementById("empty");\nconst input = document.getElementById("q");\n\n// TODO: render() that takes a filter string\n// TODO: input event listener that calls render(value)`,
        },
    },
    {
        id: "form-validation",
        title: "Validate an email field",
        difficulty: "Intermediate",
        instructions:
            "On submit, show an inline error if the email is empty or doesn't contain '@'. Show a success message if valid. Don't actually submit.",
        starter: {
            html: `<form id="f">\n  <label for="email">Email</label>\n  <input id="email" type="text">\n  <p id="msg"></p>\n  <button type="submit">Sign up</button>\n</form>`,
            css: `body { font-family: system-ui; padding: 24px; max-width: 360px; }\nlabel { display: block; font-size: 14px; }\ninput { width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #e2e8f0; border-radius: 6px; }\n#msg { margin: 8px 0; min-height: 20px; font-size: 14px; }\n#msg.error { color: #dc2626; }\n#msg.ok { color: #16a34a; }`,
            js: `const form = document.getElementById("f");\nconst email = document.getElementById("email");\nconst msg = document.getElementById("msg");\n\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  // TODO: validate email.value and set msg.textContent + className\n});`,
        },
    },
    {
        id: "local-todo",
        title: "Todo list with localStorage",
        difficulty: "Intermediate",
        instructions:
            "Persist todos to localStorage. Render saved todos on load. Add an input to create new ones and a click-to-delete on each.",
        starter: {
            html: `<form id="f">\n  <input id="t" placeholder="What needs doing?">\n  <button>Add</button>\n</form>\n<ul id="list"></ul>`,
            css: `body { font-family: system-ui; padding: 24px; max-width: 420px; }\nform { display: flex; gap: 8px; }\ninput { flex: 1; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; }\nbutton { padding: 8px 12px; }\nul { margin-top: 16px; list-style: none; padding: 0; }\nli { padding: 6px 0; border-bottom: 1px solid #f1f5f9; cursor: pointer; }`,
            js: `const KEY = "lab-todos-v1";\nconst input = document.getElementById("t");\nconst list = document.getElementById("list");\nconst form = document.getElementById("f");\n\nlet todos = JSON.parse(localStorage.getItem(KEY) || "[]");\n\nfunction save() { localStorage.setItem(KEY, JSON.stringify(todos)); }\nfunction render() {\n  list.innerHTML = "";\n  // TODO: render todos as <li>; click to remove\n}\n\nrender();\n\nform.addEventListener("submit", (e) => {\n  e.preventDefault();\n  // TODO: push trimmed input.value, save, render, clear input\n});`,
        },
    },
];

const REACT_EXERCISES = [
    {
        id: "counter",
        title: "Counter with useState",
        difficulty: "Beginner",
        instructions:
            "Use useState to track the count. Hook up plus/minus buttons. Disable minus when count is 0.",
        starter: {
            jsx: `const { useState } = React;\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="counter">\n      <button\n        onClick={() => setCount(count - 1)}\n        disabled={count === 0}\n      >−</button>\n      <span>{count}</span>\n      <button onClick={() => setCount(count + 1)}>+</button>\n    </div>\n  );\n}\n\nReactDOM.createRoot(document.getElementById("root")).render(<Counter />);`,
            css: `body { font-family: system-ui; display: grid; place-items: center; min-height: 100vh; margin: 0; }\n.counter { display: inline-flex; gap: 16px; align-items: center; font-size: 32px; }\nbutton { width: 48px; height: 48px; border-radius: 9999px; border: 1px solid #e2e8f0; background: white; font-size: 24px; cursor: pointer; }\nbutton:disabled { opacity: 0.4; cursor: not-allowed; }`,
        },
    },
    {
        id: "list-filter",
        title: "Filterable list with map",
        difficulty: "Beginner",
        instructions:
            "Render the items array as a list. Add a search input that filters the rendered items live using useState + array.filter.",
        starter: {
            jsx: `const { useState } = React;\n\nconst ITEMS = ["React", "Prisma", "Next.js", "Express", "Tailwind", "PostgreSQL"];\n\nfunction Filterable() {\n  const [query, setQuery] = useState("");\n  const filtered = ITEMS.filter((i) =>\n    i.toLowerCase().includes(query.toLowerCase())\n  );\n\n  return (\n    <div>\n      <input\n        value={query}\n        onChange={(e) => setQuery(e.target.value)}\n        placeholder="Search..."\n      />\n      <ul>\n        {filtered.map((item) => (\n          <li key={item}>{item}</li>\n        ))}\n      </ul>\n      {filtered.length === 0 ? <p>No matches.</p> : null}\n    </div>\n  );\n}\n\nReactDOM.createRoot(document.getElementById("root")).render(<Filterable />);`,
            css: `body { font-family: system-ui; padding: 24px; }\ninput { padding: 8px 10px; border: 1px solid #e2e8f0; border-radius: 8px; width: 240px; }\nul { margin-top: 12px; padding: 0; list-style: none; }\nli { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }`,
        },
    },
    {
        id: "controlled-form",
        title: "Controlled form with validation",
        difficulty: "Intermediate",
        instructions:
            "Build a sign-up form with email + password fields. Track values with useState. Show an inline error when email is missing '@' or password is shorter than 6 chars. Disable submit until valid.",
        starter: {
            jsx: `const { useState } = React;\n\nfunction SignupForm() {\n  const [email, setEmail] = useState("");\n  const [password, setPassword] = useState("");\n  const [submitted, setSubmitted] = useState(false);\n\n  const emailValid = email.includes("@");\n  const passwordValid = password.length >= 6;\n  const formValid = emailValid && passwordValid;\n\n  const onSubmit = (e) => {\n    e.preventDefault();\n    if (formValid) setSubmitted(true);\n  };\n\n  if (submitted) return <p>Thanks — you're in.</p>;\n\n  return (\n    <form onSubmit={onSubmit}>\n      <label>\n        Email\n        <input value={email} onChange={(e) => setEmail(e.target.value)} />\n      </label>\n      {!emailValid && email.length > 0 ? (\n        <p className="err">Email must contain '@'.</p>\n      ) : null}\n\n      <label>\n        Password\n        <input\n          type="password"\n          value={password}\n          onChange={(e) => setPassword(e.target.value)}\n        />\n      </label>\n      {!passwordValid && password.length > 0 ? (\n        <p className="err">Password must be at least 6 characters.</p>\n      ) : null}\n\n      <button type="submit" disabled={!formValid}>\n        Sign up\n      </button>\n    </form>\n  );\n}\n\nReactDOM.createRoot(document.getElementById("root")).render(<SignupForm />);`,
            css: `body { font-family: system-ui; padding: 24px; max-width: 360px; }\nlabel { display: block; margin-top: 12px; font-size: 14px; }\ninput { display: block; width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #e2e8f0; border-radius: 6px; }\n.err { color: #dc2626; font-size: 13px; margin: 4px 0 0; }\nbutton { margin-top: 16px; padding: 8px 14px; }\nbutton:disabled { opacity: 0.4; cursor: not-allowed; }`,
        },
    },
    {
        id: "useeffect-fetch",
        title: "useEffect with cleanup",
        difficulty: "Intermediate",
        instructions:
            "Build a 'time since mount' counter that updates every second. Use useEffect to start the interval and return a cleanup function that clears it on unmount. Add a toggle button to mount/unmount the component.",
        starter: {
            jsx: `const { useState, useEffect } = React;\n\nfunction Clock() {\n  const [seconds, setSeconds] = useState(0);\n\n  useEffect(() => {\n    const id = setInterval(() => setSeconds((s) => s + 1), 1000);\n    return () => clearInterval(id);\n  }, []);\n\n  return <p>Mounted for {seconds}s</p>;\n}\n\nfunction App() {\n  const [show, setShow] = useState(true);\n  return (\n    <div>\n      <button onClick={() => setShow((v) => !v)}>\n        {show ? "Unmount" : "Mount"}\n      </button>\n      {show ? <Clock /> : null}\n    </div>\n  );\n}\n\nReactDOM.createRoot(document.getElementById("root")).render(<App />);`,
            css: `body { font-family: system-ui; padding: 24px; }\nbutton { padding: 6px 12px; margin-bottom: 12px; }`,
        },
    },
];

export const LAB_EXERCISES = {
    html: HTML_EXERCISES,
    css: CSS_EXERCISES,
    javascript: JS_EXERCISES,
    react: REACT_EXERCISES,
};

export function getTech(techId) {
    return LAB_TECHS[techId] ?? null;
}

export function getExercises(techId) {
    return LAB_EXERCISES[techId] ?? [];
}
