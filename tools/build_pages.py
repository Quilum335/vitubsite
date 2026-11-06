"""Generate NORMAS HTML pages in the dark-studio design.

Sources for inner pages live in tools/source (snapshot of the previous design);
the script is idempotent: run `python tools/build_pages.py` from the repo root.
"""
from pathlib import Path
from html import escape
import json, re, struct, sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
from seo_content import SERVICES, ARTICLES

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
SRC = ROOT / 'tools' / 'source'
SITE = 'https://normas.eu.cc'
TG = 'https://t.me/Egor_shks'
MAIL = 'quilum335@gmail.com'

RIG_FILE = ROOT.parents[1] / 'art' / 'rig.json'
RIG = json.loads(RIG_FILE.read_text()) if RIG_FILE.exists() else {}
CHARS = [
    dict(id='mimi', name='Mimi', style='pastel', tagline='Неко-девочка для уютных стримов', desc='Лавандовые хвостики с облачками, кошачьи ушки и платье-матроска с сердечком. Болтает с чатом и мурчит на донаты.', traits=['Неко', 'Уютные стримы', 'Болталка', 'Пастель'], palette=['#C5A3FF', '#FFB7D5', '#A8DCFF', '#FFF0F6'], keywords='кошка неко catgirl сиреневый милая'),
    dict(id='lumi', name='Lumi', style='pastel', tagline='Ангел с нимбом и мягким голосом', desc='Длинные белые волосы с голубыми кончиками, нимб и пушистые крылья. Спокойные ночные эфиры, ASMR и разговоры по душам.', traits=['Ангел', 'ASMR', 'Ночные эфиры', 'Нимб и крылья'], palette=['#FFFFFF', '#C5A3FF', '#A8DCFF', '#FFB7D5'], keywords='ангел нимб крылья белые волосы'),
    dict(id='momo', name='Momo', style='pastel', tagline='Зайка-фея с волшебной палочкой', desc='Розовое каре, заячьи ушки, крылья феи и худи с клубничками. Игры, арт-стримы и много подмигиваний.', traits=['Зайка', 'Фея', 'Игры', 'Арт-стримы'], palette=['#FFB7D5', '#FFF0F6', '#A8DCFF', '#C5A3FF'], keywords='зайка кролик фея розовая клубника'),
    dict(id='vexa', name='Vexa', style='neon', tagline='Хакерша в неоновом техвире', desc='Розовые волосы с бирюзовыми прядями, голографический визор и куртка с неоновыми швами. Шутеры, взломы и ночные марафоны.', traits=['Киберпанк', 'Хакер', 'Шутеры', 'Визор'], palette=['#FF3CAC', '#00E5FF', '#8B5CF6', '#131126'], keywords='хакер киберпанк розовые волосы визор техвир'),
    dict(id='kairo', name='Kairo', style='neon', tagline='Стример в голографической куртке', desc='Фиолетовые волосы, переливающаяся куртка и светящиеся наушники. Музыка, ритм-игры и вайб ночного города.', traits=['Кибер-бой', 'Музыка', 'Ритм-игры', 'Голограммы'], palette=['#8B5CF6', '#00E5FF', '#FF3CAC', '#131126'], keywords='парень бой голограмма наушники музыка'),
    dict(id='nyx', name='Nyx', style='neon', tagline='Демоница-геймерша с наушниками', desc='Тёмные пучки с малиновыми кончиками, рожки, гетерохромия и неоновый хвост. Хорроры, рейды и озорной смех.', traits=['Демон', 'Геймер', 'Хорроры', 'Гетерохромия'], palette=['#131126', '#FF3CAC', '#00E5FF', '#8B5CF6'], keywords='демон рога хвост геймер наушники'),
]
for c in CHARS:
    c.update(RIG.get(c['id'], {'neck': .19, 'hip': .5}))
CHARS_JS = json.dumps([{k: c[k] for k in ('id', 'name', 'style', 'tagline', 'desc', 'traits', 'palette', 'keywords', 'neck', 'hip')} for c in CHARS], ensure_ascii=False)
(DIST / 'assets/chars.json').write_text(CHARS_JS, encoding='utf-8')

ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
ICON_HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.5 0 5.7 3.4 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"/></svg>'

NAV = [('#characters', 'Персонажи'), ('#services', 'Услуги'), ('/prices/', 'Цены'), ('/journal/', 'Журнал'), ('#faq', 'FAQ')]

def header(home):
    pre = '' if home else '/'
    href = lambda h: h if h.startswith('/') else pre + h
    seg = ''.join(f'<a href="{href(h)}">{t}</a>' for h, t in NAV)
    drawer = ''.join(f'<a href="{href(h)}">{t}</a>' for h, t in NAV)
    solid = '' if home else ' solid'
    return f'''<header class="site-header{solid}"><div class="bar">
<a class="logo" href="/" aria-label="NORMAS — главная"><span class="logo-mark" aria-hidden="true">✳</span><span>NORMAS<small>VTUBER STUDIO</small></span></a>
<nav class="seg" aria-label="Основная навигация">{seg}</nav>
<button class="search-trigger" data-search aria-label="Поиск по сайту">{ICON_SEARCH}<span>Поиск</span><kbd>Ctrl K</kbd></button>
<a class="btn btn-lime btn-sm header-cta" href="https://t.me/Egor_shks" target="_blank" rel="noopener">Заказать модель</a>
<button class="menu-btn" aria-label="Меню" aria-expanded="false"><i></i><i></i></button>
</div></header>
<div class="drawer" aria-label="Мобильное меню">{drawer}<a class="btn btn-lime" href="https://t.me/Egor_shks" target="_blank" rel="noopener">Заказать модель <span class="arr">↗</span></a></div>'''

