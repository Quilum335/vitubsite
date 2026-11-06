"""Generate NORMAS HTML pages in the dark-studio design.

Sources for inner pages live in tools/source (snapshot of the previous design);
the script is idempotent: run `python tools/build_pages.py` from the repo root.
"""
from pathlib import Path
from html import escape
import json, re, struct

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
SRC = ROOT / 'tools' / 'source'
SITE = 'https://normas.eu.cc'
TG = 'https://t.me/Egor_shks'
MAIL = 'quilum335@gmail.com'

CHAR = {
    'Catgirl':   ('casual fantasy', 'Повседневный', 'Кошачьи ушки и хвост, лавандовое худи и гольфы. Уютный стримерский образ.', 'кошка неко catgirl худи сиреневый'),
    'Lilac':     ('casual', 'Повседневный', 'Рыжая героиня в лавандовом худи и джинсовых шортах.', 'рыжая худи шорты casual'),
    'Teal':      ('casual', 'Уличный', 'Каре, джинсовая куртка и карго. Городской образ.', 'каре куртка карго street'),
    'Rang':      ('fantasy sculpt', 'Аниме · скульпт', 'Аниме-героиня с длинными хвостами и посохом. Скульпт без текстур.', 'аниме хвосты посох магия'),
    'Demoneesa': ('fantasy sculpt', 'Фэнтези · скульпт', 'Демоница с рожками, крыльями и хвостом. Скульпт без текстур.', 'демон рога крылья хвост'),
    'Succub':    ('fantasy', 'Фэнтези', 'Суккуб с рогами и алыми волосами. Яркий фэнтези-образ.', 'суккуб демон рога красные волосы'),
    'Devil':     ('fantasy', 'Аниме', 'Чертовка в школьной форме с хвостом и рожками.', 'чертовка аниме школьная форма демон'),
    'Coral':     ('sculpt', 'База · скульпт', 'Базовая женская фигура: основа под костюм и стиль.', 'база фигура тело'),
    'Turquoise': ('sculpt', 'База · скульпт', 'Атлетичная базовая фигура для будущего персонажа.', 'база атлетичная фигура тело'),
    'Sunshine':  ('sculpt', 'База', 'Реалистичная героиня в жёлтом боди: база под одежду.', 'реалистичная база боди'),
}

def png_size(p):
    b = p.read_bytes()[:24]
    return struct.unpack('>II', b[16:24])

models = json.loads((DIST / 'assets/models.json').read_text(encoding='utf-8'))
for m in models:
    kind, tag, cap, kw = CHAR[m['id']]
    m['caption'] = cap
    m['tag'] = tag
    m['kind'] = kind
    m['keywords'] = kw
