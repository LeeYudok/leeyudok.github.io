---
author: leeyudok
pubDatetime: 2026-08-26T09:36:18+09:00
title: SonarQube는 리팩토링을 안 한다 — 근거와 추측 구분하기
featured: false
draft: false
category: dev
cover: "@/assets/images/dev/sonarqube-refactoring-cover.png"
tags:
  - refactoring
  - sonarqube
  - legacy-code
  - static-analysis
description: 정적분석 도구는 문제를 찾을 뿐 고치지 않는다. 레거시 리팩토링 방법론을 출처가 확인되는 것과 추측으로 나눠 정리했다.
canonicalURL: https://blog.naver.com/diablodok/224390524880
lang: ko
---

![SonarQube는 리팩토링을 안 한다 — 근거와 추측 구분하기](@/assets/images/dev/sonarqube-refactoring-cover.png)

정적분석 도구를 들여놓는다고 리팩토링이 되지는 않는다. SonarQube는 문제를 찾아 점수를 매긴다. 코드를 고치는 일은 사람이나 AI가 한다.

이 글은 대용량·레거시 코드베이스의 리팩토링 방법론을 두 가지로 나눈다. 출처를 확인한 것과, 확인 없이 일반화한 추측이다.

## SonarQube가 하는 일과 하지 않는 일

| 하는 일 | 하지 않는 일 |
|---|---|
| 코드 스멜, 중복, 복잡도, 보안 핫스팟 탐지 | 실제 코드 수정 |
| Quality Gate로 머지 차단 | 아키텍처 판단 |
| 우선순위 후보 목록 제공 | 비즈니스 로직 이해 |
| | 테스트 없는 곳의 안전한 변경 |

왼쪽은 규칙 기반 정적분석의 표준 기능이다. 오른쪽은 판단과 실행이 필요해서 도구가 대신하지 못한다.

## 출처가 확인되는 방법론

아래 다섯 가지는 책이나 논문으로 출처를 확인할 수 있다.

1. **특성화 테스트(characterization test)부터 쓴다.** 레거시 코드는 고치기 전에 현재 동작을 테스트로 고정한다. Michael Feathers의 『Working Effectively with Legacy Code』(2004)가 제시한 개념이다.
2. **Strangler Fig 패턴.** 레거시를 한 번에 바꾸지 않는다. 새 구현으로 조금씩 옮긴 뒤 옛 구현을 걷어 낸다. Martin Fowler가 이름을 붙였다. [StranglerFigApplication](https://martinfowler.com/bliki/StranglerFigApplication.html)
3. **구글의 모노레포와 빌드 그래프.** 코드 전체를 저장소 하나에 두고 빌드 그래프로 영향 범위를 추적한다. [Why Google Stores Billions of Lines of Code in a Single Repository](https://research.google/pubs/why-google-stores-billions-of-lines-of-code-in-a-single-repository/)(Communications of the ACM, 2016)
4. **Tricorder.** 구글이 코드 리뷰에 붙여 쓰는 정적분석 플랫폼이다. [Tricorder: Building a Program Analysis Ecosystem](https://research.google/pubs/tricorder-building-a-program-analysis-ecosystem/)(ICSE, 2015)
5. **ClangMR과 Rosie.** API가 바뀔 때 많은 호출부를 도구로 한꺼번에 바꾼다. ClangMR은 [Large-Scale Automated Refactoring Using ClangMR](https://research.google/pubs/large-scale-automated-refactoring-using-clangmr/)(2013)에 나온다. 큰 변경을 나눠 리뷰에 올리는 Rosie는 위 3번 논문에 나온다.

네이버 블로그에 올린 원문에는 Tricorder 논문이 2017년으로 적혀 있었다. 구글 리서치 페이지에서 2015년으로 확인해 고쳤다.

## 확인 없이 일반화한 것

국내 대기업의 내부 리팩토링 절차는 대부분 공개돼 있지 않다. 네이버, 카카오, 라인, 쿠팡, 배달의민족이 그렇다. 그래서 "네카라쿠배도 이렇게 한다"는 말은 업계 일반론에 회사 이름을 붙인 추측이다.

특정 회사가 쓰는 도구 이름이나 "레거시 자바를 코틀린으로 옮기는 쪽을 선호한다" 같은 세부 내용도 같다. 공개 사례를 찾아 확인한 것이 아니면 추측이다. 따로 검증해야 한다.

이 구분이 필요한 이유는 AI에게 물었을 때 두 종류가 같은 말투로 섞여 나오기 때문이다. 출처를 요구하면 걸러진다.

## 규모와 무관하게 같은 순서

자동화 수준은 구글과 대다수 조직이 크게 다르다. 그러나 순서는 같다.

1. **식별**: 정적분석으로 복잡도, 중복, 핫스팟에 점수를 매겨 우선순위 후보를 만든다.
2. **안전망**: 특성화 테스트로 현재 동작을 고정한다. 이것이 없으면 고친 뒤에 동작이 바뀌었는지 알 수 없다.
3. **점진적 변경**: 작은 리팩토링 단위로 고치거나 Strangler Fig 패턴으로 신구 구현을 함께 돌리며 옮긴다.
4. **재검증**: 테스트와 게이트를 다시 통과하는지 확인하고 다음 단계로 간다.

구글은 이 순환을 도구로 자동화했다. 대부분의 조직은 사람이 한다.

## 결론

무엇을 해야 하는지는 조직 규모와 무관하게 같다. 달라지는 것은 누가 실행하느냐다.

논문에 따르면 구글은 분석 결과를 리뷰 화면에 붙이고 대규모 변경을 도구로 만든다. 우리를 포함한 대다수 조직은 정적분석이 찾고 사람이 우선순위를 정해 고친다. 도구를 들여놓는 것과 리팩토링이 되는 것은 다른 일이다.

같은 글을 [네이버 블로그](https://blog.naver.com/diablodok/224390524880)에도 올렸다.