def footer():
    return f'''<footer class="site-footer"><div class="wrap">
<div><a class="logo" href="/"><span class="logo-mark" aria-hidden="true">✳</span><span>NORMAS<small>VTUBER STUDIO</small></span></a><p>Модели витуберов на заказ: 2D (Live2D), 3D, PNGTuber и аватары для VRChat. Цена договорная — смета после брифа.</p></div>
<div><h4>Услуги</h4><a href="/services/model-vitubera/">Модель витубера на заказ</a><a href="/services/2d-vtuber-model/">2D-модель и Live2D</a><a href="/services/3d-vtuber-model/">3D-модель витубера</a><a href="/services/pngtuber/">PNGTuber-аватар</a><a href="/services/vrchat-avatar/">Аватар для VRChat</a><a href="/services/rigging/">Риггинг и мимика</a><a href="/prices/">Цены</a></div>
<div><h4>Журнал</h4><a href="/journal/kak-stat-vituberom/">Как стать витубером</a><a href="/journal/vtube-studio/">VTube Studio</a><a href="/journal/vseeface/">Настройка VSeeFace</a><a href="/journal/gde-zakazat-model-vitubera/">Где заказать модель</a><a href="/journal/2d-or-3d/">2D или 3D</a><a href="/journal/">Все статьи →</a></div>
<div><h4>Связь</h4><a data-contact="telegram" href="{TG}">Telegram ↗</a><a data-contact="email" href="mailto:{MAIL}">{MAIL}</a><a href="/credits/">О концептах</a></div>
</div><div class="wrap foot-bottom"><span class="mono">© 2026 NORMAS · Персонажи с характером</span><a class="btn btn-glass btn-sm clone-btn" href="https://renigt.online/" target="_blank" rel="noopener">Зайти на клон сайта · Renigt ↗</a></div></footer>'''

def brief_dialog():
    return f'''<dialog id="brief-dialog" aria-labelledby="brief-title"><div class="dlg-top"><span class="kicker">Бриф на персонажа</span><button class="x" aria-label="Закрыть">×</button></div>
<div class="brief-body"><h2 id="brief-title">Расскажи, <em>кем</em> хочешь стать</h2><p>Пять полей — и мы вернёмся с оценкой состава работ, сроков и бюджета.</p>
<form id="brief-form"><div class="row"><label>Имя или ник<input name="name" required maxlength="120" placeholder="Например, Mira" autocomplete="nickname"></label>
<label>Программа<select name="platform"><option>Пока не знаю</option><option>VTube Studio</option><option>VSeeFace</option><option>Warudo</option><option>VRChat</option><option>VNyan</option><option>Другая</option></select></label></div>
<label>Что нужно<select name="service"><option>Модель витубера с нуля</option><option>2D / Live2D-модель</option><option>3D-модель</option><option>PNGTuber</option><option>Аватар для VRChat</option><option>Модель по готовому концепту</option><option>Риггинг и мимика</option><option>Доработать существующую модель</option><option>Настройка для стримов</option></select></label>
<label>О персонаже<textarea name="idea" required maxlength="6000" rows="4" placeholder="Характер, стиль, одежда, цвета, ссылки на арты…"></textarea></label>
<label>Референсы и понравившиеся модели<input name="refs" maxlength="600" placeholder="Ссылки или имена персонажей NORMAS"></label>
<div class="row"><label>Бюджет<input name="budget" maxlength="100" placeholder="Например, до 50 000 ₽"></label><label>Срок<input name="deadline" maxlength="100" placeholder="Дата или «не горит»"></label></div>
<p class="form-note">Бриф не отправляется автоматически: скачай или скопируй его и пришли нам.</p>
<div class="form-actions"><button type="submit" class="btn btn-lime">Скачать бриф <span class="arr">↓</span></button><button type="button" id="copy-brief" class="btn btn-glass">Скопировать</button></div>
<div id="brief-result" role="status" hidden></div>
<div class="contacts"><a class="link" data-contact="telegram" href="{TG}">Отправить в Telegram ↗</a><a class="link" data-contact="email" href="mailto:{MAIL}">Написать на почту ↗</a></div></form></div></dialog>'''

def palette():
    return f'''<dialog id="palette" aria-label="Поиск по сайту"><div class="pal-input">{ICON_SEARCH}<input type="search" placeholder="Найти персонажа, услугу или статью…" aria-label="Поиск" autocomplete="off"><kbd>Esc</kbd></div>
<div class="pal-list" role="listbox"></div><div class="pal-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> выбрать</span><span><kbd>↵</kbd> открыть</span><span><kbd>Ctrl K</kbd> поиск</span></div></dialog>'''

def head_from(src_html, extra=''):
    head = re.search(r'<head>(.*?)</head>', src_html, re.S).group(1)
    head = re.sub(r'<link rel="stylesheet"[^>]*>', '', head)
    head = re.sub(r'<script src="[^"]*"[^>]*></script>', '', head)
    head = re.sub(r'<meta name="theme-color"[^>]*>', '', head)
    head = head.strip()
    if 'og:image' not in head:
        head += f'\n<meta property="og:image" content="{SITE}/assets/og/normas.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'
    if 'twitter:card' not in head:
        head += '\n<meta name="twitter:card" content="summary_large_image"><meta property="og:site_name" content="NORMAS"><meta property="og:locale" content="ru_RU">'
    return (head + '\n<meta name="theme-color" content="#FFF0F6">'
            '\n<link rel="preload" href="/assets/manrope-cyrillic.woff2" as="font" type="font/woff2" crossorigin>'
            '\n<link rel="stylesheet" href="/assets/normas.css">'
            f'\n<script>window.NORMAS_CHARS={CHARS_JS}</script><script src="/assets/config.js" defer></script><script src="/assets/alive2d.js" defer></script><script src="/assets/normas.js" defer></script>' + extra)

