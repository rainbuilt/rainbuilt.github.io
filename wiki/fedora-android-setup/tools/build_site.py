#!/usr/bin/env python3
"""Render the guide and local assets. Does not install Android tools or use the network."""
from __future__ import annotations
import json
import re
from html import escape
from pathlib import Path
from typing import Any
from bs4 import BeautifulSoup
from markdown_it import MarkdownIt
from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import get_lexer_by_name
from pygments.util import ClassNotFound
from diagrams import DIAGRAMS, render_diagram

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "guide.md"
TITLES = ["읽는 순서와 기준 PC", "코드에서 화면까지", "터미널과 PC 상태", "Fedora 패키지 준비", "Android Studio 설치", "SDK 설치와 경로", "zsh와 JDK 설정", "KVM 확인", "가상 기기 만들기", "첫 프로젝트와 설정", "카운터 앱 만들기", "로그, 디버깅, 테스트", "실제 휴대전화 연결", "터미널 빌드와 기록", "막힌 위치별 문제 해결", "업데이트, 백업, NDK", "다른 사람에게 설명하기", "Notion과 Pages 게시", "참고 자료"]
GROUPS = {0:"01 / 읽고 준비하기",4:"02 / 개발 환경 설치",9:"03 / 만들고 확인하기",14:"04 / 관리하고 설명하기"}


