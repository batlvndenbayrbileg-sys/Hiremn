# AI Дүн шинжилгээ товч — hire.mn integration

## Танилцуулга

Тестийн тайлангийн хуудсанд дөрөв дэх товч нэмж, дарагдахад тухайн хэрэглэгчийн тайланг AI-р задлан шинжлүүлж, чатбот дээр зөвлөмж/feedback-ийг харуулах боломжтой.

## Шаардлага

`embed.js` нь тухайн хуудсанд аль хэдийн ачаалагдсан байх ёстой:

```html
<script src="https://YOUR-WIDGET-DOMAIN/embed.js" async></script>
```

Уг скрипт ачаалагдмагц `window.HireMnChat` API дотор шинээр **`analyzeReport(code)`** метод бэлэн болно.

## Хамгийн энгийн хувилбар

Одоо байгаа 3 товчны хажууд 4 дэх товч нэмнэ:

```html
<button
  type="button"
  id="hiremn-ai-analyze-btn"
  onclick="window.HireMnChat.analyzeReport('<EXAM_CODE_HERE>')"
  style="
    background: linear-gradient(135deg, #E8541A, #FF8C42);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 12px 20px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  "
>
  ✨ AI-аар дүн шинжилгээ хийлгэх
</button>
```

`<EXAM_CODE_HERE>` хэсэгт тухайн тайлангийн `code`-ыг сэргээгээрэй (PDF татах товч аль `code`-ыг ашигладаг бол ижил утга).

## React/Next.js хувилбар

```tsx
<button
  onClick={() => window.HireMnChat?.analyzeReport(examCode, {
    token: userToken, // нэвтэрсэн хэрэглэгчийн JWT (хэрэгтэй бол)
  })}
  className="ai-analyze-btn"
>
  ✨ AI-аар дүн шинжилгээ хийлгэх
</button>
```

## API дэлгэрэнгүй

```js
window.HireMnChat.analyzeReport(code, options?)
```

| Параметр | Төрөл | Заавал | Тайлбар |
|---|---|---|---|
| `code` | string | ✅ | Тестийн `code` (одоогийн PDF татах товчинд ашигладаг ижил утга) |
| `options.token` | string | ❌ | JWT — хувийн endpoint руу нэвтрэхэд хэрэглэнэ |
| `options.apiBase` | string | ❌ | `https://api.hire.mn` (default) |
| `options.testName` | string | ❌ | Тестийн нэр гараар өгөх бол |
| `options.prompt` | string | ❌ | Custom AI prompt |
| `options.headers` | object | ❌ | Нэмэлт HTTP header-үүд |

Метод нь:

1. Чатбот цонхыг нээнэ
2. "Тайлангаа AI-д шилжүүлж байна..." гэсэн loading мессеж харуулна
3. `GET /api/v1/exam/exam/{code}` болон `GET /api/v1/userAnswer/code/code/{code}` endpoint-ууд руу зэрэгцүүлэн хүсэлт явуулна
4. Хариуг chatbot руу `HIREMN_AI_ANALYSIS` post message-аар дамжуулна
5. AI нь дүгнэлт, давуу/сул тал, практик зөвлөмж, дараагийн алхмыг гаргана

## Жишээ — бүрэн интеграц

```html
<!-- Тайлангийн хуудасны action товчны блок -->
<div class="report-actions">
  <button onclick="downloadPDF(code)">📄 PDF татах</button>
  <button onclick="sharePDF(code)">🔗 Хуваалцах</button>
  <button onclick="emailPDF(code)">✉️ Имэйлээр илгээх</button>

  <!-- Шинээр нэмэх товч -->
  <button onclick="window.HireMnChat.analyzeReport(code, { token: userToken })">
    ✨ AI-аар дүн шинжилгээ хийлгэх
  </button>
</div>
```

## Анхаарах зүйлс

- `embed.js` ачаалагдсан эсэхийг шалгахын тулд `window.HireMnChat`-ийг шалгаарай:
  ```js
  if (window.HireMnChat) window.HireMnChat.analyzeReport(code);
  ```
- CORS — `api.hire.mn` нь `hire.mn` болон widget origin-аас ирсэн request-ийг зөвшөөрсөн байх ёстой.
- Нэвтрэлт шаардлагатай endpoint бол `options.token` дамжуулаарай. Одоо байгаа cookie-based session ажиллах бол `credentials: "include"` дотор нь автоматаар тохируулсан.
