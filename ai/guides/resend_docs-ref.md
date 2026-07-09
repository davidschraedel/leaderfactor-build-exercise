An AI agent sending emails via Resend should treat this brief as its “contract”: if it follows these rules, it will work smoothly and avoid errors.

---

## High-level Overview

- Resend is a REST-only email API with base URL `https://api.resend.com` and **HTTPS is mandatory** (no HTTP). [resend](https://resend.com/docs/api-reference/introduction)
- The main operation is `emails.send`, which accepts traditional `html`/`text` bodies and, in Node.js, a `react` field for React Email components. [resend](https://resend.com/docs/api-reference/emails/send-email)
- Agents can also send via Resend-hosted templates, and must handle one‑click unsubscribe headers for bulk/compliance use cases. [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)

---

## Authentication, Headers, and Rate Limits

- Every request must include `Authorization: Bearer re_xxxxxxxxx` using an API key from the Resend dashboard. [resend](https://resend.com/docs/api-reference/introduction)
- Every request must include a `User-Agent` header (e.g. `User-Agent: my-app/1.0`); omitting it causes `403` with error code 1010 even if the API key is valid. [resend](https://resend.com/docs/api-reference/introduction)
- Default rate limit: **5 requests per second per team**, across all API keys; exceeding this returns `429`. [resend](https://resend.com/docs/api-reference/introduction)

### Status codes

| Status | Meaning for the agent                                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| 200    | Request succeeded; can trust `data` payload. [resend](https://resend.com/docs/api-reference/introduction)                  |
| 400    | Bad input; agent must fix parameters before retrying. [resend](https://resend.com/docs/api-reference/introduction)         |
| 401    | Missing API key; agent should ensure auth configuration. [resend](https://resend.com/docs/api-reference/introduction)      |
| 403    | Invalid key or missing `User-Agent`; fix credentials/headers. [resend](https://resend.com/docs/api-reference/introduction) |
| 404    | Resource not found; check IDs/URLs before retrying. [resend](https://resend.com/docs/api-reference/introduction)           |
| 429    | Rate limit exceeded; back off and retry later. [resend](https://resend.com/docs/api-reference/introduction)                |
| 5xx    | Resend-side issue; agent may retry with backoff. [resend](https://resend.com/docs/api-reference/introduction)              |

---

## `emails.send` Body Shape and Constraints

An agent must construct `emails.send` payloads with these semantics: [resend](https://resend.com/docs/api-reference/emails/send-email)

- **Required fields**
  - `from`: sender address; can include a display name like `Acme <onboarding@example.dev>`. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - `to`: string or string array of recipient addresses, max 50. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - `subject`: email subject line. [resend](https://resend.com/docs/api-reference/emails/send-email)

- **Optional addressing & scheduling**
  - `cc`, `bcc`: string or string array of addresses. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - `reply_to`: string or string array for reply handling. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - `scheduled_at`: natural language (“in 1 min”) or ISO 8601 datetime (`2026-08-05T11:52:01.858Z`) to schedule sending. [resend](https://resend.com/docs/api-reference/emails/send-email)

- **Content fields (mutually constrained)**
  - `html`: HTML body string. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - `text`: plain-text body; if omitted, Resend auto-generates from HTML; if set to `""`, auto-generation is disabled. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - `react`: React component (React.ReactNode) for the message; **only available in the Node.js SDK**. [resend](https://resend.com/docs/api-reference/emails/send-email)

- **Templates vs raw content**
  - `template`: `{ id, variables }` where `id` is a template ID or alias, and `variables` is an object of keys/values used in the template. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - If `template` is provided, **the agent must not send `html`, `text`, or `react` in the same payload**; this causes a validation error. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - Payload values for `from`, `subject`, and `reply_to` override template defaults if provided; if the template lacks defaults, the agent must supply them explicitly. [resend](https://resend.com/docs/api-reference/emails/send-email)

- **Template variable rules**
  - Keys: ASCII letters, digits, underscores only; max 50 characters. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - Reserved variable names (must never be used by the agent): `FIRST_NAME`, `LAST_NAME`, `EMAIL`, `UNSUBSCRIBE_URL`. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - Values: strings (max length 2,000) or numbers (≤ \(2^{53} - 1\)). [resend](https://resend.com/docs/api-reference/emails/send-email)

---

## Attachments, Tags, and Custom Headers

- `attachments`: array of objects, total size ≤ 40MB per email after Base64 encoding. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - Fields: `content` (buffer/Base64 string), `filename`, optional `path`, optional `content_type`, optional `content_id`. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - For inline images, the agent must set `content_id` and reference `src="cid:CONTENT_ID"` in the HTML. [resend](https://resend.com/docs/api-reference/emails/send-email)

- `tags`: array of `{ name, value }` pairs for custom metadata. [resend](https://resend.com/docs/api-reference/emails/send-email)
  - Both `name` and `value` may contain only ASCII letters, digits, underscores, or dashes, max 256 chars each. [resend](https://resend.com/docs/api-reference/emails/send-email)

- `headers`: object of custom headers, used for things like `List-Unsubscribe` and `List-Unsubscribe-Post`. [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)

### Idempotency

- The agent should use the `Idempotency-Key` header to avoid duplicate sends when retrying. [resend](https://resend.com/docs/api-reference/emails/send-email)
- Rules: unique per request, max length 256 characters, expires after 24 hours. [resend](https://resend.com/docs/api-reference/emails/send-email)

---

## React Email + Resend (Node.js path)

When running in Node.js, the simplest integration is to send React components directly: [react](https://react.email/docs/integrations/resend)

- Agent installation assumptions: `resend` and `react-email` packages are installed (`npm install resend react-email`). [react](https://react.email/docs/integrations/resend)
- Agent behavior to send via React:

  ```tsx
  import { Resend } from "resend";
  import { Email } from "./email";

  const resend = new Resend("re_XXXXXXXX");

  await resend.emails.send({
    from: "you@example.com",
    to: "user@gmail.com",
    subject: "hello world",
    react: <Email url="https://example.com" />,
  });
  ```

  [react](https://react.email/docs/integrations/resend)

- Resend automatically renders the React component to HTML and generates a plain text version; the agent doesn’t need to call `render()` explicitly when using `react`. [github](https://github.com/resend/resend-skills/blob/main/skills/react-email/references/SENDING.md)
- The React email component is typically built with `react-email` primitives like `<Html>`, `<Button>`, etc., and lives in `.tsx`/`.jsx` files. [react](https://react.email/docs/integrations/resend)

### When React `react` is not available

- Outside Node.js or with other providers, the agent must manually render React Email components:
  - Use `render()` from `react-email` to generate HTML. [github](https://github.com/resend/resend-skills/blob/main/skills/react-email/references/SENDING.md)
  - Call `render()` again with `{ plainText: true }` to produce a text version. [github](https://github.com/resend/resend-skills/blob/main/skills/react-email/references/SENDING.md)
  - Send via Resend using `html` and `text` fields, or via other providers’ APIs/SMTP. [github](https://github.com/resend/resend-skills/blob/main/skills/react-email/references/SENDING.md)

---

## Resend Templates + React Email

Templates provide a collaboration-friendly workflow; the agent should be aware of the APIs and setup steps: [react](https://react.email/docs/integrations/resend)

- Setup: user runs `npx react-email@latest resend setup`, enters a **Full Access** Resend API key. [react](https://react.email/docs/integrations/resend)
- Upload: user runs React Email locally and uses the “Resend” tab’s **Upload** / **Bulk Upload** to push templates to Resend. [react](https://react.email/docs/integrations/resend)
- Sending with Node SDK using a template:

  ```ts
  await resend.emails.send({
    from: "Acme <onboarding@resend.dev>",
    to: ["user@example.com"],
    subject: "Welcome to Acme",
    template: { id: "1245-1256-1234-1234" },
  });
  ```

  [github](https://github.com/resend/resend-skills/blob/main/skills/react-email/references/SENDING.md)

- Agent rule: when user specifies “use template X”, prefer `template.id` + `variables` over constructing raw HTML, and respect the no-`html`/`text`/`react` with `template` constraint. [github](https://github.com/resend/resend-skills/blob/main/skills/react-email/references/SENDING.md)

---

## Verified Domains and Sender Addresses

- General rule: **always use a verified sending domain** in `from`. The agent should ask for the user’s verified domain and never invent or assume one. [github](https://github.com/resend/resend-skills/blob/main/skills/react-email/references/SENDING.md)
- For bulk sending and compliance, From/Reply-To must not bounce; at least one must accept email even if replies are not monitored. [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)

---

## One-click Unsubscribe and Compliance

For bulk/marketing messages, the agent must add and correctly handle one-click unsubscribe headers: [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)

- Required headers:

  ```
  List-Unsubscribe: <https://example.com/unsubscribe>
  List-Unsubscribe-Post: List-Unsubscribe=One-Click
  ```

  [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)

- Agent-side behavior for the unsubscribe URL:
  - On `POST` requests with `List-Unsubscribe=One-Click`, return a **blank page** with status **200** or **202** (no additional steps or confirmation UI). [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)
  - On direct `GET` requests, display a normal human-readable unsubscribe page. [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)

- In Resend Broadcasts, the agent can avoid managing URLs itself by using the special template variable `{{{RESEND_UNSUBSCRIBE_URL}}}` so Resend auto-handles unsubscribe links and headers. [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)

- Deliverability requirements the agent should keep in mind for high-volume senders:
  - SPF, DKIM, and DMARC must pass; failing them can cause SMTP-level rejections like `550 5.7.515`. [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)
  - Spam complaint rate must stay under 0.3%, matching Google/Yahoo thresholds. [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)

---

## Multi-language SDK Support and Fallback

- Resend offers official SDKs for Node.js, PHP, Python, Ruby, Go, Rust, Java, .NET, plus direct HTTP (curl) and CLI examples; these all share the same `emails.send` semantics. [resend](https://resend.com/docs/api-reference/emails/send-email)
- The `react` field is **exclusive to the Node.js SDK**; in all other languages, the agent must send `html`/`text`. [resend](https://resend.com/docs/api-reference/emails/send-email)
- If the agent is in an environment without a suitable SDK, it should call `POST https://api.resend.com/emails` with JSON payload and proper headers as shown in the curl example. [resend](https://resend.com/docs/api-reference/emails/send-email)

---

## Behavioral Checklist for an AI Agent

Before sending any email, the agent should systematically enforce:

1. **Auth & headers**:
   - Ensure a valid `Authorization: Bearer re_xxxxx` key and a non-empty `User-Agent`. [resend](https://resend.com/docs/api-reference/introduction)
2. **Domain & addresses**:
   - Use a user-provided, verified domain in `from`; ensure From/Reply-To don’t bounce. [github](https://github.com/resend/resend-skills/blob/main/skills/react-email/references/SENDING.md)
3. **Payload consistency**:
   - Choose exactly one of: `{html,text}`, `react`, or `template` (with `variables`), and never mix `template` with `html`/`text`/`react`. [resend](https://resend.com/docs/api-reference/emails/send-email)
4. **Rendering strategy**:
   - In Node.js with Resend: prefer `react` components. [react](https://react.email/docs/integrations/resend)
   - Elsewhere: render React Email with `render()` to HTML/plain text and send via `html`/`text`. [github](https://github.com/resend/resend-skills/blob/main/skills/react-email/references/SENDING.md)
5. **Attachments & tags**:
   - Enforce size and character constraints; use `content_id` for inline images. [resend](https://resend.com/docs/api-reference/emails/send-email)
6. **Compliance**:
   - Add `List-Unsubscribe` and `List-Unsubscribe-Post` headers for bulk mail and wire the unsubscribe URL’s POST/GET behaviors correctly; optionally use `{{{RESEND_UNSUBSCRIBE_URL}}}` for Broadcasts. [resend](https://resend.com/blog/microsoft-bulk-sending-requirements-2025)
7. **Robustness**:
   - Use `Idempotency-Key` on potentially retried sends, and handle `4xx` vs `5xx` codes differently (fix input vs retry/backoff). [resend](https://resend.com/docs/api-reference/introduction)

This brief, applied consistently, gives the agent enough operational detail to integrate with Resend and React Email without surprises or silent deliverability failures.