def page(head, body, home=False, tail=''):
    return f'''<!doctype html>
<html lang="ru">
<head>
{head}
</head>
<body{' class="home"' if home else ''}>
<a class="skip" href="#main">Перейти к содержимому</a>
{header(home)}
{body}
{footer()}
{brief_dialog()}
{palette()}
{tail}
</body>
</html>
'''

# ---------- home ----------
def card(c):
    sw = ''.join(f'<i style="background:{p}"></i>' for p in c['palette'])
    return f'''<article class="char rv" data-char="{c['id']}" data-style="{c['style']}" data-name="{escape(c['name'])}" data-text="{escape(c['tagline'] + ' ' + ' '.join(c['traits']) + ' ' + c['keywords'])}" tabindex="0" role="button" aria-label="Открыть персонажа {escape(c['name'])}">
<span class="tag">{'Pastel Kawaii' if c['style'] == 'pastel' else 'Neon Cyberpunk'}</span><button class="like" data-like="{c['id']}" aria-pressed="false" aria-label="В мудборд: {escape(c['name'])}">{ICON_HEART}</button>
<img class="art" src="/assets/chars/{c['id']}-sm.webp" alt="{escape(c['name'])} — концепт VTuber-персонажа, {escape(c['tagline'].lower())}" width="512" height="768" loading="lazy" decoding="async">
<div class="meta"><span class="mono">{escape(' · '.join(c['traits'][:2]))}</span><h3>{escape(c['name'])}</h3><p>{escape(c['tagline'])}</p><div class="sw">{sw}</div></div></article>'''

def folder(n, title, desc, f1, f2, img, files, links):
    fhtml = ''.join(f'<span class="f-file"><small>{escape(s)}</small><span>{escape(t)}<i></i><i></i><i></i></span></span>' for s, t in files)
    lhtml = ''.join(f'<a href="{u}">{escape(t)} <span aria-hidden="true">↗</span></a>' for t, u in links)
    return f'''<div class="folder rv"><div class="folder-obj" role="button" tabindex="0" aria-expanded="false" aria-label="Открыть папку «{escape(title)}»" style="--f1:{f1};--f2:{f2}">
<span class="f-back"><img src="/assets/chars/{img}-sm.webp" alt="" loading="lazy"></span><span class="f-tab"></span>
<span class="f-files">{fhtml}</span>
<span class="f-glass"><strong>{escape(title)}</strong><span class="count">0{n} · {len(files)} файла</span></span></div>
<div><h3>{escape(title)}</h3><p>{escape(desc)}</p></div>
<button class="folder-toggle" aria-expanded="false">Что внутри</button>
<div class="folder-links">{lhtml}</div></div>'''

FOLDERS_HOME = [
    (1, 'Образ и концепт', 'Силуэт, костюм, палитра и характер. Можно прийти с артом или только с идеей — образ соберём вместе.', '#FFB7D5', '#E58BB6', 'mimi',
     [('Бриф', 'Референсы'), ('Концепт', 'Силуэт и палитра'), ('Арт', 'Финальный дизайн')],
     [('Как проходит заказ', '/services/3d-vtuber-model/'), ('Подготовить референсы', '/journal/vtuber-brief/'), ('Посмотреть концепты', '#characters')]),
    (2, 'Модель и мимика', '2D-разбор на слои или 3D-модель, риг, лицевые формы и физика волос. Персонаж моргает, говорит и реагирует.', '#C5A3FF', '#8F6BE0', 'lumi',
     [('Риг', 'Скелет и веса'), ('Мимика', 'Эмоции и рот'), ('Физика', 'Волосы и одежда')],
     [('Риггинг и мимика', '/services/rigging/'), ('2D или 3D: что выбрать', '/journal/2d-or-3d/')]),
    (3, 'Выход в эфир', 'Экспорт и настройка под твою программу, проверка трекинга перед первым стримом.', '#A8DCFF', '#5BAAE0', 'momo',
     [('Экспорт', 'VRM · GLB'), ('Настройка', 'VSeeFace · Warudo'), ('Проверка', 'Тестовый эфир')],
     [('VRM и подготовка к эфиру', '/services/vrm/'), ('Из чего складывается цена', '/journal/3d-vtuber-price/')]),
]

