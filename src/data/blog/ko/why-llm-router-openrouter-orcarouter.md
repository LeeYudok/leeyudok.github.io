---
author: leeyudok
pubDatetime: 2026-11-17T00:15:00+09:00
title: OpenRouter와 OrcaRouter, LLM 라우터를 왜 쓰나
featured: false
draft: false
category: dev
tags:
  - llm
  - openrouter
  - orcarouter
  - llm-gateway
description: 모델을 둘 이상 쓰면 LLM 라우터가 이득입니다. 두 달 써 본 설정과 실측 수치로 좋은 점 다섯 가지와 주의할 점을 적습니다.
lang: ko
---

모델을 둘 이상 쓴다면 LLM 라우터를 쓰는 편이 낫습니다. 주소 하나와 키 하나로 여러 회사 모델을 부를 수 있기 때문입니다. 모델을 하나만 쓴다면 그 회사 API에 직접 붙는 편이 낫습니다.

LLM 라우터는 여러 모델 제공사 앞에 서는 중계 API입니다. [OpenRouter](https://openrouter.ai/)와 [OrcaRouter](https://www.orcarouter.ai/)가 그런 서비스입니다. 저는 2026년 9월부터 두 서비스를 집 서버의 게이트웨이 뒤에 붙여 쓰고 있습니다. 이 글의 수치는 그 설정과 그동안 남긴 기록에서 가져왔습니다. 공식 문서를 인용한 곳은 출처를 붙였습니다.

## 좋은 점 다섯 가지

### 1. 코드를 그대로 두고 모델을 바꾼다

두 서비스 모두 OpenAI 호환 API를 제공합니다. 주소(`base_url`)와 모델 이름만 바꾸면 기존 코드가 돕니다. OpenRouter는 문서에서 "drop-in replacement for OpenAI"라고 설명합니다.

제 게이트웨이 설정에서 두 서비스는 주소만 다릅니다. 모델 이름은 같습니다.

```toml
[providers.openrouter]
base_url = "https://openrouter.ai/api/v1"
model    = "deepseek/deepseek-v4.1-flash"

[providers.orcarouter]
base_url = "https://api.orcarouter.ai/v1"
model    = "deepseek/deepseek-v4.1-flash"
```

채팅 API만 되는 것도 아닙니다. Claude Code도 환경변수 세 개로 OpenRouter의 모델에 붙습니다.

```bash
ANTHROPIC_BASE_URL="https://openrouter.ai/api"
ANTHROPIC_AUTH_TOKEN="$OPENROUTER_API_KEY"
ANTHROPIC_API_KEY=""
```

`ANTHROPIC_API_KEY`는 비워야 합니다. 값이 있으면 그 키가 OpenRouter로 전송돼 401이 납니다.

### 2. 토큰값에 마진이 붙지 않는다

두 서비스 모두 토큰 단가에 마진을 붙이지 않는다고 밝힙니다.

| | 토큰 단가 | 따로 내는 돈 |
|---|---|---|
| OpenRouter | "there is no markup on inference pricing" | 크레딧을 살 때 5.5%(최소 $0.80) |
| OrcaRouter | "We never mark up the tokens you buy" | 팀 기능 요금제(Team 월 $499). 개인용 Hacker 요금제는 무료 |

OpenRouter는 크레딧을 충전할 때 수수료를 받습니다. 그래서 실제 부담은 정가보다 5.5% 많습니다. OrcaRouter는 2026-10-05에 20달러를 충전해 쓰면서 모델 가격이 제공사 정가와 같은 것을 확인했습니다. 지금 쓰는 `deepseek/deepseek-v4.1-flash`는 100만 토큰당 입력 $0.15, 출력 $0.6입니다(2026-10-26 기준).

### 3. 한 곳이 죽어도 다음으로 넘어간다

OpenRouter는 같은 모델을 여러 제공사에서 받습니다. 문서에는 이렇게 적혀 있습니다. "If a provider returns an error OpenRouter will automatically fall back to the next provider."

라우터 자체도 멈출 수 있습니다. 그래서 저는 게이트웨이에서 라우터를 한 겹 더 묶었습니다. 한 경로의 순서는 이렇습니다.

1. OpenRouter
2. OrcaRouter(같은 모델)
3. 집 서버의 Qwen
4. Upstage
5. Anthropic

앞 단계가 실패하면 다음 단계로 넘어갑니다. 1번과 2번이 같은 모델 이름을 쓰므로 응답 품질이 바뀌지 않습니다.

### 4. 키 하나에 한도와 만료일을 건다

제공사마다 계정을 만들고 카드를 등록하지 않아도 됩니다. 라우터 키 하나면 됩니다.

OpenRouter는 키마다 사용 한도와 만료일을 정할 수 있습니다. 남은 한도는 `GET https://openrouter.ai/api/v1/key`로 봅니다. 이 호출은 크레딧을 쓰지 않습니다. 용도별로 키를 나누고 한도를 걸어 두면, 실수로 반복 호출이 돌아도 손실이 그 한도에서 멈춥니다.

### 5. 모델 비교가 싸고 빠르다

키 하나로 여러 회사 모델을 같은 요청으로 불러 볼 수 있습니다. 가격표만 봐서는 알 수 없는 것이 이때 드러납니다.

2026-10-05에 OrcaRouter로 이미지 한 장(512×514)을 여러 비전 모델에 보내 입력 토큰을 쟀습니다.

| 모델 | 이미지 1장의 입력 토큰 |
|---|---|
| gemma-4-26b | 334 |
| qwen3-vl-8b | 337 |
| gpt-4.1-nano | 200~740 |
| gemini-3.1-flash-lite | 1,150 |
| gemini-2.5-flash-lite | 1,350 |
| gpt-4o-mini | 8,500~14,200 |

같은 이미지인데 토큰 수가 최대 40배 넘게 차이 납니다. 한 번 부르는 값은 대부분 $0.00002~0.0003이었고 gpt-4o-mini만 $0.0013~0.0021이었습니다. 토큰당 단가가 싸다고 한 번 부르는 값이 싼 것은 아닙니다.

이 비교는 토큰과 비용만 잰 것입니다. 정확도는 정답을 붙인 표본이 없어서 비교하지 못했습니다.

## 주의할 점

### 무료 모델은 서비스에 쓰기 어렵다

무료 모델은 시험용입니다. OpenRouter 문서에 따르면 `:free` 모델은 하루 50회로 제한됩니다. 크레딧을 10 이상 산 계정은 하루 1,000회입니다.

한도 말고도 겪은 일이 세 가지 있습니다.

- 무료 모델은 제공사 쪽에서 429(temporarily rate-limited upstream)가 자주 났습니다.
- 기본으로 쓰던 무료 모델이 무료 목록에서 빠졌습니다. 다른 모델로 바꿔야 했습니다.
- OrcaRouter의 `orcarouter/free`는 무료 사용량을 다 쓰자 402(free_quota_exhausted)를 돌려줬습니다.

그래서 무료 모델은 유료 모델과 설정을 나눠 두었습니다. 무료 쪽이 막혀도 유료 경로는 영향을 받지 않습니다.

### 선불 크레딧이 떨어지면 바로 멈춘다

두 서비스 모두 선불입니다. 2026-10-01에 OrcaRouter 키를 처음 받았을 때 크레딧이 0이었습니다. `orcarouter/auto`는 402(out of credits)를 돌려줬고 무료 모델만 응답했습니다. 잔액 알림을 걸거나 3번에서 말한 다음 단계를 준비해야 합니다.

### 데이터가 한 곳을 더 거친다

라우터를 쓰면 요청이 라우터 회사를 한 번 더 지납니다. OpenRouter는 문서에서 "Prompt and completion are not logged by default"라고 밝힙니다. 저장에 동의하면 사용료를 1% 깎아 줍니다.

그래도 밖으로 내보내면 안 되는 데이터는 라우터로 보내지 않습니다. 제 게이트웨이는 외부 제공자에 표시를 해 둡니다. 요청에 "외부 금지" 헤더가 붙으면 그 제공자들을 건너뛰고 집 서버 모델만 씁니다.

### 자동 라우팅 수치는 그대로 믿기 어렵다

OrcaRouter의 `orcarouter/auto`는 요청을 보고 모델을 골라 줍니다. 그런데 2026-11-17에 본 소개 페이지에는 라우팅 정확도가 두 가지로 적혀 있었습니다. 한 곳은 RouterArena 기준 75.5%이고 다른 곳은 99%입니다. 두 수치가 어떤 관계인지는 페이지에 설명이 없었습니다.

저는 `auto`를 쓰지 않고 모델 이름을 지정합니다. 어떤 모델이 답했는지 알아야 비용과 품질을 따질 수 있기 때문입니다.

### 추론 옵션은 따로 맞춰야 한다

모델 이름이 같아도 추론(reasoning) 기본값까지 원하는 대로 맞춰지지는 않습니다. 저는 두 라우터 모두 `reasoning_effort`를 `none`으로 명시했습니다. 추론이 필요한 단계에서만 값을 덮어씁니다.

## 두 서비스의 차이

| | OpenRouter | OrcaRouter |
|---|---|---|
| 주소 | `https://openrouter.ai/api/v1` | `https://api.orcarouter.ai/v1` |
| 모델 수 | 문서에 숫자 없음 | 소개 페이지 "200+", 2026-10-01 `/v1/models` 실측 205개 |
| 돈 내는 곳 | 크레딧 충전 수수료 5.5% | 토큰 마진 0%, 팀 요금제 |
| 자동 선택 | 같은 모델의 제공사를 자동 전환 | `orcarouter/auto`가 모델을 선택 |
| 키 한도 조회 | `GET /api/v1/key` | API를 찾지 못함. 콘솔에서 확인 |
| 운영 주체 | OpenRouter | 페이지에서 법인 이름을 찾지 못함 |

저는 OpenRouter를 먼저 두고 OrcaRouter를 그 뒤에 둡니다. OpenRouter는 문서와 키 관리 API가 갖춰져 있습니다. OrcaRouter는 충전 수수료가 없지만 운영 주체에 관한 정보가 적습니다.

## 언제 쓰고 언제 쓰지 않나

쓰는 편이 나은 경우입니다.

- 모델을 둘 이상 쓰거나 자주 바꿉니다.
- 모델을 비교해서 고르는 단계입니다.
- 한 제공사의 장애가 서비스 중단으로 이어지면 안 됩니다.

쓰지 않는 편이 나은 경우입니다.

- 모델 하나만 씁니다. 직접 붙으면 충전 수수료와 경유 구간이 없습니다.
- 데이터를 제3자에게 넘길 수 없습니다. 이때는 직접 계약하거나 자체 서버에서 돌립니다.
- 제공사만 주는 기능이나 계약 조건이 필요합니다.

## 출처

- [OpenRouter FAQ](https://openrouter.ai/docs/faq): 가격, 충전 수수료, 자동 전환, 저장 기본값, 무료 모델 한도 (2026-11-17 확인)
- [OrcaRouter 소개 페이지](https://www.orcarouter.ai/): 마진, 요금제, 모델 수, 라우팅 정확도 문구 (2026-11-17 확인)
- 실측과 설정: 제 게이트웨이의 설정 파일과 2026-10-01, 2026-10-05, 2026-10-26 작업 기록
