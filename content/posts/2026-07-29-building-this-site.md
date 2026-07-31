---
title: 이 사이트를 만든 기록
summary: 텍스트 우선 미니멀 정적 사이트를 React Router 8 SSG로 구성하면서 스택을 고른 이유.
---

개인 사이트를 다시 만들 때 가장 먼저 정한 원칙은 **읽기 쉬운 텍스트**와 **빌드 타임 결정**이었다. 런타임 서버, CMS, 외부 요청은 넣지 않기로 했다.

## 왜 정적 사이트인가

이력과 글은 자주 바뀌지 않는다. 매 요청마다 렌더할 이유가 없고, GitHub Pages에 HTML을 올리는 편이 운영 비용이 없다.

> 잘못된 콘텐츠는 프로덕션에 도달하기 전에 빌드를 끊어야 한다.

이 전제 때문에 YAML과 Markdown은 모두 스키마·파일명 규칙으로 검증하고, 실패하면 경로를 포함한 메시지로 중단한다.

## 스택 선택

프레임워크는 React Router 8 framework mode(`ssr: false` + `prerender`)를 골랐다. 페이지는 React로 조립하되, 산출물은 정적 HTML이다.

```ts
export default {
  appDirectory: "src",
  buildDirectory: "dist",
  ssr: false,
  prerender: ["/"],
};
```

콘텐츠는 역할별로 나눴다. 구조화 데이터는 YAML, 장문은 Markdown. Markdown은 Vite plugin이 `{ meta, html }` 모듈로 바꾸고, 목록 메타만 eager로 모아 인덱스 번들에 본문이 섞이지 않게 했다.

## 남기지 않은 것

신택스 하이라이팅, HTML sanitize, i18n, 애니메이션은 의도적으로 빼 두었다. 지금 필요한 것은 글이 잘 읽히는 정적 페이지뿐이고, 그 이상은 글이 쌓인 뒤에 다시 보면 된다.