def home():
    src = (SRC / 'index.html').read_text(encoding='utf-8')
    head = head_from(src, ld_home() + f'\n<link rel="preload" href="/assets/chars/{CHARS[0]["id"]}.webp" as="image">')
    first = CHARS[0]
    avatars = ''.join(f'<button data-hero-char="{c["id"]}" class="{"active" if i == 0 else ""}" aria-pressed="{"true" if i == 0 else "false"}" aria-label="Показать {escape(c["name"])}"><img src="/assets/chars/{c["id"]}-face.webp" alt="" width="46" height="46"></button>' for i, c in enumerate(CHARS))
    cards = '\n'.join(card(c) for c in CHARS)
    mq = ''.join(f'<span>{t}</span>' for t in ['Модель витубера на заказ', '2D и Live2D', '3D VTuber-модели', 'PNGTuber', 'Аватары для VRChat', 'Pastel Kawaii', 'Neon Cyberpunk', 'VTube Studio · VSeeFace · Warudo', 'Цена договорная'])
    folders = ''.join(folder(*f) for f in FOLDERS_HOME)
    svc = [(x['rel'], x['short'], x['card']) for x in SERVICES if x['rel'] != 'prices'] + [('services/3d-vtuber-model', '3D-модель витубера', 'Моделирование, текстуры и риг'), ('services/rigging', 'Риггинг и мимика', 'Скелет, эмоции и физика')]
    service_cards = ''.join(f'<a class="post rv" href="/{r}/"><span class="mono">Услуга</span><span class="go">↗</span><h3>{escape(t)}</h3><p>{escape(d)}</p></a>' for r, t, d in svc)
    journal_cards = ''.join(f'<a class="post rv" href="/{a["rel"]}/"><span class="mono">Журнал</span><span class="go">↗</span><h3>{escape(a["short"])}</h3><p>{escape(a["card"])}</p></a>' for a in ARTICLES[:3])
    body = f'''<main id="main">
<section class="hero wrap" id="top"><div class="hero-card intro" data-mood="{first['style']}"><canvas class="waves" aria-hidden="true"></canvas><span class="hero-sun" aria-hidden="true"></span><span class="spot" aria-hidden="true"></span>
<div class="hero-grid"><div class="hero-copy">
<span class="kicker">NORMAS · VTuber studio</span>
<h1><span class="ln"><span>Модели витуберов</span></span> <span class="ln"><span><em>на заказ</em></span></span></h1>
<p class="lead">Создаём модели витуберов на заказ: дизайн персонажа, 2D (Live2D) и 3D VTuber-модели, риг и мимика, настройка под VTube Studio, VSeeFace, Warudo и VRChat. Пастельные милашки или неоновый киберпанк — выбирай стиль.</p>
<div class="hero-actions"><a class="btn btn-lime" href="https://t.me/Egor_shks" target="_blank" rel="noopener">Заказать персонажа <span class="arr">↗</span></a><a class="btn btn-glass" href="#characters">Смотреть концепты</a></div>
<p class="hero-note">Уже знаешь, чего хочешь? <a href="#" data-brief>Опиши персонажа в брифе ↗</a></p>
</div>
<div class="hero-stage"><span class="halo" aria-hidden="true"></span>
<div class="alive" data-alive-hero data-neck="{first['neck']}" data-hip="{first['hip']}" data-src="/assets/chars/{first['id']}.webp" title="Нажми на меня"><img class="ph" src="/assets/chars/{first['id']}-sm.webp" alt="{escape(first['name'])} — концепт VTuber-персонажа" width="512" height="768"></div>
<span class="chip c1"><b></b>Потяни меня ↔</span><span class="chip c2">Нажми — заговорит ♡</span></div></div>
<div class="hero-switch"><div class="now"><span data-hero-style>{'Pastel Kawaii' if first['style'] == 'pastel' else 'Neon Cyberpunk'}</span><strong data-hero-name>{escape(first['name'])}</strong></div><div class="avatars" role="group" aria-label="Выбрать персонажа">{avatars}</div><button class="btn btn-glass btn-sm" data-hero-open data-open-char="{first['id']}">Подробнее ↗</button></div>
</div>
<div class="marquee" aria-hidden="true"><div class="marquee-track">{mq}{mq}</div></div></section>

<section class="section wrap" id="characters"><div class="section-head rv"><div><span class="kicker">01 · Концепты</span><h2>К кому <em>тянет?</em></h2></div><p>Два направления, в которых мы работаем. Отмечай сердечком тех, кто откликается, — соберём из них мудборд и добавим в бриф.</p></div>
<div class="toolbar"><div class="filters" role="group" aria-label="Стиль"><button class="active" aria-pressed="true" data-filter="all">Все</button><button aria-pressed="false" data-filter="pastel">Pastel Kawaii</button><button aria-pressed="false" data-filter="neon">Neon Cyberpunk</button></div>
<label class="inline-search">{ICON_SEARCH}<input id="gallery-search" type="search" placeholder="Неко, ангел, демон, хакер…" aria-label="Поиск по персонажам"></label></div>
<div class="chars">{cards}</div><p class="empty gallery-empty" hidden>Никого не нашли. Попробуй другой запрос — или <a class="link" href="#" data-brief>опиши своего персонажа</a>.</p>
<p class="note-ai">Концепт-арты показывают стиль и подачу. Твой персонаж разрабатывается с нуля под твою идею.</p></section>

<section class="section wrap" id="services"><div class="section-head rv"><div><span class="kicker">02 · Услуги</span><h2>Три папки — <em>один персонаж</em></h2></div><p>Нажми на папку: внутри этапы работы и всё, что стоит прочитать до заказа.</p></div>
<div class="folders">{folders}</div>
<div class="section-head rv" style="margin-top:80px"><div><span class="kicker">Все форматы</span><h2 style="font-size:clamp(32px,4vw,52px)">Что мы <em>делаем</em></h2></div><p>Выберите формат — на странице услуги состав работ, этапы и ответы на вопросы.</p></div>
<div class="posts">{service_cards}</div></section>

<section class="section wrap" id="process"><div class="section-head rv"><div><span class="kicker">03 · Процесс</span><h2>От идеи <em>до эфира</em></h2></div><p>Состав работ, сроки и бюджет фиксируем до старта — без сюрпризов в конце.</p></div>
<div class="bento">
<div class="tile w4 glow rv"><div><h3>Как проходит заказ</h3><p>Каждый этап согласуем с тобой и показываем промежуточный результат.</p></div><ol class="steps"><li>Бриф и референсы<span>ты рассказываешь об идее</span></li><li>Концепт и смета<span>фиксируем стиль, состав и сроки</span></li><li>Арт и модель<span>показываем эскизы и рендеры</span></li><li>Риг, мимика, физика<span>проверяем в движении</span></li><li>Экспорт и настройка<span>готово к стриму</span></li></ol></div>
<div class="tile w2 rv"><span class="num">2</span><div><h3>стиля на выбор</h3><p>Pastel Kawaii для уютных стримов или Neon Cyberpunk для игровых — или твой собственный.</p></div></div>
<div class="tile w3 rv"><div><h3>Под твою программу</h3><p>Формат и трекинг выбираем до начала работы и проверяем перед передачей.</p></div><div class="pills"><span>VSeeFace</span><span>Warudo</span><span>VRChat</span><span>VNyan</span><span>VRM</span><span>GLB</span></div></div>
<div class="tile w3 rv"><div><h3>Цена — договорная</h3><p>Считаем смету по брифу и фиксируем до старта. Зависит от формата, дизайна, сложности костюма, количества эмоций и трекинга.</p></div><a class="link" href="/prices/">Что влияет на цену ↗</a></div>
</div></section>

<section class="section wrap" id="journal"><div class="section-head rv"><div><span class="kicker">04 · Журнал</span><h2>Прочитать <em>до заказа</em></h2></div><p>Немного ясности перед большим перевоплощением.</p></div>
<div class="posts">{journal_cards}</div><p style="margin-top:24px"><a class="link" href="/journal/">Все статьи журнала →</a></p></section>

<section class="section wrap faq" id="faq"><div class="rv"><span class="kicker">05 · Вопросы</span><h2 style="font-size:clamp(40px,5vw,68px);margin-top:14px">Поговорим <em>о важном</em></h2><p style="color:var(--mute);margin-top:18px">Не нашёл ответ? Напиши в <a class="link" data-contact="telegram" href="{TG}">Telegram</a>.</p></div>
<div class="faq-list"><details class="rv"><summary>У меня нет рисунка. С чего начать?</summary><p>С описания и подборки референсов: характер, одежда, палитра, настроение. Отметь понравившиеся концепты сердечком — они попадут в бриф. Разработку дизайна согласуем отдельным этапом.</p></details>
<details class="rv"><summary>Где будет работать модель?</summary><p>Программу выбираем до начала проекта. Для VSeeFace, Warudo и VRChat нужны разные настройки и форматы. Поддержку трекинга фиксируем в составе работ.</p></details>
<details class="rv"><summary>Можно доработать существующую модель?</summary><p>Да, начнём с аудита. Понадобятся исходные файлы и право на их изменение. Проверим геометрию, материалы и риг, затем предложим доработки.</p></details>
<details class="rv"><summary>Можно заказать персонажа как в концептах?</summary><p>Концепты показывают стиль. Мы сделаем оригинального персонажа в этой эстетике под твою идею — копии чужих образов не делаем.</p></details>
<details class="rv"><summary>Сколько стоит модель витубера?</summary><p>Цена договорная: считаем смету по брифу и фиксируем её до старта. <a class="link" href="/prices/">Что влияет на цену</a>.</p></details>
<details class="rv"><summary>Какие файлы и права я получу?</summary><p>Форматы экспорта, исходники, коммерческое использование и эксклюзивность согласуем письменно до начала работы.</p></details></div></section>

<section class="wrap"><div class="cta rv"><span class="kicker">Следующая история — твоя</span><h2 style="margin-top:18px">Кем ты хочешь <em>стать?</em></h2><p>Одна идея — целый новый мир. Опиши персонажа, а мы вернёмся с планом и оценкой.</p>
<div class="hero-actions"><button class="btn btn-lime" data-brief>Составить бриф <span class="arr">↗</span></button><a class="btn btn-glass" data-contact="telegram" href="{TG}">Написать в Telegram</a></div></div></section>
</main>
<div class="moodbar" role="region" aria-label="Мудборд"><span class="heart">{ICON_HEART}</span><div class="txt"><strong>Здесь соберётся твой мудборд</strong><span>Отмечай сердечком персонажей, которые откликаются</span></div><div class="mood-faces"></div><button class="btn btn-lime btn-sm" id="bar-brief">Собрать бриф <span class="arr">→</span></button></div>'''
    char_dialog = f'''<dialog id="char-dialog" aria-labelledby="char-title"><div class="char-layout"><div class="char-stage" data-style="pastel"><div class="alive" data-alive-dialog></div></div>
<div class="char-panel"><div class="dlg-top" style="padding:12px 0 0"><span class="kicker" data-c-style>Pastel Kawaii</span><button class="x" aria-label="Закрыть">×</button></div>
<h2 id="char-title">Mimi</h2><p data-c-tagline></p><p data-c-desc></p>
<span class="ctl-label">Характер</span><div class="traits" data-c-traits></div>
<span class="ctl-label">Палитра</span><div class="palette-row" data-c-palette></div>
<p class="small-note">Потяни персонажа — он наклонится, волосы раскачаются. Нажми — и он заговорит ♡</p>
<div class="hero-actions" style="margin-top:auto"><a class="btn btn-lime btn-sm" href="https://t.me/Egor_shks" target="_blank" rel="noopener">Заказать в этом стиле ↗</a><button class="like" id="char-like" data-like="mimi" aria-pressed="false" aria-label="В мудборд" style="position:static">{ICON_HEART}</button></div></div></div></dialog>'''
    (DIST / 'index.html').write_text(page(head, body, True, char_dialog), encoding='utf-8')

