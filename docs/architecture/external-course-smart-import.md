# External Course Smart URL Import Architecture

## 1. Overview & New Workflow
The Smart External Course URL Import feature streamlines the curation of high-quality external educational content into the AI Club recommendation catalog. Instead of tedious manual data entry, admins paste a course URL from an approved learning platform. The backend fetches the course page securely, extracts structured and semi-structured metadata deterministically, and presents an editable preview card. Admins review, adjust, and save the course as a **DRAFT**. Once approved, the admin explicitly publishes the course, making it available to the AI recommendation engine.

```
Admin Pastes Course URL
       │
       ▼
Backend SSRF Guard & Domain Allowlist Validation (DNS check, Private IP rejection)
       │
       ▼
Safe HTTP Fetcher (GET, 8s timeout, 1.5MB max payload, strict redirect verification)
       │
       ▼
Multi-Tier Metadata Extractor Engine
  ├── Tier 1: JSON-LD (schema.org/Course)
  ├── Tier 2: Open Graph (og:title, og:description, og:image, og:url)
  ├── Tier 3: Semantic HTML (<title>, meta description)
  └── Tier 4: Provider-Specific Heuristics (Coursera, freeCodeCamp, Udemy, Unstop)
       │
       ▼
Duplicate Course Detection (provider + official canonical URL)
       │
       ▼
Admin Preview Card (Editable title, category, difficulty, skills, description)
       │
       ▼
Save as DRAFT (Status: draft, published_at: null)
       │
       ▼
Admin Explicit Publish (Status: published, published_at: now())
       │
       ▼
AI Recommendation Engine (Personalized member discovery)
```

---

## 2. Supported Providers & Domain Allowlist
The extraction engine utilizes a provider abstraction (`CourseExtractor` interface) and provider registry (`CourseExtractorRegistry`), allowing new educational platforms to be plugged in without hardcoding.

| Provider | Key | Domain Allowlist | Primary Extractor Strategy |
| :--- | :--- | :--- | :--- |
| **Coursera** | `COURSERA` | `coursera.org`, `www.coursera.org` | JSON-LD schema.org/Course, Coursera hero selectors, skills breakdown |
| **freeCodeCamp** | `FREECODECAMP` | `freecodecamp.org`, `www.freecodecamp.org` | Open Graph, curriculum headers, free-tier price model |
| **Udemy** | `UDEMY` | `udemy.com`, `www.udemy.com` | JSON-LD schema.org/Course, lead title, rating, course metadata |
| **Unstop** | `UNSTOP` | `unstop.com`, `www.unstop.com` | Open Graph, course/workshop header selectors, category taxonomy |
| **Generic Fallback** | `EDX`, `KAGGLE`, `GOOGLE`, `MICROSOFT`, `AWS`, `NVIDIA`, etc. | Verified provider domains in `PROVIDER_DOMAIN_ALLOWLIST` | Standardized JSON-LD + Open Graph + HTML title fallback |

---

## 3. Security & SSRF Protection
Fetching external URLs provided by administrative users poses Server-Side Request Forgery (SSRF) risks. The AI Club backend enforces multiple layers of defense:

1. **Strict Protocol Enforcement**: Only `https://` URLs are accepted. `http://`, `file://`, `ftp://`, `javascript:`, and `data:` schemes are strictly rejected.
2. **Domain Allowlist Validation**: The hostname must match or be a subdomain of an explicitly approved provider domain.
3. **Internal Hostname & IP Filtering**:
   - Loopback (`localhost`, `127.0.0.1/8`, `::1`)
   - RFC 1918 Private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - Cloud provider link-local metadata endpoints (`169.254.169.254`, `169.254.0.0/16`)
   - Carrier-grade NAT (`100.64.0.0/10`)
   - Multicast, broadcast, and documentation addresses (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`)
4. **DNS Rebinding Prevention**: Hostnames are resolved via Node.js DNS lookup before fetching. All resolved addresses are checked against private IP filters.
5. **Safe HTTP Fetching Parameters**:
   - Timeout: 8,000 ms
   - Maximum Payload Size: 1.5 MB (enforced on content length and streaming byte array buffer)
   - Redirect Limits: Maximum 3 hops; every redirect target is re-validated through the full SSRF guard and domain allowlist before execution.
   - Content-Type Verification: Rejects non-HTML media (video, binaries, PDFs).

---

## 4. Multi-Tier Extraction Strategy
The extractor avoids brittle scraping and prioritizes machine-readable structured metadata:

1. **Level 1 (JSON-LD)**: Checks `<script type="application/ld+json">` for `@type === 'Course'`. Extracts `name`, `description`, `provider`, `image`, and `url`.
2. **Level 2 (Open Graph)**: Inspects `meta[property="og:title"]`, `meta[property="og:description"]`, `meta[property="og:image"]`.
3. **Level 3 (HTML Semantic Fallback)**: Extracts `<title>` (cleans trailing provider branding suffixes like `| Coursera` or `- Udemy`) and `<meta name="description">`.
4. **Level 4 (Provider Heuristics)**: Parses provider-specific DOM selectors for tags, skills, and ratings where available.

### Partial Extraction & No Hallucinations
- Missing fields return `null` or empty arrays; the system never fabricates or hallucinate descriptions, images, categories, or difficulty levels.
- Gemini AI is **not** required for extraction. The process is deterministic, fast (<2s), low-cost, and predictable.

---

## 5. Duplicate Detection
Before saving, the system queries existing courses using `official_url = canonicalUrl`. If a course already exists:
- The extraction preview flags `alreadyExists: true` and displays `existingCourse` details (Title, Provider, Status).
- The admin is alerted with a direct link to view the existing course record.

---

## 6. Admin Review, Draft & Publishing Lifecycle
1. **Extraction Preview**: The extracted metadata is presented in an interactive card. The official URL is locked and verified.
2. **Manual Overrides**: The admin can freely edit title, description, category, difficulty, price model, skills, and image URL.
3. **Draft First**: Saving creates an `external_courses` record with `status: 'draft'` and `published_at: null`.
4. **Explicit Publish**: An explicit publish action transitions status to `'published'`, timestamps `published_at`, and activates the course for candidate retrieval by the AI recommendation engine.

---

## 7. Authorization & Rate Limiting
- **Authorization**: Protected by `authenticate` and `requireRole(['admin'])`. Non-admin requests (Members, Applicants) receive HTTP 403 `FORBIDDEN`.
- **Rate Limiting**: `extractionRateLimiter` enforces a 30 requests/minute ceiling per admin user/IP.

---

## 8. Audit Logging Events
Every action emits a structured audit log:
- `COURSE_METADATA_EXTRACTION_STARTED`
- `COURSE_METADATA_EXTRACTION_COMPLETED`
- `COURSE_METADATA_EXTRACTION_FAILED`
- `EXTERNAL_COURSE_CREATED`
- `EXTERNAL_COURSE_UPDATED`
- `EXTERNAL_COURSE_PUBLISHED`
