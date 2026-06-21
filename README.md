# Skuse UI

> Pronounced "skews" `/skjuːz/`

A modern, beautiful alternative to Swagger UI — fully compatible with the OpenAPI 3.0 and 3.1 specification.

## Features

### Reference

- **Endpoint browser** — grouped by tags, with method badges, path, summary and deprecation status
- **Parameters** — path, query, header and cookie params with types, constraints, enums and descriptions
- **Request body** — schema viewer with nested properties, composition keywords (`allOf`, `oneOf`, `anyOf`), `discriminator`, `not`, and full OAS 3.1 support (`prefixItems`, `if/then/else`, `unevaluatedProperties`, `contains`…)
- **Responses** — per-status-code schemas, headers, response links and example values
- **Code examples** — generated snippets in multiple languages and variants (powered by Postman code generators)
- **Webhooks** — dedicated viewer for OAS 3.1 webhooks
- **Models** — standalone schema browser
- **Servers** — server selection with variable substitution

### Try It (Playground)

- **Live URL preview** — computed in real time as you fill in params
- **Path / query / header params** — input fields with type badges; enum values render as a `<select>`; optional params can be toggled on/off via a switch
- **Default values** — pre-filled from `schema.default` or from single-value enums
- **Request body** — pre-filled from spec examples; JSON formatter button; content-type selector
- **Authentication** — Bearer, Basic, API Key, OAuth2 and OpenID Connect credentials injected automatically
- **CORS proxy** — requests are routed through [proxy.scalar.com](https://github.com/scalar/scalar/tree/main/projects/proxy-scalar-com) so browser CORS restrictions don't block calls to external APIs
- **Copy cURL** — one-click copy of the equivalent cURL command
- **Response panel** — status code, timing, body size, response headers, syntax-highlighted body; unexpected status codes are flagged

### UI

- Light / dark mode
- Sticky endpoint header with Reference / Try It tab toggle
- Collapsible schema properties with expand-all for long code blocks (scroll after 20 lines)
- Markdown rendering throughout (descriptions, external docs…)
- Responsive sidebar

## Stack

- **React 18** + **TypeScript 5** + **Vite 5**
- **TailwindCSS** + **shadcn/ui** (Radix UI primitives)
- **TanStack Router**
- **@uiw/react-markdown-preview** for Markdown
- **postman-code-generators** for code snippets

## Project Status

Under active development — no public release yet.

## Acknowledgements

The API playground routes requests through [Scalar's open-source proxy](https://github.com/scalar/scalar/tree/main/projects/proxy-scalar-com) (`proxy.scalar.com`) to handle cross-origin requests from the browser. Thanks to the Scalar team for building and hosting it!

## Why "Skuse"?

The name is inspired by [this iconic viral moment](https://www.instagram.com/p/C7rs1Bit36b/) from French comedy legend Laurent Baffie.

## License

[MIT License](LICENSE)

---

<div style="text-align: center">
Made with ❤️ by the Skuse team
</div>