# ---------- inner pages ----------
RELATED = [
    ('/services/model-vitubera/', 'Услуга', 'Модель витубера на заказ', '2D и 3D, от идеи до эфира'),
    ('/services/2d-vtuber-model/', 'Услуга', '2D-модель и Live2D', 'Арт, слои и риг для VTube Studio'),
    ('/services/pngtuber/', 'Услуга', 'PNGTuber-аватар', 'Быстрый старт для стримов'),
    ('/services/vrchat-avatar/', 'Услуга', 'Аватар для VRChat', '3D-аватар с физикой и мимикой'),
    ('/journal/kak-stat-vituberom/', 'Журнал', 'Как стать витубером', 'Пошаговый план для старта'),
    ('/journal/vseeface/', 'Журнал', 'Настройка VSeeFace', 'Модель, трекинг и OBS'),
    ('/journal/warudo/', 'Журнал', 'Warudo для новичков', '3D-витубинг с блюпринтами'),
    ('/journal/vroid-ili-zakaz/', 'Журнал', 'VRoid или модель на заказ', 'Что выбрать новичку'),
    ('/journal/gde-zakazat-model-vitubera/', 'Журнал', 'Где заказать модель витубера', 'Как выбрать исполнителя'),
    ('/journal/vtube-studio/', 'Журнал', 'VTube Studio', 'Запуск 2D-модели'),
    ('/services/3d-vtuber-model/', 'Услуга', '3D-модель на заказ', 'Состав проекта, бюджет и этапы.'),
    ('/services/rigging/', 'Услуга', 'Риггинг и мимика', 'Скелет, веса и лицевые формы.'),
    ('/services/vrm/', 'Услуга', 'VRM и эфир', 'Экспорт и настройка под программу.'),
    ('/journal/3d-vtuber-price/', 'Журнал', 'Сколько стоит 3D-модель', 'Из чего складывается цена.'),
    ('/journal/2d-or-3d/', 'Журнал', '2D или 3D', 'Какой персонаж нужен стримам.'),
    ('/journal/vtuber-brief/', 'Журнал', 'Собрать референсы', 'Как подготовить бриф.'),
]

