const repoStats = [
  { value: '9', label: 'commit' },
  { value: '3', label: '핵심 notebook' },
  { value: '100%', label: 'Jupyter Notebook' },
  { value: '3', label: '실험 트랙' },
];

const repoFiles = [
  {
    name: '(260324)_baseline_colab_35.ipynb',
    meta: '운영형 Qwen 추론 baseline',
    href: 'https://github.com/rainbuilt/2026-ssafy-ai-challenge/blob/master/%28260324%29_baseline_colab_35.ipynb',
  },
  {
    name: 'baseline_colab_qwen35_27b_nonthinking_a10080gb.ipynb',
    meta: 'Qwen 27B non-thinking LoRA 실험',
    href: 'https://github.com/rainbuilt/2026-ssafy-ai-challenge/blob/master/baseline_colab_qwen35_27b_nonthinking_a10080gb.ipynb',
  },
  {
    name: '(260324)_baseline_colab_gemma4_31b_lora.ipynb',
    meta: 'Gemma 31B-it QLoRA 실험',
    href: 'https://github.com/rainbuilt/2026-ssafy-ai-challenge/blob/master/%28260324%29_baseline_colab_gemma4_31b_lora.ipynb',
  },
];

const timelineGroups = [
  {
    date: '2026.04.02',
    commits: [
      {
        sha: 'e9809f5',
        file: '(260324)_baseline_colab_35.ipynb',
        title: '초기 Qwen 27B 8bit 추론 baseline 추가',
        desc: '가장 먼저 end-to-end 추론 notebook을 올린 시점입니다.',
        points: [
          'test.csv 추론, item 로그, backup, merge 유틸까지 한 번에 들어감',
          '제출 운영형 파이프라인의 뼈대를 먼저 만든 커밋',
        ],
        add: 1123,
        del: 0,
      },
      {
        sha: 'de56bab',
        file: '(260324)_baseline_colab_35.ipynb',
        title: '35B-A3B smoke 테스트와 진행률 표시 추가',
        desc: '모델을 키워보고, 실행 상태를 바로 볼 수 있게 손본 단계입니다.',
        points: [
          'Qwen 27B에서 Qwen 3.5-35B-A3B로 교체',
          'tqdm 진행률과 postfix 상태 표시 추가',
        ],
        add: 2488,
        del: 1123,
      },
      {
        sha: '39d2093',
        file: '(260324)_baseline_colab_35.ipynb',
        title: '8bit에서 4bit NF4로 전환',
        desc: '실행 가능성을 더 확보하려고 양자화 전략을 바꾼 흐름입니다.',
        points: [
          'BitsAndBytes 4bit NF4 설정 적용',
          '설치/압축해제 셀을 주석 처리해 재실행 흐름 정리',
        ],
        add: 142,
        del: 680,
      },
      {
        sha: 'ad75211',
        file: '(260324)_baseline_colab_35.ipynb',
        title: '운영형 baseline을 Qwen 9B 4bit로 축소',
        desc: '실제 제출 운영에 더 맞는 쪽으로 모델 크기를 줄인 흔적입니다.',
        points: [
          'Qwen 3.5-9B로 변경',
          'smoke 범위를 풀고 full run 이름으로 정리',
        ],
        add: 78,
        del: 99,
      },
      {
        sha: '0ddcd1f',
        file: 'baseline_colab_qwen35_27b_nonthinking_a10080gb.ipynb',
        title: 'Qwen 27B non-thinking LoRA 학습 notebook 추가',
        desc: '운영형 추론과 별도로 학습형 실험 트랙을 분리한 시점입니다.',
        points: [
          'LoRA target에 hybrid projection 계열까지 포함',
          'non-thinking, one-letter answer 출력 정책 적용',
        ],
        add: 6066,
        del: 0,
      },
    ],
  },
  {
    date: '2026.04.03',
    commits: [
      {
        sha: '5e1e16f',
        file: '(260324)_baseline_colab_gemma4_31b_lora.ipynb',
        title: 'Gemma 31B-it QLoRA 학습 notebook 추가',
        desc: 'Qwen 이후 Gemma 계열로 실험을 확장한 시점입니다.',
        points: [
          'resume, early stopping, fixed valid split이 들어간 구조',
          'Gemma 4 vision tower LoRA patch 대비 코드 포함',
        ],
        add: 6461,
        del: 0,
      },
      {
        sha: 'ad14a6e',
        file: '(260324)_baseline_colab_gemma4_31b_lora.ipynb',
        title: 'Gemma 학습 세팅 재조정',
        desc: '학습 안정성을 다시 만진 튜닝 커밋입니다.',
        points: [
          'epoch별 train subset 500 → 400',
          'epoch 9 → 10, grad accum 8 → 4로 변경',
        ],
        add: 1132,
        del: 6456,
      },
      {
        sha: 'cb67bf6',
        file: '(260324)_baseline_colab_gemma4_31b_lora.ipynb',
        title: 'Gemma inference를 adapter optional 구조로 분리',
        desc: 'adapter가 없어도 base / it 모델 자체로 추론 가능한 흐름으로 바꿨습니다.',
        points: [
          'ADAPTER_FOR_INFERENCE = None 경로 추가',
          'processor / infer_model 로드 분기 명확화',
        ],
        add: 69,
        del: 9,
      },
      {
        sha: '61a1362',
        file: '(260324)_baseline_colab_gemma4_31b_lora.ipynb',
        title: 'Gemma inference helper 정리와 notebook 상태 갱신',
        desc: '마지막 커밋은 output 재저장 영향이 크지만, inference helper도 일부 정리됐습니다.',
        points: [
          'move_batch_to_device 유틸 추가',
          '추론 셀 주석/흐름을 조금 더 단정하게 정리',
        ],
        add: 9569,
        del: 26,
      },
    ],
  },
];

