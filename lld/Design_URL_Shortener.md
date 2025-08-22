# LLD: URL Shortener

## Requirements
- Create short link -> long link
- Redirect short -> long
- TTL and analytics (clicks)

## Classes
- UrlService
- CodeGenerator (Base62)
- Repository (KV or SQL)
- RedirectController

## Database
```
TABLE urls (
  code VARCHAR(10) PRIMARY KEY,
  long_url TEXT NOT NULL,
  created_at TIMESTAMP,
  ttl_seconds INT,
  clicks INT DEFAULT 0
)
```

## Flow
1. POST /shorten -> generate code, persist
2. GET /:code -> lookup, increment clicks, 301 redirect

## Code Sketch
```java
class CodeGenerator {
  String alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  String encode(long n) { /* ... */ return ""; }
}
```