def slug(t, i):
    return f's{i+1}'

def article(rel):
    src = (SRC / rel / 'index.html').read_text(encoding='utf-8')
    main = re.search(r'<main.*?</main>', src, re.S).group(0)
    crumbs = re.findall(r'<div class="breadcrumb">(.*?)</div>', main, re.S)[0]
    section = re.findall(r'<span>([^<]+)</span></div>', main)
    section = section[0] if section else 'Студия'
    h1 = re.search(r'<h1>(.*?)</h1>', main, re.S).group(1)
    h1 = re.sub(r'<span class="accent">\.</span>', '', h1).strip()
    intro = re.search(r'<p class="article-intro">(.*?)</p>', main, re.S).group(1)
    content = re.search(r'<article class="article-content">(.*)</article>', main, re.S).group(1)
    content = re.sub(r'<div class="article-cta">.*?</div>', '', content, flags=re.S)
    heads = []
    def addid(m):
        i = len(heads); heads.append(re.sub('<[^>]+>', '', m.group(1)))
        return f'<h2 id="{slug(m.group(1), i)}">{m.group(1)}</h2>'
    content = re.sub(r'<h2>(.*?)</h2>', addid, content)
    toc = ''.join(f'<a href="#s{i+1}">{escape(h)}</a>' for i, h in enumerate(heads))
    # split title: emphasise text after colon
    if ':' in h1:
        a, b = h1.split(':', 1)
        title = f'{a}: <em>{b.strip()}</em>'
    else:
        title = h1
    url = '/' + rel.strip('/') + '/'
    pool = [r for r in RELATED if r[0] != url]
    same = [r for r in pool if (r[1] == 'Журнал') == (section == 'Журнал')]
    k = sum(map(ord, url)) % max(1, len(same))
    rel_cards = (same[k:] + same[:k] + pool)[:3]
    related = ''.join(f'<a class="post" href="{u}"><span class="mono">{k}</span><span class="go">↗</span><h3>{escape(t)}</h3><p>{escape(d)}</p></a>' for u, k, t, d in rel_cards)
    body = f'''<main id="main" class="page wrap">
<nav class="crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a><span>/</span><span>{escape(section)}</span></nav>
<header class="page-hero"><div><span class="kicker">NORMAS · {escape(section)}</span><h1 style="margin-top:16px">{title}</h1></div><p class="lead">{intro}</p></header>
<div class="article"><nav class="toc" aria-label="Содержание">{toc}</nav><div class="prose">{content}
<div class="callout"><span class="kicker">Следующий шаг</span><h2 style="margin-top:12px!important">Начнём с твоей идеи?</h2><p>Собери описание персонажа в коротком брифе — вернёмся с планом и оценкой.</p><div class="hero-actions"><button class="btn btn-lime" data-brief>Составить бриф <span class="arr">↗</span></button><a class="btn btn-glass" data-contact="telegram" href="{TG}">Telegram</a></div></div>
</div></div>
<section class="section"><div class="section-head"><h2 style="font-size:clamp(32px,4vw,52px)">Читать <em>дальше</em></h2></div><div class="related">{related}</div></section>
</main>'''
    crumbs_ld = {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Главная', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': section, 'item': SITE + ('/journal/' if section == 'Журнал' else '/services/model-vitubera/')},
        {'@type': 'ListItem', 'position': 3, 'name': re.sub('<[^>]+>', '', h1), 'item': SITE + url}]}
    (DIST / rel).mkdir(parents=True, exist_ok=True)
    (DIST / rel / 'index.html').write_text(page(head_from(src, f'<script type="application/ld+json">{json.dumps(crumbs_ld, ensure_ascii=False)}</script>'), body), encoding='utf-8')