(DIST / 'assets/models.json').write_text(json.dumps(models, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT / 'src/models.js').write_text('export const models=' + json.dumps(models, ensure_ascii=False) + ';\n', encoding='utf-8')

ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
ICON_HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 7.9 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.5 0 5.7 3.4 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2Z"/></svg>'

NAV = [('#characters', 'Персонажи'), ('#services', 'Услуги'), ('#process', 'Процесс'), ('#journal', 'Журнал'), ('#faq', 'FAQ')]

def header(home):
    pre = '' if home else '/'
    seg = ''.join(f'<a href="{pre}{h}">{t}</a>' for h, t in NAV)
    drawer = ''.join(f'<a href="{pre}{h}">{t}</a>' for h, t in NAV)
    solid = '' if home else ' solid'
    return f'''<header class="site-header{solid}"><div class="bar">
<a class="logo" href="/" aria-label="NORMAS — главная"><span class="logo-mark" aria-hidden="true">✳</span><span>NORMAS<small>3D VTUBER STUDIO</small></span></a>
<nav class="seg" aria-label="Основная навигация">{seg}</nav>
<button class="search-trigger" data-search aria-label="Поиск по сайту">{ICON_SEARCH}<span>Поиск</span><kbd>Ctrl K</kbd></button>
<a class="btn btn-lime btn-sm header-cta" href="/services/3d-vtuber-model/">Заказать модель</a>
<button class="menu-btn" aria-label="Меню" aria-expanded="false"><i></i><i></i></button>
</div></header>
<div class="drawer" aria-label="Мобильное меню">{drawer}<a class="btn btn-lime" href="/services/3d-vtuber-model/">Заказать модель <span class="arr">↗</span></a></div>'''

def footer():
    return f'''<footer class="site-footer"><div class="wrap">
<div><a class="logo" href="/"><span class="logo-mark" aria-hidden="true">✳</span><span>NORMAS<small>3D VTUBER STUDIO</small></span></a><p>3D VTuber-модели на заказ: образ, моделирование, риг, мимика и подготовка к эфиру.</p></div>
<div><h4>Услуги</h4><a href="/services/3d-vtuber-model/">3D-модель на заказ</a><a href="/services/rigging/">Риггинг и мимика</a><a href="/services/vrm/">VRM и эфир</a></div>
<div><h4>Журнал</h4><a href="/journal/3d-vtuber-price/">Цена 3D-модели</a><a href="/journal/2d-or-3d/">2D или 3D</a><a href="/journal/vtuber-brief/">Референсы и бриф</a></div>
<div><h4>Связь</h4><a data-contact="telegram" href="{TG}">Telegram ↗</a><a data-contact="email" href="mailto:{MAIL}">{MAIL}</a><a href="https://renigt.online/">Каталог на Renigt ↗</a><a href="/credits/">О моделях</a></div>
</div><div class="wrap" style="display:block;margin-top:40px"><span class="mono">© 2026 NORMAS · Персонажи с характером</span></div></footer>'''

def brief_dialog():
    return f'''<dialog id="brief-dialog" aria-labelledby="brief-title"><div class="dlg-top"><span class="kicker">Бриф на персонажа</span><button class="x" aria-label="Закрыть">×</button></div>
<div class="brief-body"><h2 id="brief-title">Расскажи, <em>кем</em> хочешь стать</h2><p>Пять полей — и мы вернёмся с оценкой состава работ, сроков и бюджета.</p>
<form id="brief-form"><div class="row"><label>Имя или ник<input name="name" required maxlength="120" placeholder="Например, Mira" autocomplete="nickname"></label>
<label>Программа<select name="platform"><option>Пока не знаю</option><option>VSeeFace</option><option>Warudo</option><option>VRChat</option><option>VNyan</option><option>Другая</option></select></label></div>
<label>Что нужно<select name="service"><option>3D-персонаж с нуля</option><option>Модель по готовому концепту</option><option>Риггинг и мимика</option><option>Доработать существующую модель</option><option>Настройка для стримов</option></select></label>
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
    return (head + '\n<meta name="theme-color" content="#07060b">'
            '\n<link rel="preload" href="/assets/manrope-cyrillic.woff2" as="font" type="font/woff2" crossorigin>'
            '\n<link rel="stylesheet" href="/assets/normas.css">'
            '\n<script src="/assets/config.js" defer></script><script src="/assets/normas.js" defer></script>' + extra)

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
def card(m):
    w, h = png_size(DIST / m['poster'].lstrip('/'))
    ar = f'{w}/{h}'
    kind = m['kind']
    return f'''<article class="card rv" data-name="{escape(m['name'])}" data-kind="{kind}" data-text="{escape(m['caption'] + ' ' + m['keywords'] + ' ' + m['tag'])}">
<span class="tag">{escape(m['tag'])}</span><button class="like" data-like="{m['id']}" aria-pressed="false" aria-label="В мудборд: {escape(m['name'])}">{ICON_HEART}</button>
<img class="art" src="{m['poster']}" alt="{escape(m['name'])} — 3D VTuber-модель" width="{w}" height="{h}" style="--ar:{ar}" loading="lazy" decoding="async">
<div class="meta"><span class="mono">{m['index']} / {'GLB' if 'sculpt' not in kind else 'SCULPT'}</span><h3>{escape(m['name'])}</h3><p>{escape(m['caption'])}</p>
<button class="btn btn-glass btn-sm open3d" data-model="{m['id']}">Открыть в 3D <span class="arr">↗</span></button></div></article>'''

def folder(n, title, desc, f1, f2, img, files, links):
    fhtml = ''.join(f'<span class="f-file"><small>{escape(s)}</small><span>{escape(t)}<i></i><i></i><i></i></span></span>' for s, t in files)
    lhtml = ''.join(f'<a href="{u}">{escape(t)} <span aria-hidden="true">↗</span></a>' for t, u in links)
    return f'''<div class="folder rv"><div class="folder-obj" role="button" tabindex="0" aria-expanded="false" aria-label="Открыть папку «{escape(title)}»" style="--f1:{f1};--f2:{f2}">
<span class="f-back"><img src="/assets/{img}-poster.png" alt="" loading="lazy"></span><span class="f-tab"></span>
<span class="f-files">{fhtml}</span>
<span class="f-glass"><strong>{escape(title)}</strong><span class="count">0{n} · {len(files)} файла</span></span></div>
<div><h3>{escape(title)}</h3><p>{escape(desc)}</p></div>
<button class="folder-toggle" aria-expanded="false">Что внутри</button>
<div class="folder-links">{lhtml}</div></div>'''

def home():
    src = (SRC / 'index.html').read_text(encoding='utf-8')
    head = head_from(src, '\n<link rel="preload" href="/assets/Catgirl-poster.png" as="image">')
    avatars = ''.join(f'<button data-hero-model="{m["id"]}" class="{"active" if i == 0 else ""}" aria-pressed="{"true" if i == 0 else "false"}" aria-label="Показать {escape(m["name"])}"><img src="{m["poster"]}" alt="" loading="lazy"></button>' for i, m in enumerate(models))
    cards = '\n'.join(card(m) for m in models)
    marquee_items = ['3D VTuber-модели на заказ', 'Риггинг и мимика', 'VRM · GLB', 'VSeeFace', 'Warudo', 'VRChat', 'Дизайн персонажа с нуля', 'Доработка готовых моделей', 'Подготовка к первому эфиру']
    mq = ''.join(f'<span>{t}</span>' for t in marquee_items)
    folders = ''.join([
        folder(1, 'Образ и модель', 'Силуэт, костюм, волосы и материалы. Можно прийти с артом или только с идеей — образ соберём вместе.', '#6b55d6', '#2c2268', 'Catgirl',
               [('Бриф', 'Референсы'), ('Концепт', 'Силуэт и палитра'), ('3D', 'Геометрия и текстуры')],
               [('Как создаётся 3D-модель', '/services/3d-vtuber-model/'), ('Подготовить референсы', '/journal/vtuber-brief/'), ('Посмотреть примеры в 3D', '#characters')]),
        folder(2, 'Движение и мимика', 'Скелет, веса, лицевые формы и физика. Персонаж моргает, говорит и реагирует так, как задумано.', '#3f8f7a', '#173b33', 'Teal',
               [('Риг', 'Скелет и веса'), ('Мимика', 'Blend shapes'), ('Физика', 'Волосы и одежда')],
               [('Риггинг и мимика', '/services/rigging/'), ('2D или 3D: что выбрать', '/journal/2d-or-3d/')]),
        folder(3, 'Выход в эфир', 'Экспорт в VRM или GLB, настройка под твою программу и проверка перед первым стримом.', '#c0577f', '#4a1b33', 'Succub',
               [('Экспорт', 'VRM · GLB'), ('Настройка', 'VSeeFace · Warudo'), ('Проверка', 'Тестовый эфир')],
               [('VRM и подготовка к эфиру', '/services/vrm/'), ('Из чего складывается цена', '/journal/3d-vtuber-price/')]),
    ])
    body = f'''<main id="main">
<section class="hero wrap" id="top"><div class="hero-card"><canvas class="waves" aria-hidden="true"></canvas><span class="hero-sun" aria-hidden="true"></span>
<div class="hero-grid"><div class="hero-copy">
<span class="kicker">NORMAS · 3D VTuber studio</span>
<h1>3D VTuber-модели <em>на заказ</em></h1>
<p class="lead">Создаём персонажей для стримов: образ, моделирование, риг и мимика, настройка под VSeeFace, Warudo и VRChat. Покрути наших героев прямо здесь.</p>
<div class="hero-actions"><a class="btn btn-lime" href="/services/3d-vtuber-model/">Заказать модель <span class="arr">↗</span></a><a class="btn btn-glass" href="#characters">Смотреть в 3D</a></div>
<p class="hero-note">Уже знаешь, чего хочешь? <a href="#" data-brief>Опиши персонажа в брифе ↗</a></p>
</div>
<div class="hero-stage"><div class="viewer hero-viewer" data-hero-viewer data-start="Catgirl"><img class="poster" src="/assets/Catgirl-poster.png" alt="Catgirl — 3D VTuber-персонаж" width="720" height="864"><span class="loading">Загружаем 3D…</span></div>
<span class="chip c1"><b></b>Риг + мимика</span><span class="chip c2">VRM · GLB</span><span class="chip c3">Крути мышью ↔</span></div></div>
<div class="hero-switch"><div class="now"><span data-hero-caption>3D GLB · 001</span><strong data-hero-name>Catgirl</strong></div><div class="avatars" role="group" aria-label="Выбрать персонажа">{avatars}</div><button class="btn btn-glass btn-sm" data-hero-open data-model="Catgirl">Подробнее ↗</button></div>
</div>
<div class="marquee" aria-hidden="true"><div class="marquee-track">{mq}{mq}</div></div></section>

<section class="section wrap" id="characters"><div class="section-head rv"><div><span class="kicker">01 · Коллекция</span><h2>К кому <em>тянет?</em></h2></div><p>Десять персонажей в 3D. Отмечай сердечком тех, кто откликается, — соберём из них мудборд и добавим в бриф.</p></div>
<div class="toolbar"><div class="filters" role="group" aria-label="Фильтр"><button class="active" aria-pressed="true" data-filter="all">Все</button><button aria-pressed="false" data-filter="casual">Повседневные</button><button aria-pressed="false" data-filter="fantasy">Аниме и фэнтези</button><button aria-pressed="false" data-filter="sculpt">Скульпты и базы</button></div>
<label class="inline-search">{ICON_SEARCH}<input id="gallery-search" type="search" placeholder="Кошка, демон, худи…" aria-label="Поиск по персонажам"></label></div>
<div class="masonry">{cards}</div><p class="empty gallery-empty" hidden>Никого не нашли. Попробуй другой запрос — или <a class="link" href="#" data-brief>опиши своего персонажа</a>.</p></section>

<section class="section wrap" id="services"><div class="section-head rv"><div><span class="kicker">02 · Услуги</span><h2>Три папки — <em>один персонаж</em></h2></div><p>Нажми на папку: внутри этапы работы и всё, что стоит прочитать до заказа.</p></div>
<div class="folders">{folders}</div></section>

<section class="section wrap" id="process"><div class="section-head rv"><div><span class="kicker">03 · Процесс</span><h2>От идеи <em>до эфира</em></h2></div><p>Состав работ, сроки и бюджет фиксируем до старта — без сюрпризов в конце.</p></div>
<div class="bento">
<div class="tile w4 glow rv"><div><h3>Как проходит заказ</h3><p>Каждый этап согласуем с тобой и показываем промежуточный результат.</p></div><ol class="steps"><li>Бриф и референсы<span>ты рассказываешь об идее</span></li><li>Концепт и смета<span>фиксируем состав и сроки</span></li><li>Моделирование и текстуры<span>показываем рендеры</span></li><li>Риг, мимика, физика<span>проверяем в движении</span></li><li>Экспорт и настройка<span>готово к стриму</span></li></ol></div>
<div class="tile w2 rv"><span class="num">10</span><div><h3>моделей в 3D</h3><p>Покрути любую прямо на сайте — с мимикой там, где она есть.</p></div></div>
<div class="tile w3 rv"><div><h3>Под твою программу</h3><p>Формат и трекинг выбираем до начала работы и проверяем перед передачей.</p></div><div class="pills"><span>VSeeFace</span><span>Warudo</span><span>VRChat</span><span>VNyan</span><span>VRM</span><span>GLB</span></div></div>
<div class="tile w3 rv"><div><h3>Бюджет — по брифу</h3><p>Цена зависит от концепта, костюма, волос, количества эмоций и требований к трекингу.</p></div><a class="link" href="/journal/3d-vtuber-price/">Из чего складывается цена ↗</a></div>
</div></section>

<section class="section wrap" id="journal"><div class="section-head rv"><div><span class="kicker">04 · Журнал</span><h2>Прочитать <em>до заказа</em></h2></div><p>Немного ясности перед большим перевоплощением.</p></div>
<div class="posts"><a class="post rv" href="/journal/3d-vtuber-price/"><span class="mono">01 · Бюджет</span><span class="go">↗</span><h3>Сколько стоит новое «я»</h3><p>Из чего складывается цена 3D VTuber-модели и как сравнивать предложения.</p></a>
<a class="post rv" href="/journal/2d-or-3d/"><span class="mono">02 · Формат</span><span class="go">↗</span><h3>Плоскость или объём</h3><p>2D или 3D: какой персонаж нужен твоим стримам.</p></a>
<a class="post rv" href="/journal/vtuber-brief/"><span class="mono">03 · Замысел</span><span class="go">↗</span><h3>Собрать вдохновение</h3><p>Как подготовить референсы, чтобы модель получилась той самой.</p></a></div></section>

<section class="section wrap faq" id="faq"><div class="rv"><span class="kicker">05 · Вопросы</span><h2 style="font-size:clamp(40px,5vw,68px);margin-top:14px">Поговорим <em>о важном</em></h2><p style="color:var(--mute);margin-top:18px">Не нашёл ответ? Напиши в <a class="link" data-contact="telegram" href="{TG}">Telegram</a>.</p></div>
<div class="faq-list"><details class="rv"><summary>У меня нет рисунка. С чего начать?</summary><p>С описания и подборки референсов: характер, одежда, палитра, настроение. Отметь понравившихся персонажей сердечком — они попадут в бриф. Разработку концепта согласуем отдельным этапом.</p></details>
<details class="rv"><summary>Где будет работать модель?</summary><p>Программу выбираем до начала проекта. Для VSeeFace, Warudo и VRChat нужны разные настройки и форматы. Поддержку трекинга фиксируем в составе работ.</p></details>
<details class="rv"><summary>Можно доработать существующую модель?</summary><p>Да, начнём с аудита. Понадобятся исходные файлы и право на их изменение. Проверим геометрию, материалы и риг, затем предложим доработки.</p></details>
<details class="rv"><summary>Можно купить модель из коллекции?</summary><p>Коллекция показывает примеры в 3D. По конкретному персонажу напиши нам — уточним доступность, формат и условия использования.</p></details>
<details class="rv"><summary>Какие файлы и права я получу?</summary><p>Форматы экспорта, исходники, коммерческое использование и эксклюзивность согласуем письменно до начала работы.</p></details></div></section>

<section class="wrap"><div class="cta rv"><span class="kicker">Следующая история — твоя</span><h2 style="margin-top:18px">Кем ты хочешь <em>стать?</em></h2><p>Одна идея — целый новый мир. Опиши персонажа, а мы вернёмся с планом и оценкой.</p>
<div class="hero-actions"><button class="btn btn-lime" data-brief>Составить бриф <span class="arr">↗</span></button><a class="btn btn-glass" data-contact="telegram" href="{TG}">Написать в Telegram</a></div></div></section>
</main>
<div class="moodbar" role="region" aria-label="Мудборд"><span class="heart">{ICON_HEART}</span><div class="txt"><strong>Здесь соберётся твой мудборд</strong><span>Отмечай сердечком персонажей, которые откликаются</span></div><div class="mood-faces"></div><button class="btn btn-lime btn-sm" id="bar-brief">Собрать бриф <span class="arr">→</span></button></div>'''
    model_dialog = f'''<dialog id="model-dialog" aria-labelledby="model-title"><div class="model-layout"><div id="explorer" class="viewer explorer"><span class="loading">Загружаем 3D-модель…</span></div>
<div class="model-panel"><div class="dlg-top" style="padding:12px 0 0"><span class="kicker">3D-просмотр</span><button class="x" aria-label="Закрыть">×</button></div>
<h2 id="model-title">Catgirl</h2><p id="model-caption"></p><p>Крути мышью или пальцем, колесо — приближение.</p>
<span class="ctl-label">Выражение лица</span><div class="ctl"><button class="active" data-expression="neutral">Спокойствие</button><button data-expression="happy">Улыбка</button><button data-expression="angry">Сердится</button><button data-expression="surprised">Удивление</button></div>
<span class="ctl-label">Вид</span><div class="ctl"><button data-view="full">В рост</button><button data-view="face">Лицо</button><button id="rotate-toggle" aria-pressed="false">Вращение</button><button id="save-frame">Сохранить кадр</button></div>
<label class="upload">Открыть свою GLB / VRM<input type="file" id="model-file" accept=".glb,.vrm"><br><span>Файл открывается только в твоём браузере.</span></label>
<p class="model-note"></p>
<div class="hero-actions" style="margin-top:auto"><button class="btn btn-lime btn-sm" data-brief>Хочу такого персонажа ↗</button><button class="like" id="model-like" data-like="Catgirl" aria-pressed="false" aria-label="В мудборд" style="position:static">{ICON_HEART}</button></div></div></div></dialog>'''
    tail = model_dialog + '\n<script type="module" src="/assets/viewer.js"></script>'
    (DIST / 'index.html').write_text(page(head, body, True, tail), encoding='utf-8')

# ---------- inner pages ----------
RELATED = [
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
    rel_cards = [r for r in RELATED if r[0] != url][:3] if section == 'Студия' else [r for r in RELATED if r[0] != url][::-1][:3]
    related = ''.join(f'<a class="post" href="{u}"><span class="mono">{k}</span><span class="go">↗</span><h3>{escape(t)}</h3><p>{escape(d)}</p></a>' for u, k, t, d in rel_cards)
    body = f'''<main id="main" class="page wrap">
<nav class="crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a><span>/</span><span>{escape(section)}</span></nav>
<header class="page-hero"><div><span class="kicker">NORMAS · {escape(section)}</span><h1 style="margin-top:16px">{title}</h1></div><p class="lead">{intro}</p></header>
<div class="article"><nav class="toc" aria-label="Содержание">{toc}</nav><div class="prose">{content}
<div class="callout"><span class="kicker">Следующий шаг</span><h2 style="margin-top:12px!important">Начнём с твоей идеи?</h2><p>Собери описание персонажа в коротком брифе — вернёмся с планом и оценкой.</p><div class="hero-actions"><button class="btn btn-lime" data-brief>Составить бриф <span class="arr">↗</span></button><a class="btn btn-glass" data-contact="telegram" href="{TG}">Telegram</a></div></div>
</div></div>
<section class="section"><div class="section-head"><h2 style="font-size:clamp(32px,4vw,52px)">Читать <em>дальше</em></h2></div><div class="related">{related}</div></section>
</main>'''
    (DIST / rel / 'index.html').write_text(page(head_from(src), body), encoding='utf-8')

def order():
    rel = 'services/3d-vtuber-model'
    src = (SRC / rel / 'index.html').read_text(encoding='utf-8')
    folders = ''.join([
        folder(1, 'Образ и модель', 'Силуэт, костюм, волосы и материалы — от референсов до готовой геометрии.', '#6b55d6', '#2c2268', 'Catgirl',
               [('Бриф', 'Референсы'), ('Концепт', 'Силуэт и палитра'), ('3D', 'Геометрия и текстуры')],
               [('Открыть 3D-коллекцию', '/#characters'), ('Подготовить референсы', '/journal/vtuber-brief/')]),
        folder(2, 'Движение и мимика', 'Скелет, веса, лицевые формы и физика волос и одежды.', '#3f8f7a', '#173b33', 'Teal',
               [('Риг', 'Скелет и веса'), ('Мимика', 'Blend shapes'), ('Физика', 'Волосы и одежда')],
               [('Узнать о риггинге', '/services/rigging/'), ('Сравнить 2D и 3D', '/journal/2d-or-3d/')]),
        folder(3, 'Выход в эфир', 'Экспорт, настройка под программу и проверка перед первым стримом.', '#c0577f', '#4a1b33', 'Lilac',
               [('Экспорт', 'VRM · GLB'), ('Настройка', 'VSeeFace · Warudo'), ('Проверка', 'Тестовый эфир')],
               [('Подготовка модели к эфиру', '/services/vrm/'), ('Из чего складывается цена', '/journal/3d-vtuber-price/')]),
    ])
    body = f'''<main id="main" class="page wrap">
<nav class="crumbs" aria-label="Хлебные крошки"><a href="/">Главная</a><span>/</span><span>Услуги</span></nav>
<section class="order-hero" aria-labelledby="order-title"><div class="order-copy"><span class="kicker">NORMAS · Услуга</span>
<h1 id="order-title">3D VTuber-модель <em>на заказ</em></h1>
<p class="lead">Создадим персонажа для твоих стримов: начнём с образа, соберём модель, настроим риг и мимику и проверим её в твоей программе.</p>
<div class="hero-actions"><a class="btn btn-lime" data-contact="telegram" href="{TG}">Обсудить заказ <span class="arr">↗</span></a><button class="btn btn-glass" data-brief>Подготовить бриф</button></div>
<p class="hero-note">Удобнее по почте? <a data-contact="email" href="mailto:{MAIL}">{MAIL}</a></p></div>
<figure class="order-art" style="margin:0"><img src="/assets/Catgirl-poster.png" alt="Catgirl — пример 3D VTuber-модели NORMAS" width="720" height="864"><span class="chip c1"><b></b>Риг + мимика</span><a class="chip c3" href="/#characters" style="bottom:24px;right:24px">Покрутить в 3D ↗</a></figure></section>

<section class="section"><div class="section-head"><div><span class="kicker">01 · Состав проекта</span><h2>От референса <em>до эфира</em></h2></div><p>Открой папку, чтобы посмотреть этапы и связанные материалы.</p></div><div class="folders">{folders}</div></section>

<section class="section"><div class="info-grid">
<div class="tile glow"><div><span class="kicker">02 · Бюджет</span><h3 style="margin-top:14px">Сколько стоит 3D VTuber-модель</h3><p>Смета зависит от исходного дизайна, сложности костюма и волос, набора эмоций и требований к трекингу. Можно заказать модель с нуля или доработку готового файла — состав работ и стоимость согласуем до старта.</p><p>Для оценки пришли референсы, желаемый срок, бюджет и название программы для стримов.</p></div><a class="link" href="/journal/3d-vtuber-price/">Как рассчитывается цена ↗</a></div>
<div class="tile"><div><span class="kicker">03 · Результат</span><h3 style="margin-top:14px">Что ты получишь</h3><p>Готовую модель в согласованном формате и рекомендации по запуску. До начала работы фиксируем, какие выражения лица, физика, аксессуары, исходники и права использования входят в заказ.</p><p>Нужен VRM для VSeeFace или Warudo — укажи программу в брифе. Совместимость конкретной версии проверяем отдельно.</p></div><div class="pills"><span>VRM</span><span>GLB</span><span>VSeeFace</span><span>Warudo</span><span>VRChat</span></div></div>
</div></section>

<section class="section faq"><div><span class="kicker">04 · Вопросы</span><h2 style="font-size:clamp(36px,4.6vw,60px);margin-top:14px">Перед <em>заказом</em></h2></div><div class="faq-list">
<details><summary>Можно начать без готового рисунка?</summary><p>Да. Подойдут примеры одежды, палитры и силуэта, описание характера и список деталей, которые должны быть у персонажа.</p></details>
<details><summary>Можно купить готовую модель из коллекции?</summary><p>Коллекция показывает примеры в 3D. По конкретному персонажу напиши нам: уточним доступность модели, формат файла и условия использования.</p></details>
<details><summary>Где посмотреть 3D-модели?</summary><p>В <a class="link" href="/#characters">коллекции NORMAS</a> можно повернуть персонажей, приблизить их и проверить доступную мимику. Ещё больше фильтров — в <a class="link" href="https://renigt.online/">каталоге Renigt</a>.</p></details></div></section>

<div class="cta"><span class="kicker">Следующий шаг</span><h2 style="margin-top:18px">Расскажи о своём <em>персонаже</em></h2><p>Telegram — самый быстрый способ. Или собери бриф и пришли файлом.</p><div class="hero-actions"><a class="btn btn-lime" data-contact="telegram" href="{TG}">Написать в Telegram <span class="arr">↗</span></a><button class="btn btn-glass" data-brief>Составить бриф</button></div></div>
</main>'''
    (DIST / rel / 'index.html').write_text(page(head_from(src), body), encoding='utf-8')

home()
order()
for rel in ['services/rigging', 'services/vrm', 'journal/2d-or-3d', 'journal/3d-vtuber-price', 'journal/vtuber-brief', 'credits']:
    article(rel)
print('NORMAS pages generated')
