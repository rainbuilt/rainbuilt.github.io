# Fedora 44 KDE Android 개발 가이드

기준일: 2026-09-08

Kotlin과 Jetpack Compose로 첫 Android 앱을 만드는 학습 문서입니다. 기준 환경은 Fedora 44 KDE, x86_64, zsh, AMD Ryzen, NVIDIA GPU, Wayland입니다.

## 먼저 열 파일

Notion에 가져올 원문은 `guide.md`입니다. 웹 문서는 `index.html`에서 시작합니다. ZIP을 먼저 풀고 같은 폴더의 `assets`를 함께 유지하세요. HTML 파일 하나만 따로 옮기면 디자인과 기능을 불러오지 못합니다.

| 파일 | 내용 |
| --- | --- |
| `guide.md` | 19개 장, Mermaid 도식 7개, 공식 참고 자료 51개 |
| `index.html` | 본문 전체와 직접 작성한 SVG 도식 |
| `assets/styles.css` | 데스크톱, 모바일, 어두운 화면, 인쇄용 스타일 |
| `assets/app.js` | 검색, 코드 복사, 목차, 장별 확인 기록 |
| `assets/model.js` | 직접 만든 WebGL 모형과 CSS 3D 모형 |
| `assets/favicon.svg` | 문서 아이콘 |
| `examples/MainActivity.kt` | 카운터 앱의 화면 코드 |
| `examples/CounterScreenTest.kt` | 버튼 동작을 확인하는 Compose UI 테스트 |
| `sources.json` | 참고 자료의 주소, 용도, 확인일 |
| `VALIDATION.md` | 문서 검사 결과와 확인하지 못한 범위 |
| `tools/` | 마크다운에서 HTML을 다시 만드는 도구 |
| `.nojekyll` | GitHub Pages에서 정적 파일로 게시하기 위한 파일 |

`examples`의 Kotlin 파일은 가이드 09장에서 생성한 프로젝트에 넣습니다. 프로젝트의 Gradle 설정, Manifest, SDK가 함께 필요합니다. 파일만 따로 실행하는 예제는 제공하지 않습니다.

## Notion에 가져오기

Notion의 `Settings > Import > Text & Markdown`에서 `guide.md`를 선택합니다. 가져온 뒤 표와 코드 블록, 출처 링크를 확인하세요. 절차의 공식 자료와 제약은 본문 17장에 적었습니다.

Mermaid가 코드로만 보이면 해당 블록의 언어 메뉴를 확인합니다. 계정과 가져오기 방식에 따라 표시가 달라질 수 있습니다. 자동 렌더링 여부는 직접 확인해야 합니다. 각 그림 뒤에 설명도 함께 넣었습니다.

## GitHub Pages에 게시하기

문서 폴더 안의 파일과 `assets` 폴더를 저장소 루트에 올립니다. 저장소 첫 화면에서 `index.html`이 바로 보여야 합니다. `.nojekyll`도 포함하세요.

저장소의 `Settings > Pages`에서 Source는 `Deploy from a branch`, 브랜치는 `main`, 폴더는 `/(root)`로 지정합니다. 배포가 끝나면 Pages에 표시된 주소를 엽니다. 자세한 절차와 공식 출처는 본문 17장을 참고하세요.

이 묶음은 게시할 파일을 제공합니다. GitHub 저장소 생성이나 실제 배포 작업은 수행하지 않았습니다.

## 웹 문서 사용하기

화면 위의 검색 버튼이나 `Ctrl+K`로 검색창을 엽니다. 제목과 본문, 코드에서 검색합니다. 여러 단어를 띄어 쓰면 모든 단어가 들어 있는 항목을 찾습니다. `Esc`로 닫습니다.

코드 블록의 복사 버튼은 코드 전체를 클립보드에 넣습니다. 브라우저가 복사를 막으면 코드를 선택하고 `Ctrl+C`를 사용하세요. 웹 문서가 명령을 실행하지는 않습니다.

장 끝의 확인란을 선택하면 읽기 기록이 같은 사이트의 브라우저 로컬 저장소에 보관됩니다. 브라우저 데이터를 지우거나 게시 주소를 바꾸면 기록이 사라지거나 이어지지 않을 수 있습니다. 로컬 파일 모드와 개인정보 보호 설정에서도 저장이 제한될 수 있습니다.

3D 모형은 마우스로 끌거나 방향키로 회전합니다. 층 간격과 관심 있는 층도 고를 수 있습니다. WebGL을 사용할 수 없으면 CSS 3D 모형으로 전환합니다. 두 방식이 모두 막히거나 JavaScript가 꺼져 있으면 정적 SVG 그림을 표시합니다. 모형의 층은 도구의 관계를 설명하기 위해 정했습니다.

본문의 SVG 도식 7개는 JavaScript 없이도 표시됩니다. 외부 폰트, CDN 라이브러리, 분석 도구를 불러오지 않습니다. 검색어와 읽기 기록을 서버로 전송하는 코드도 없습니다. 출처 링크를 누르면 해당 공식 사이트로 이동합니다.

## 내용을 수정한 뒤 HTML 다시 만들기

일반 열람과 GitHub Pages 게시에는 Python이 필요하지 않습니다. 이 절차는 `guide.md`를 수정해 웹 문서를 다시 만들 때 사용합니다.

Dolphin에서 `tools`와 `guide.md`가 있는 문서 루트 폴더를 열고 터미널을 엽니다. `pwd`로 작업 위치를 확인한 뒤 다음을 한 줄씩 실행하세요.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r tools/requirements.txt
.venv/bin/python tools/build_site.py
```

첫 줄은 이 문서 도구만 사용할 Python 환경을 `.venv`에 만듭니다. 두 번째 줄은 그 환경에 Markdown 처리와 코드 색상 표시용 라이브러리를 설치합니다. 이때 패키지를 내려받을 인터넷 연결이 필요합니다. `sudo`는 사용하지 않습니다.

마지막 줄은 마크다운을 읽어 `index.html`, 예제 Kotlin 파일 두 개, `sources.json`을 갱신합니다. 원문 코드와 HTML에서 복사되는 코드가 같도록 처리합니다. Android SDK를 설치하거나 앱을 빌드하는 도구는 실행하지 않습니다.

문장과 코드 수정은 `guide.md`, 페이지 바깥 구조는 `tools/page.html`, 도식은 `tools/diagrams.py`에서 작업합니다. 색상과 배치는 `assets/styles.css`에 있습니다. 생성된 `index.html`만 수정하면 다음 재생성 때 덮어써집니다.

장과 도식의 수를 바꾸려면 `tools/build_site.py`의 목차와 개수 검사, `tools/diagrams.py`의 그림 목록, `tools/page.html`의 소개 숫자도 함께 바꾸세요. 현재 구성은 19개 장과 7개 도식의 대응을 검사합니다.

`.venv`와 `__pycache__`는 게시하지 않습니다. 새 버전을 올리기 전 `index.html`을 다시 열어 검색과 코드, 도식, 모바일 화면을 확인하세요.

## 확인 범위

문서의 링크 구조와 예제 일치 여부, 브라우저 화면과 상호작용을 검사했습니다. Fedora PC의 설치, KVM 사용, APK 빌드, Android 기기 테스트는 직접 실행하지 않았습니다. 웹 모형의 WebGL 경로도 검사 환경에서 사용할 수 없었습니다. CSS 3D 경로의 표시와 조작을 확인했습니다.

검사 방법과 남은 확인 항목은 `VALIDATION.md`에 기록했습니다. 앱 실습은 각 장의 성공 조건을 직접 확인하며 진행하세요.