def order():
    rel = 'services/3d-vtuber-model'
    src = (SRC / rel / 'index.html').read_text(encoding='utf-8')
    folders = ''.join([
        folder(1, 'Образ и модель', 'Силуэт, костюм, волосы и материалы — от референсов до готовой геометрии.', '#FFB7D5', '#E58BB6', 'mimi',
               [('Бриф', 'Референсы'), ('Концепт', 'Силуэт и палитра'), ('3D', 'Геометрия и текстуры')],
               [('Открыть 3D-коллекцию', '/#characters'), ('Подготовить референсы', '/journal/vtuber-brief/')]),
        folder(2, 'Движение и мимика', 'Скелет, веса, лицевые формы и физика волос и одежды.', '#C5A3FF', '#8F6BE0', 'lumi',
               [('Риг', 'Скелет и веса'), ('Мимика', 'Blend shapes'), ('Физика', 'Волосы и одежда')],
               [('Узнать о риггинге', '/services/rigging/'), ('Сравнить 2D и 3D', '/journal/2d-or-3d/')]),
        folder(3, 'Выход в эфир', 'Экспорт, настройка под программу и проверка перед первым стримом.', '#A8DCFF', '#5BAAE0', 'momo',
               [('Экспорт', 'VRM · GLB'), ('Настройка', 'VSeeFace · Warudo'), ('Проверка', 'Тестовый эфир')],
               [('Подготовка модели к эфиру', '/services/vrm/'), ('Из чего складывается цена', '/journal/3d-vtuber-price/')]),
    ])
    body = f'''<main id="main" class="page wrap">
<nav class="crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a><span>/</span><span>Услуги</span></nav>
<section class="order-hero" aria-labelledby="order-title"><div class="order-copy"><span class="kicker">NORMAS · Услуга</span>
<h1 id="order-title">3D-модель витубера <em>на заказ</em></h1>
<p class="lead">Создадим персонажа для твоих стримов: начнём с образа, соберём модель, настроим риг и мимику и проверим её в твоей программе.</p>
<div class="hero-actions"><a class="btn btn-lime" data-contact="telegram" href="{TG}">Обсудить заказ <span class="arr">↗</span></a><button class="btn btn-glass" data-brief>Подготовить бриф</button></div>
<p class="hero-note">Удобнее по почте? <a data-contact="email" href="mailto:{MAIL}">{MAIL}</a></p></div>
<figure class="order-art" style="margin:0"><div class="alive" data-alive-hero data-neck="{CHARS[1]['neck']}" data-hip="{CHARS[1]['hip']}" data-src="/assets/chars/lumi.webp"><img class="ph" src="/assets/chars/lumi-sm.webp" alt="Lumi — концепт VTuber-персонажа NORMAS" width="512" height="768"></div><span class="chip c1"><b></b>Потяни меня ↔</span><a class="chip c2" href="/#characters" style="top:auto;bottom:24px;left:auto;right:24px">Все концепты ↗</a></figure></section>

<section class="section"><div class="section-head"><div><span class="kicker">01 · Состав проекта</span><h2>От референса <em>до эфира</em></h2></div><p>Открой папку, чтобы посмотреть этапы и связанные материалы.</p></div><div class="folders">{folders}</div></section>

<section class="section"><div class="info-grid">
<div class="tile glow"><div><span class="kicker">02 · Бюджет</span><h3 style="margin-top:14px">Цена 3D-модели — договорная</h3><p>Смета зависит от исходного дизайна, сложности костюма и волос, набора эмоций и требований к трекингу. Можно заказать модель с нуля или доработку готового файла.</p><p>Пришлите бриф: референсы, программу для стримов и желаемые сроки — назовём цену и зафиксируем её до старта.</p></div><a class="link" href="/prices/">Что влияет на цену ↗</a></div>
<div class="tile"><div><span class="kicker">03 · Результат</span><h3 style="margin-top:14px">Что ты получишь</h3><p>Готовую модель в согласованном формате и рекомендации по запуску. До начала работы фиксируем, какие выражения лица, физика, аксессуары, исходники и права использования входят в заказ.</p><p>Нужен VRM для VSeeFace или Warudo — укажи программу в брифе. Совместимость конкретной версии проверяем отдельно.</p></div><div class="pills"><span>VRM</span><span>GLB</span><span>VSeeFace</span><span>Warudo</span><span>VRChat</span></div></div>
</div></section>

<section class="section faq"><div><span class="kicker">04 · Вопросы</span><h2 style="font-size:clamp(36px,4.6vw,60px);margin-top:14px">Перед <em>заказом</em></h2></div><div class="faq-list">
<details><summary>Можно начать без готового рисунка?</summary><p>Да. Подойдут примеры одежды, палитры и силуэта, описание характера и список деталей, которые должны быть у персонажа.</p></details>
<details><summary>Можно купить готовую модель из коллекции?</summary><p>Коллекция показывает примеры в 3D. По конкретному персонажу напиши нам: уточним доступность модели, формат файла и условия использования.</p></details>
<details><summary>Где посмотреть 3D-модели?</summary><p>В <a class="link" href="/#characters">коллекции NORMAS</a> можно повернуть персонажей, приблизить их и проверить доступную мимику.</p></details></div></section>

<div class="cta"><span class="kicker">Следующий шаг</span><h2 style="margin-top:18px">Расскажи о своём <em>персонаже</em></h2><p>Telegram — самый быстрый способ. Или собери бриф и пришли файлом.</p><div class="hero-actions"><a class="btn btn-lime" data-contact="telegram" href="{TG}">Написать в Telegram <span class="arr">↗</span></a><button class="btn btn-glass" data-brief>Составить бриф</button></div></div>
</main>'''
    (DIST / rel / 'index.html').write_text(page(head_from(src), body), encoding='utf-8')

ORG = {'@type': 'Organization', 'name': 'NORMAS', 'url': SITE + '/', 'logo': SITE + '/assets/og/normas.png', 'email': MAIL,
       'sameAs': [TG], 'contactPoint': {'@type': 'ContactPoint', 'contactType': 'customer service', 'url': TG, 'email': MAIL, 'availableLanguage': ['ru', 'en']}}

def ld(obj):
    return f'<script type="application/ld+json">{json.dumps(obj, ensure_ascii=False)}</script>'

