# Skuse UI

> Pronounced "skews" `/skjuːz/`

A modern, beautiful alternative to Swagger UI — fully compatible with the OpenAPI 3.0 and 3.1 specification.

## Installation

```bash
npm install skuse-ui
# or
pnpm add skuse-ui
```

## Usage

```tsx
import { SkuseDocumentation } from 'skuse-ui';
import 'skuse-ui/style.css';

export default function App() {
    return (
        <SkuseDocumentation openApiUrl="https://your-api.com/openapi.json" />
    );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `openApiUrl` | `string` | — | URL of the OpenAPI JSON/YAML spec to load |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |

## Features

- **Reference** — browse endpoints grouped by tags, with parameters, request bodies, response schemas, example values and code snippets in 15 languages
- **Try It** — interactive playground to send real requests, with auth injection, live URL preview, copy cURL and a response viewer
- **Models** — standalone schema browser
- **Webhooks** — OAS 3.1 webhooks support
- **Light / dark mode**

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
