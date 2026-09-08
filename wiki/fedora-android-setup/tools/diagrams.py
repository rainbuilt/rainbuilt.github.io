"""Hand-authored SVG diagrams. No Mermaid or network code is used by the website."""
from html import escape

def start(key, title, desc, height):
    return f'''<svg class="lesson-svg" viewBox="0 0 900 {height}" role="img" aria-labelledby="{key}-title {key}-desc" xmlns="http://www.w3.org/2000/svg"><title id="{key}-title">{escape(title)}</title><desc id="{key}-desc">{escape(desc)}</desc><defs><marker id="{key}-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="currentColor" stroke-width="1.3"/></marker></defs>'''

def text(x,y,content,cl='svg-label',anchor='middle'):
    return f'<text x="{x}" y="{y}" class="{cl}" text-anchor="{anchor}">{escape(content)}</text>'

def node(x,y,w,h,title,sub='',tone='blue',data=''):
    return f'<g class="svg-node {tone}" {data}><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="13"/>'+text(x+w/2,y+h/2+(0 if sub else 6),title)+ (text(x+w/2,y+h/2+24,sub,'svg-sub') if sub else '')+'</g>'

def arrow(key,d,label='',x=0,y=0):
    return f'<path class="svg-edge" d="{d}" marker-end="url(#{key}-arrow)"/>'+(text(x,y,label,'svg-edge-label') if label else '')

def toolchain():
    k='build-flow'
    out=start(k,'앱을 만드는 다섯 단계','코드와 리소스를 Gradle과 AGP가 JDK와 SDK를 사용해 APK로 만듭니다. adb가 Android 기기에 설치합니다.',320)
    titles=[('Kotlin과 리소스','소스 파일'),('Gradle + AGP','빌드 실행'),('APK','설치할 파일'),('adb','기기로 전송'),('Android','앱 실행')]
    for i,(t,s) in enumerate(titles):
        x=20+i*177
        out+=node(x,137,152,84,t,s,['blue','blue','mint','mint','dark'][i],f'data-flow-node="{i}"')
        if i<4: out+=arrow(k,f'M{x+154},179 H{x+172}')
    out+=node(175,25,135,62,'JDK','PC에서 실행','pale')+node(328,25,150,62,'Android SDK','API와 빌드 도구','pale')
    out+=arrow(k,'M242,89 V117 H273 V131')+arrow(k,'M403,89 V117 H287 V131')
    out+=text(22,286,'한 번의 Run 안에서 빌드, 설치, 실행이 이어집니다.','svg-note','start')+'</svg>'
    return out

def jvm():
    k='jvm-flow'
    out=start(k,'Gradle의 Java 선택 확인','Daemon JVM criteria가 있으면 프로젝트의 조건을 확인합니다. 그 외에는 IDE와 환경의 JDK 선택을 확인하고 실제 Daemon JVM 출력을 읽습니다.',350)
    out+=node(25,137,173,78,'Gradle 실행','프로젝트의 Wrapper')
    out+=node(248,137,211,78,'JVM criteria 확인','프로젝트의 조건 파일','dark')
    out+=node(512,38,205,77,'조건에 맞는 JDK','criteria가 있을 때','mint')
    out+=node(512,228,205,77,'설정과 환경 확인','criteria가 없을 때','blue')
    out+=node(756,137,125,78,'실제 값 확인','Daemon JVM','pale')
    out+=arrow(k,'M200,176 H242')+arrow(k,'M459,157 H484 V76 H506','있음',480,61)+arrow(k,'M459,196 H484 V268 H506','없음',478,293)
    out+=arrow(k,'M719,76 H737 V157 H750')+arrow(k,'M719,268 H737 V196 H750')
    return out+'</svg>'

def kvm():
    k='kvm-flow'
    out=start(k,'KVM과 그래픽을 따로 검사','Emulator의 CPU 실행 경로는 계정 권한, /dev/kvm, Linux KVM, AMD-V입니다. 그래픽 렌더러는 별도로 선택합니다.',340)
    out+=node(26,132,195,79,'Android Emulator','내 계정으로 실행','dark')
    out+=node(280,30,180,78,'/dev/kvm','접근 권한 확인','blue')+node(510,30,160,78,'Linux KVM','커널의 가상화','blue')+node(714,30,160,78,'AMD-V','Ryzen CPU','mint')
    out+=node(280,223,205,78,'그래픽 렌더러','Automatic 또는 Software','mint')+node(580,223,239,78,'가상 기기의 화면','별도 결과로 확인','pale')
    out+=arrow(k,'M223,151 H250 V69 H274')+arrow(k,'M462,69 H504')+arrow(k,'M672,69 H708')
    out+=arrow(k,'M223,191 H250 V262 H274')+arrow(k,'M487,262 H574')
    out+=text(564,162,'CPU 가속과 화면 그리기를 나눠 점검합니다.','svg-note')
    return out+'</svg>'