def ld_home():
    faq = [('Сколько стоит модель витубера?', 'Цена договорная: считаем смету по брифу и фиксируем её до старта.'),
           ('У меня нет рисунка. С чего начать?', 'С описания и подборки референсов. Дизайн персонажа разработаем отдельным этапом.'),
           ('Где будет работать модель?', 'В выбранной программе: VTube Studio, VSeeFace, Warudo или VRChat. Программу фиксируем до начала работы.')]
    return ld({'@context': 'https://schema.org', '@graph': [
        dict(ORG, **{'@id': SITE + '/#org', 'description': 'Студия моделей витуберов: 2D (Live2D), 3D, PNGTuber и аватары для VRChat на заказ.'}),
        {'@type': 'WebSite', '@id': SITE + '/#site', 'url': SITE + '/', 'name': 'NORMAS', 'inLanguage': 'ru', 'publisher': {'@id': SITE + '/#org'}},
        {'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faq]}]})

def write_sources():
    """Write SEO pages as sources in the old article format so article() renders them."""
    for kind, items in (('Услуги', SERVICES), ('Журнал', ARTICLES)):
        for x in items:
            url = SITE + '/' + x['rel'] + '/'
            faq_html = ''.join(f'<h3>{escape(q)}</h3><p>{escape(a)}</p>' for q, a in x.get('faq', []))
            body = x['body'] + (f'<h2>Частые вопросы</h2>{faq_html}' if faq_html else '')
            graph = []
            if kind == 'Услуги':
                graph.append({'@type': 'Service', 'name': x['h1'], 'description': x['desc'], 'url': url, 'areaServed': 'RU', 'serviceType': x['short'],
                              'provider': {'@type': 'Organization', 'name': 'NORMAS', 'url': SITE + '/'},
                              'offers': {'@type': 'Offer', 'priceCurrency': 'RUB', 'description': 'Цена договорная, смета после брифа', 'url': url}})
            else:
                graph.append({'@type': 'Article', 'headline': x['h1'], 'description': x['desc'], 'url': url, 'inLanguage': 'ru',
                              'datePublished': '2026-11-06', 'dateModified': '2026-11-06', 'image': SITE + '/assets/og/normas.png',
                              'author': {'@type': 'Organization', 'name': 'NORMAS', 'url': SITE + '/'}, 'publisher': {'@type': 'Organization', 'name': 'NORMAS', 'url': SITE + '/'}})
            if x.get('faq'):
                graph.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in x['faq']]})
            html = f"""<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(x['title'])}</title><meta name="description" content="{escape(x['desc'])}"><meta name="robots" content="index,follow">
<meta property="og:title" content="{escape(x['title'])}"><meta property="og:description" content="{escape(x['desc'])}"><meta property="og:type" content="{'article' if kind == 'Журнал' else 'website'}">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="canonical" href="{url}"><meta property="og:url" content="{url}">
{ld({'@context': 'https://schema.org', '@graph': graph})}</head><body><main id="main" class="article-shell"><div class="breadcrumb"><a href="/">Главная</a><span> / </span><span>{kind}</span></div>
<p class="eyebrow">NORMAS</p><h1>{x['h1']}<span class="accent">.</span></h1><p class="article-intro">{x['intro']}</p><article class="article-content">{body}<div class="article-cta"></div></article></main></body></html>"""
            out = SRC / x['rel'] / 'index.html'
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(html, encoding='utf-8')

def journal_index():
    items = [(a['rel'], a['short'], a['card']) for a in ARTICLES] + [('journal/3d-vtuber-price', 'Сколько стоит 3D-модель', 'Из чего складывается цена'), ('journal/2d-or-3d', '2D или 3D', 'Какой персонаж нужен стримам'), ('journal/vtuber-brief', 'Референсы и бриф', 'Как подготовить идею персонажа')]
    cards = ''.join(f'<a class="post" href="/{r}/"><span class="mono">Журнал</span><span class="go">↗</span><h3>{escape(t)}</h3><p>{escape(d)}</p></a>' for r, t, d in items)
    title = 'Журнал о витуберах: гайды, программы и модели | NORMAS'
    desc = 'Статьи для витуберов: как стать витубером, настройка VTube Studio, VSeeFace и Warudo, выбор между 2D и 3D, где заказать модель витубера.'
    head = head_from(f"""<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><meta name="description" content="{desc}"><meta name="robots" content="index,follow"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="canonical" href="{SITE}/journal/"><meta property="og:url" content="{SITE}/journal/"></head>""",
                     ld({'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Журнал NORMAS', 'url': SITE + '/journal/', 'inLanguage': 'ru',
                         'hasPart': [{'@type': 'Article', 'headline': t, 'url': f'{SITE}/{r}/'} for r, t, d in items]}))
    body = f"""<main id="main" class="page wrap"><nav class="crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a><span>/</span><span>Журнал</span></nav>
<header class="page-hero"><div><span class="kicker">NORMAS · Журнал</span><h1 style="margin-top:16px">Журнал <em>для витуберов</em></h1></div><p class="lead">Гайды по программам, советы по выбору модели и всё, что стоит знать перед стартом.</p></header>
<section class="section" style="padding-top:50px"><div class="related">{cards}</div></section></main>"""
    (DIST / 'journal').mkdir(exist_ok=True)
    (DIST / 'journal' / 'index.html').write_text(page(head, body), encoding='utf-8')

def sitemap():
    urls = sorted('/' + str(p.parent.relative_to(DIST)).replace('\\', '/') + '/' if p.parent != DIST else '/' for p in DIST.rglob('index.html'))
    urls = [u.replace('//', '/') for u in urls]
    pri = lambda u: '1.0' if u == '/' else '0.9' if u.startswith('/services/') or u == '/prices/' else '0.7'
    body = ''.join(f'<url><loc>{SITE}{u}</loc><lastmod>2026-11-06</lastmod><priority>{pri(u)}</priority></url>' for u in urls)
    (DIST / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>', encoding='utf-8')
    return urls

write_sources()
home()
order()
for rel in ['services/rigging', 'services/vrm', 'journal/2d-or-3d', 'journal/3d-vtuber-price', 'journal/vtuber-brief', 'credits'] + [x['rel'] for x in SERVICES + ARTICLES]:
    article(rel)
journal_index()
print('sitemap:', len(sitemap()), 'urls')
print('NORMAS pages generated')