def build() -> None:
    source = SOURCE.read_text(encoding="utf-8")
    state = {"diagram":0,"code":0}
    examples: dict[str,str] = {}
    formatter = HtmlFormatter(nowrap=True)
    md = MarkdownIt("commonmark", {"html":False, "typographer":False}).enable("table")

    def fence(tokens: list[Any], idx: int, options: dict, env: dict) -> str:
        token = tokens[idx]
        language = token.info.strip().split()[0] if token.info.strip() else "text"
        if language == "mermaid":
            number = state["diagram"]
            state["diagram"] += 1
            result = render_diagram(number)
            if number == 0:
                buttons = ''.join(f'<button type="button" data-flow-step="{i}" aria-pressed="{str(i==0).lower()}">{i+1:02d} {title}</button>' for i,title in enumerate(["코드","빌드","APK","설치","실행"]))
                explorer = f'<div class="build-explorer"><div class="flow-buttons" role="group" aria-label="빌드 단계 살펴보기">{buttons}</div><p id="flow-description" aria-live="polite">Kotlin 파일은 앱의 동작을, 리소스는 이름과 아이콘 같은 자료를 담습니다. 이 단계에서 코드를 편집합니다.</p></div>'
                result = result.replace('</figure>', explorer+'</figure>')
            return result
        state["code"] += 1
        ident = f"code-{state['code']:03d}"
        try:
            rendered = highlight(token.content,get_lexer_by_name(language,stripnl=False,ensurenl=False),formatter)
        except ClassNotFound:
            rendered = escape(token.content)
        # Pygments must preserve the exact copyable source, including final newline.
        if BeautifulSoup(rendered,"html.parser").get_text() != token.content:
            rendered = escape(token.content)
        if language == "kotlin" and "class MainActivity :" in token.content:
            examples["MainActivity.kt"] = token.content
        if language == "kotlin" and "class CounterScreenTest" in token.content:
            examples["CounterScreenTest.kt"] = token.content
        return f'<div class="code-block"><div class="code-toolbar"><span>{escape(language.upper())}</span><button type="button" data-copy="{ident}" aria-label="코드 {state["code"]} 복사">복사</button></div><pre tabindex="0"><code id="{ident}" class="language-{escape(language)}">{rendered}</code></pre></div>\n'

    md.renderer.rules["fence"] = fence
    rendered = md.render(source)
    soup = BeautifulSoup(rendered,"html.parser")
    output = BeautifulSoup("", "html.parser")
    chapters = []
    chapter = None
    subheading = 0
    for node in list(soup.contents):
        if getattr(node,"name",None) == "h2":
            number = len(chapters)
            title = node.get_text()
            if not title.startswith(f"{number:02d}."):
                raise ValueError(f"Unexpected chapter order: {title}")
            chapter = output.new_tag("section", id=f"ch{number:02d}", attrs={"class":"chapter","aria-labelledby":f"ch{number:02d}-title"})
            heading = output.new_tag("header", attrs={"class":"chapter-heading"})
            kicker = output.new_tag("span", attrs={"class":"chapter-kicker"})
            kicker.string = f"CHAPTER {number:02d}"
            node["id"] = f"ch{number:02d}-title"
            node.string = re.sub(r"^\d{2}\.\s*", "", title)
            heading.append(kicker);heading.append(node.extract());chapter.append(heading)
            output.append(chapter);chapters.append(chapter);subheading=0
        elif chapter is not None:
            if getattr(node,"name",None) == "h3":
                subheading += 1
                node["id"] = f"{chapter['id']}-s{subheading:02d}"
            chapter.append(node.extract())
    if len(chapters) != 19 or state["diagram"] != len(DIAGRAMS):
        raise ValueError(f"Unexpected structure: {len(chapters)} chapters, {state['diagram']} diagrams")
    for number,section in enumerate(chapters):
        end = output.new_tag("div", attrs={"class":"chapter-end"})
        label = output.new_tag("label")
        check = output.new_tag("input",attrs={"type":"checkbox","data-chapter-check":section["id"]})
        label.append(check);label.append("이 장의 내용과 확인 절차를 살펴봤습니다.")
        end.append(label)
        link=output.new_tag("a",href=f"#ch{number+1:02d}" if number<18 else "#top")
        link.string=f"다음 장 {number+1:02d} >" if number<18 else "처음으로 >"
        end.append(link);section.append(end)
    for table in list(output.find_all("table")):
        wrapper=output.new_tag("div",attrs={"class":"table-wrap","tabindex":"0","role":"region","aria-label":"가로로 살펴볼 수 있는 표"})
        table.wrap(wrapper)
    definitions=dict(re.findall(r"^\[(S\d{2})\]:\s+(\S+)",source,re.M))
    source_rows={match[1]:(match[2].strip(),match[3].strip()) for match in re.finditer(r"^\| \[(S\d{2})\] \| ([^|]+) \| ([^|]+) \|$",source,re.M)}
    if len(definitions)!=51 or len(source_rows)!=51:
        raise ValueError("Expected 51 documented references")
    for link in output.find_all("a",href=True):
        if link["href"].startswith("https://"):
            link["rel"]="noopener noreferrer"
        key=link.get_text().strip()
        if key in definitions:
            link["class"]="source-ref"
            link["title"]=source_rows[key][0]
            link["aria-label"]=f"출처 {key}: {source_rows[key][0]}"
    toc=[]
    for number,title in enumerate(TITLES):
        if number in GROUPS:toc.append(f'<p class="nav-group-label">{escape(GROUPS[number])}</p>')
        toc.append(f'<a href="#ch{number:02d}"><span class="nav-num">{number:02d}</span><span>{escape(title)}</span></a>')
    template=(ROOT/"tools/page.html").read_text(encoding="utf-8")
    document=template.replace("{{TOC}}", "\n".join(toc)).replace("{{BODY}}", str(output))
    (ROOT/"index.html").write_text(document,encoding="utf-8")
    (ROOT/"examples").mkdir(exist_ok=True)
    if len(examples)!=2:raise ValueError(f"Expected two Kotlin files, found {list(examples)}")
    for name,content in examples.items():(ROOT/"examples"/name).write_text(content,encoding="utf-8")
    sources=[{"id":key,"title":source_rows[key][0],"used_for":source_rows[key][1],"url":url,"checked_on":"2026-09-08"} for key,url in definitions.items()]
    (ROOT/"sources.json").write_text(json.dumps(sources,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (ROOT/".nojekyll").touch()
    print(f"Built index.html: {len(chapters)} chapters, {state['diagram']} SVG diagrams, {state['code']} code blocks, {len(sources)} references.")
    print("Extracted MainActivity.kt and CounterScreenTest.kt from guide.md.")

if __name__ == "__main__":
    build()
