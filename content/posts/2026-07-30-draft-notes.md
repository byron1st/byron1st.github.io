---
title: 초고 — 아직 공개하지 않는 메모
summary: draft 필터와 프리렌더 제외를 검증하기 위한 비공개 포스트.
draft: true
---

이 글은 공개 목록·프리렌더·피드에 나타나지 않아야 한다. 본문이 비어 있지 않은 draft 샘플이다.

## 검증 포인트

- `posts`와 `readPostFiles()` 양쪽에서 제외
- `/posts/{slug}` 프리렌더 경로에 포함되지 않음

```txt
draft: true → published set 에서 제외
```

> draft는 작성 중이거나 보류 중인 글의 스위치다.
