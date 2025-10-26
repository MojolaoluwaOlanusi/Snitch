# Snitch Frontend Devtools - API Logger

## How to use
1. Start the frontend (Vite):
   ```
   cd frontend
   npm ci
   npm run dev
   ```

2. Open your browser with developer logging enabled:
   ```
   http://localhost:5173/?devlog=true
   ```

3. Use the app; API calls will be logged to the console and saved in localStorage (key: `snitchApiLogs`).

## Exporting logs
- Auto-export by visiting:
  ```
  http://localhost:5173/?devlog=true&exportLogs
  ```
  This will download `snitch_api_logs.json` automatically.

- Manual export:
  Open the console and run:
  ```
  window.exportSnitchLogs()
  ```

## Clearing logs
Run:
```
window.clearSnitchLogs()
```

## Notes
- The logger intercepts `fetch`, `XMLHttpRequest`, and `axios` if axios is present on `window`.
- The logger only activates when the `devlog=true` query parameter is present.


## Export via UI button
When `?devlog=true` is present the floating **Export Logs** button appears in the bottom-right. Click it to download logs.