function renderStats() {
  const root = document.getElementById('stat-grid');
  root.innerHTML = repoStats.map((item) => `
    <article class="stat-card">
      <p class="stat-value">${item.value}</p>
      <p class="stat-label">${item.label}</p>
    </article>
  `).join('');
}

function renderFiles() {
  const root = document.getElementById('file-list');
  root.innerHTML = repoFiles.map((item) => `
    <a class="file-item" href="${item.href}" target="_blank" rel="noreferrer">
      <p class="file-name">${item.name}</p>
      <p class="file-meta">${item.meta}</p>
    </a>
  `).join('');
}

function scaledWidth(value, maxValue) {
  if (!maxValue || value <= 0) return 0;
  return Math.sqrt(value / maxValue) * 100;
}

function renderTimeline() {
  const all = timelineGroups.flatMap(group => group.commits);
  const maxAdd = Math.max(...all.map(item => item.add));
  const maxDel = Math.max(...all.map(item => item.del));

  const root = document.getElementById('timeline-root');
  root.innerHTML = timelineGroups.map((group) => `
    <section class="timeline-group">
      <div class="timeline-date">${group.date}</div>
      <div class="timeline-list">
        ${group.commits.map((commit) => `
          <article class="commit-card reveal">
            <div class="commit-left">
              <span class="commit-sha">${commit.sha}</span>
              <p class="commit-file">${commit.file}</p>
            </div>
            <div class="commit-right">
              <h3 class="commit-title">${commit.title}</h3>
              <p class="commit-desc">${commit.desc}</p>
              <ul class="commit-points">
                ${commit.points.map((point) => `<li>${point}</li>`).join('')}
              </ul>
              <div class="diff-block">
                <p class="diff-label">git diff line change</p>
                <div class="diff-row">
                  <span class="diff-kind">add</span>
                  <div class="diff-track"><span class="diff-fill" style="width:${scaledWidth(commit.add, maxAdd).toFixed(2)}%"></span></div>
                  <span class="diff-value">+${commit.add}</span>
                </div>
                <div class="diff-row">
                  <span class="diff-kind">del</span>
                  <div class="diff-track"><span class="diff-fill diff-fill-light" style="width:${scaledWidth(commit.del, maxDel).toFixed(2)}%"></span></div>
                  <span class="diff-value">-${commit.del}</span>
                </div>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');
}

function initReveal() {
  const elements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.14 });

  elements.forEach((element) => observer.observe(element));
}

function initScrollProgress() {
  const bar = document.getElementById('top-progress');
  const onScroll = () => {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    bar.style.width = `${ratio}%`;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function initActiveNav() {
  const sections = [...document.querySelectorAll('section[id]')];
  const links = [...document.querySelectorAll('.nav-link')];
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      links.forEach((link) => {
        const isMatch = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('is-active', isMatch);
      });
    });
  }, {
    rootMargin: '-35% 0px -55% 0px',
    threshold: 0.01,
  });

  sections.forEach((section) => observer.observe(section));
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderFiles();
  renderTimeline();
  initReveal();
  initScrollProgress();
  initActiveNav();
});
