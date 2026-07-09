QuickChart is an HTTP image-generation API that renders Chart.js configurations as static chart images, typically consumed via a simple `<img src="https://quickchart.io/chart?...">` URL. To use it smoothly, an agent must reliably construct and encode the chart configuration into the URL, manage key parameters (size, format, devicePixelRatio, version, auth), and understand the Chart.js scatter/dot chart schema. [quickchart](https://quickchart.io/documentation/chart-types/)

## Core concept and workflow

QuickChart exposes a `/chart` endpoint that accepts a Chart.js configuration via query string and returns a chart image (PNG by default). The canonical usage for URL-based embedding is to set the chart config as the `chart` or `c` query parameter and use the URL directly in an `<img>` tag, e.g. `<img src="https://quickchart.io/chart?c={...}">`. [quickchart](https://quickchart.io/documentation/usage/parameters/)

QuickChart is effectively “Chart.js as a rendering service”: all chart structure and styling are defined using the standard Chart.js configuration format, and QuickChart simply renders that configuration into an image. When you need customization beyond basic examples, you consult Chart.js documentation and apply its options in the config you send to QuickChart. [quickchart](https://quickchart.io/documentation/faq/)

## Chart endpoint and core URL parameters

The main endpoint is:

- `https://quickchart.io/chart` for chart images via GET or POST. [quickchart](https://quickchart.io/documentation/usage/post-endpoint/)

For GET-based URL embedding, these are the key query parameters: [quickchart](https://quickchart.io/documentation/usage/parameters/)

| Parameter                 | Required | Default       | Notes                                                                                                                                     |
| ------------------------- | -------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `chart` or `c`            | Yes      | —             | Chart.js config object in JS/JSON; must be encoded (URL or base64). [quickchart](https://quickchart.io/documentation/usage/parameters/)   |
| `width` or `w`            | No       | 500           | Image width in pixels, before multiplying by `devicePixelRatio`. [quickchart](https://quickchart.io/documentation/usage/parameters/)      |
| `height` or `h`           | No       | 300           | Image height in pixels, before multiplying by `devicePixelRatio`. [quickchart](https://quickchart.io/documentation/usage/parameters/)     |
| `devicePixelRatio`        | No       | 2             | Multiplier for width/height for retina; use `1` for exact dimensions. [quickchart](https://quickchart.io/documentation/usage/parameters/) |
| `backgroundColor` / `bkg` | No       | `transparent` | Canvas background; rgb, hex (URL-encoded), hsl, or named colors. [quickchart](https://quickchart.io/documentation/usage/parameters/)      |
| `version` or `v`          | No       | `2.9.4`       | Chart.js version; set to `4` for Chart.js v4 features. [quickchart](https://quickchart.io/documentation/usage/parameters/)                |
| `format` or `f`           | No       | `png`         | Output type: `png`, `webp`, `jpg`, `svg`, `pdf`, or `base64`. [quickchart](https://quickchart.io/documentation/usage/parameters/)         |
| `encoding`                | No       | `url`         | How `chart` is encoded: `url` or `base64`. [quickchart](https://quickchart.io/documentation/usage/parameters/)                            |

For simple usage, you typically just set `c` plus optional `width` and `height`, letting defaults handle other parameters. If you need high-DPI images for retina displays, leave `devicePixelRatio` at 2; if you need the image to match the requested width/height exactly (e.g., for PDFs or strict layout), explicitly set `devicePixelRatio=1`. [quickchart](https://quickchart.io/documentation/usage/parameters/)

## Encoding the chart configuration

The `chart`/`c` parameter contains a Chart.js configuration object and **must be properly encoded** to avoid URL and parser issues. QuickChart recommends URL-encoding the configuration when using GET, since unencoded special characters or whitespace can cause syntax errors or break the query string. [quickchart](https://quickchart.io/documentation/usage/parameters/)

Encoding considerations:

- URL encoding: Build the Chart.js configuration as JSON (or JS object string), then apply `encodeURIComponent` (or equivalent) before putting it into `c=...`. [quickchart](https://quickchart.io/documentation/usage/parameters/)
- Base64 encoding: You may encode the chart config as base64 and set `encoding=base64` if URL encoding is inconvenient, as long as the server knows which encoding you used. [quickchart](https://quickchart.io/documentation/usage/parameters/)
- Hex color values must be URL-encoded (e.g. `#ff00ff` becomes `%23ff00ff`) when placed in query strings. [quickchart](https://quickchart.io/documentation/usage/parameters/)

If configurations grow large (many datasets, plugins, or custom options), URL length can become an issue; in that case, QuickChart recommends switching to a POST request to `/chart` with a JSON body instead of GET, even though the rendering semantics are the same. [quickchart](https://quickchart.io/documentation/usage/post-endpoint/)

## POST vs GET (URL-length and large charts)

Although your primary use case is GET for `<img src="...">`, it’s useful for an agent to know the POST alternative and when to switch: [quickchart](https://quickchart.io/documentation/usage/post-endpoint/)

- The `/chart` POST endpoint accepts the same parameters (`chart`, `width`, `height`, `devicePixelRatio`, `format`, `backgroundColor`, `version`, `key`) as a JSON object in the request body. [quickchart](https://quickchart.io/documentation/usage/post-endpoint/)
- Using POST avoids URL-length limits and removes the need for URL encoding, which is helpful for very complex charts or ones that embed JS functions. [quickchart](https://quickchart.io/documentation/usage/post-endpoint/)
- When including JavaScript code (e.g., label formatters) inside the `chart` configuration, QuickChart notes that you must send `chart` as a string rather than a pure JSON object. [quickchart](https://quickchart.io/documentation/usage/post-endpoint/)

The agent can still ultimately produce a consumable URL (e.g., via short-URL creation described below) even if it initially renders via POST. [quickchart](https://quickchart.io/documentation/usage/short-urls-and-templates/)

## Authentication, rate limits, and short URLs

### Unauthenticated (free) usage

QuickChart’s free tier allows anonymous requests but enforces rate limits of **60 charts per minute (≈1 chart/sec) and 1,000 charts per month** per account, suitable for light or prototype usage. Free-version charts are public domain, meaning you can use generated images for any purpose, but they are subject to community-tier limits. [quickchart](https://quickchart.io/documentation/faq/)

### API keys

When you sign up, you receive an API key and account ID; you can attach `key=YOUR_API_KEY` as a query parameter or include `"key": "YOUR_API_KEY"` in the POST body to bypass standard rate limiting and enable paid-account features. Keys should only be used server-side or with trusted clients, and QuickChart explicitly warns against embedding keys in publicly visible URLs or front-end code. [quickchart](https://quickchart.io/documentation/authentication/)

### Signed URLs for untrusted clients

For untrusted clients (e.g., browsers, emails, shared notebooks), QuickChart supports **signed requests** so you can safely expose render URLs without leaking your API key: [quickchart](https://quickchart.io/documentation/authentication/)

- You compute an HMAC-SHA256 signature over the raw chart (or QR text) using your API key, then send the chart config plus `sig=<signature>` and `accountId=<ACCOUNT_ID>` as query parameters. [quickchart](https://quickchart.io/documentation/authentication/)
- Examples are provided for JavaScript, Python, PHP, Java, C#, Google Sheets, and Excel, demonstrating signing logic and URL construction. [quickchart](https://quickchart.io/documentation/authentication/)
- Charts can render whether or not a key is valid, so to verify successful authentication you check for the `X-quickchart-verified-key` header on responses. [quickchart](https://quickchart.io/documentation/authentication/)

### Short URLs and templates

To generate shorter, shareable URLs (useful for emails, SMS, or external systems that dislike long query strings), QuickChart provides: [quickchart](https://quickchart.io/documentation/usage/short-urls-and-templates/)

- `POST https://quickchart.io/chart/create` with a body identical to the `/chart` POST payload, optionally including `"key": "YOUR_API_KEY"`. [quickchart](https://quickchart.io/documentation/usage/short-urls-and-templates/)
- The response includes a `url` like `https://quickchart.io/chart/render/<id>` which renders the chart and is safe to share with untrusted users; short URLs expire after 6 months. [quickchart](https://quickchart.io/documentation/usage/short-urls-and-templates/)
- Any chart with a short URL can act as a template, which you can customize via template parameters (e.g. `title`, `labels`, `data1`, `data2`, `label1`, `backgroundColor1`, `borderColor1`, etc.) for repeated generation with varying data. [quickchart](https://quickchart.io/documentation/usage/short-urls-and-templates/)

## Scatter / dot chart specifics

QuickChart’s scatter plot type uses Chart.js’s `type: 'scatter'` and expects datasets containing arrays of `{x, y}` point objects. The docs show a canonical example: [quickchart](https://quickchart.io/documentation/chart-types/)

```html
<img
  src="https://quickchart.io/chart?c={
  type:'scatter',
  data:{
    datasets:[{
      label:'Data1',
      data:[
        {x:2,y:4},
        {x:3,y:3},
        {x:-10,y:0},
        {x:0,y:10},
        {x:10,y:5}
      ]
    }]
  }
}"
/>
```

This demonstrates that:

- Each dataset is an object with `label` and `data`, where `data` is an array of `{x, y}` points rather than a simple numeric array. [quickchart](https://quickchart.io/documentation/chart-types/)
- Scatter charts use standard Chart.js axes; you can configure axis types as linear, logarithmic, time, categorical, or radial via the `options.scales` configuration in your Chart.js object. [quickchart](https://quickchart.io/documentation/category/reference/)
- Colors, point styles, and legend behavior are governed by Chart.js options: colors use hex, RGB, or named strings; point markers can be styled globally via `options.elements.point`, and legends via `options.legend` (v2) or equivalent v3+ configs. [quickchart](https://quickchart.io/documentation/category/reference/)

For “dot” charts (discrete points without connecting lines), scatter is the primary Chart.js type; you can also use bubble charts (`type:'bubble'`) where each point includes radius `r` for size, but the underlying pattern (datasets with `{x,y,r}` objects) is similar. [quickchart](https://quickchart.io/documentation/chart-types/)

## Chart.js features and customization via QuickChart

Because QuickChart is built on Chart.js, the customization model is: [quickchart](https://quickchart.io/documentation/category/reference/)

- Axes: Configure axis type, labels, ticks, and time series handling via Chart.js’s axis options (`type`, `ticks`, `time`, etc.), and QuickChart passes these through unchanged. [quickchart](https://quickchart.io/documentation/category/reference/)
- Labels and legends: Axis labels, tick labels, and data labels all come from Chart.js options and plugins (e.g., datalabels), while legends are customized via `options.legend` (v2) or corresponding v3+ configuration. [quickchart](https://quickchart.io/documentation/faq/)
- Colors and styles: Line styles, fill, point styles, and background colors are all string-based (hex, RGB, HSL, named) and controlled using Chart.js dataset and element configuration. [quickchart](https://quickchart.io/documentation/chart-types/)

The FAQ explicitly instructs users to consult Chart.js documentation and use Chart.js-related search terms when customizing charts, reinforcing that all “look and feel” tweaks happen at the Chart.js config layer that QuickChart renders. [quickchart](https://quickchart.io/documentation/faq/)

## Reliability, usage patterns, and plan considerations

QuickChart is positioned as a drop-in replacement for the discontinued Google Image Charts API, intended for static chart images in contexts where interactive JS charts aren’t possible (e.g., emails, PDFs, Slack messages). The service reportedly generates over 300 million charts per month and is hosted on a redundant cluster, but free users are limited by built-in rate limits as noted above. [lava](https://www.lava.so/docs/gateway/providers/quickchart)

The docs emphasize that paid plans can adjust rate limits and provide SLAs with uptime guarantees, and encourage developers to prefer open-source solutions like Chart.js/QuickChart over proprietary APIs to mitigate long-term risk. [quickchart](https://quickchart.io/documentation/faq/)

## Practical implementation guidelines for an AI agent

For a robust, error-free integration, an AI agent should follow these practices derived from the docs:

- **Always build a valid Chart.js configuration object** (matching Chart.js specs) and then serialize it to a string (e.g., JSON) before encoding into the `c`/`chart` parameter. [quickchart](https://quickchart.io/documentation/faq/)
- **Apply the correct encoding**: URL-encode the configuration (recommended for GET) or base64-encode it with `encoding=base64`, and ensure hex colors are encoded (`#` → `%23`). [quickchart](https://quickchart.io/documentation/usage/parameters/)
- **Respect defaults but override deliberately**: explicitly set `width`, `height`, and `devicePixelRatio` when layout matters, especially setting `devicePixelRatio=1` if consuming systems expect exact pixel dimensions. [quickchart](https://quickchart.io/documentation/usage/parameters/)
- **Use scatter schema for dot charts**: represent each point as `{x, y}` inside `datasets[].data` when `type:'scatter'`, and configure axes, legends, and colors via Chart.js options. [quickchart](https://quickchart.io/documentation/category/reference/)
- **Avoid leaking credentials**: use `key` only in server-side contexts or signed URLs (`sig`, `accountId`) for untrusted clients, and generate short URLs via `/chart/create` when you want compact, shareable links. [quickchart](https://quickchart.io/documentation/authentication/)
- **Handle large configs with POST when needed**: if the chart configuration becomes too long for URLs or must embed JS functions, switch to a POST request with a JSON body to `/chart`. [quickchart](https://quickchart.io/documentation/usage/post-endpoint/)
- **Stay within rate limits and check headers**: be aware of free-tier limits and, when using keys, verify successful authentication via the `X-quickchart-verified-key` header on responses. [quickchart](https://quickchart.io/documentation/faq/)

With these rules and parameter details, an agent can programmatically construct QuickChart URLs for scatter/dot charts and other types, embed them as `<img>` sources, and avoid common pitfalls related to encoding, dimensions, authentication, and rate limiting. [quickchart](https://quickchart.io/documentation/chart-types/)