def sdk():
    k='sdk-flow'
    out=start(k,'Android API 숫자 세 개','compileSdk는 빌드에, minSdk는 설치 하한에, targetSdk는 기기의 동작 기준에 관여합니다.',328)
    out+=node(30,30,233,93,'compileSdk = 37','컴파일할 API 참조','blue')+node(334,30,233,93,'minSdk = 26','설치 가능한 API 하한','mint')+node(637,30,233,93,'targetSdk = 37','앱이 대응한 동작 기준','pale')
    out+=node(30,220,233,78,'앱 빌드','SDK Platform 사용','blue')+node(477,220,257,78,'Android 기기','설치와 실행','dark')
    out+=arrow(k,'M146,125 V213')+arrow(k,'M451,125 V166 H555 V213')+arrow(k,'M754,125 V166 H657 V213')+arrow(k,'M265,259 H470','APK',368,244)
    return out+'</svg>'

def state():
    k='state-flow'
    out=start(k,'카운터의 상태와 화면','버튼을 누르면 onClick에서 count가 증가합니다. Compose가 해당 상태를 읽는 화면을 갱신하고 새 숫자를 표시합니다. 로그에도 같은 값을 기록합니다.',290)
    ts=[('버튼 클릭','사용자 입력'),('onClick','count += 1'),('상태 변경','count = 1'),('화면 갱신','Text 다시 계산'),('숫자 표시','누른 횟수: 1')]
    for i,(t,s) in enumerate(ts):
        x=20+i*177
        out+=node(x,40,152,86,t,s,'mint' if i>1 else 'blue')
        if i<4: out+=arrow(k,f'M{x+154},83 H{x+172}')
    out+=node(319,190,258,66,'Logcat','같은 값을 로그로 확인','pale')+arrow(k,'M450,128 V183')
    return out+'</svg>'

def usb():
    k='usb-flow'
    out=start(k,'USB 연결의 두 권한','케이블 연결 뒤 Fedora가 USB 장치를 감지합니다. PC의 장치 접근 권한과 휴대전화의 디버깅 허용을 확인하면 adb device 상태를 볼 수 있습니다.',267)
    xs=[20,197,374,551,728]
    ts=[('USB 연결','데이터 케이블'),('장치 감지','lsusb'),('PC의 권한','udev와 ACL'),('휴대전화 허용','신뢰할 PC 인증'),('device','adb 통신 가능')]
    for i,(x,(t,s)) in enumerate(zip(xs,ts)):
        out+=node(x,78,152,89,t,s,['pale','blue','blue','mint','dark'][i])
        if i<4: out+=arrow(k,f'M{x+154},122 H{x+172}')
    out+=text(450,225,'PC의 장치 권한과 휴대전화의 허용을 각각 확인합니다.','svg-note')
    return out+'</svg>'

def trouble():
    k='trouble-flow'
    out=start(k,'마지막 성공 단계로 문제 좁히기','Studio가 열리는지, APK가 생성되는지, adb에서 device로 보이는지를 차례로 검사합니다. 실패한 단계에 따라 원인을 좁힙니다.',350)
    ts=[('Studio 시작','실행 파일과 라이브러리'),('APK 생성','JDK, SDK, Gradle'),('기기 연결','KVM, USB, 인증'),('앱 실행','설치 오류와 Logcat')]
    for i,(t,s) in enumerate(ts):
        x=25+i*224
        out+=node(x,38,176,80,t,'확인한 뒤 다음 단계','blue' if i<3 else 'dark')
        if i<3: out+=arrow(k,f'M{x+178},78 H{x+218}','성공',x+199,57)
        out+=node(x,226,176,81,s,'문제 원문 기록','pale')+arrow(k,f'M{x+88},120 V219','막힘',x+111,174)
    return out+'</svg>'

DIAGRAMS=[toolchain,jvm,kvm,sdk,state,usb,trouble]
TITLES=['코드에서 화면까지','Gradle의 JDK 확인 순서','CPU 가속과 화면 그리기','API 숫자 세 개의 역할','상태가 화면에 반영되는 과정','PC 권한과 휴대전화 허용','마지막 성공 단계 찾기']

def render_diagram(index):
    if index>=len(DIAGRAMS):
        raise ValueError('새 Mermaid 도식에 대응하는 SVG를 tools/diagrams.py에 추가하세요.')
    return f'<figure class="diagram"><div class="diagram-label"><span>FIG {index+1:02}</span><strong>{TITLES[index]}</strong></div><div class="diagram-scroll" tabindex="0" aria-label="{TITLES[index]} 도식">{DIAGRAMS[index]()}</div><figcaption>도구와 단계의 관계를 설명하는 도식입니다.</figcaption></figure>'
