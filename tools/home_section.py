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
    head = head_from(src, f'\n<link rel="preload" href="/assets/chars/{CHARS[0]["id"]}.webp" as="image">')
    first = CHARS[0]
    avatars = ''.join(f'<button data-hero-char="{c["id"]}" class="{"active" if i == 0 else ""}" aria-pressed="{"true" if i == 0 else "false"}" aria-label="Показать {escape(c["name"])}"><img src="/assets/chars/{c["id"]}-face.webp" alt="" width="46" height="46"></button>' for i, c in enumerate(CHARS))
    cards = '\n'.join(card(c) for c in CHARS)
    mq = ''.join(f'<span>{t}</span>' for t in ['VTuber-модели на заказ', 'Pastel Kawaii', 'Neon Cyberpunk', 'Риггинг и мимика', '2D и 3D', 'VSeeFace · Warudo · VRChat', 'Дизайн персонажа с нуля', 'Подготовка к первому эфиру'])
    folders = ''.join(folder(*f) for f in FOLDERS_HOME)
    body = f'''<main id="main">
<section class="hero wrap" id="top"><div class="hero-card intro" data-mood="{first['style']}"><canvas class="waves" aria-hidden="true"></canvas><span class="hero-sun" aria-hidden="true"></span><span class="spot" aria-hidden="true"></span>
<div class="hero-grid"><div class="hero-copy">
<span class="kicker">NORMAS · VTuber studio</span>
<h1><span class="ln"><span>VTuber-модели</span></span> <span class="ln"><span><em>на заказ</em></span></span></h1>
<p class="lead">Создаём персонажей, которых хочется смотреть часами: дизайн, модель, риг и мимика, настройка под VSeeFace, Warudo и VRChat. Пастельные милашки или неоновый киберпанк — выбирай свой стиль.</p>
<div class="hero-actions"><a class="btn btn-lime" href="/services/3d-vtuber-model/">Заказать персонажа <span class="arr">↗</span></a><a class="btn btn-glass" href="#characters">Смотреть концепты</a></div>
<p class="hero-note">Уже знаешь, чего хочешь? <a href="#" data-brief>Опиши персонажа в брифе ↗</a></p>
</div>
<div class="hero-stage"><span class="halo" aria-hidden="true"></span>
<div class="alive" data-alive-hero data-neck="{first['neck']}" data-hip="{first['hip']}" data-src="/assets/chars/{first['id']}.webp" title="Нажми на меня"><img class="ph" src="/assets/chars/{first['id']}-sm.webp" alt="{escape(first['name'])} — концепт VTuber-персонажа" width="512" height="768"></div>
<span class="chip c1"><b></b>Дышит и смотрит на тебя</span><span class="chip c2">Нажми на неё ♡</span></div></div>
<div class="hero-switch"><div class="now"><span data-hero-style>{'Pastel Kawaii' if first['style'] == 'pastel' else 'Neon Cyberpunk'}</span><strong data-hero-name>{escape(first['name'])}</strong></div><div class="avatars" role="group" aria-label="Выбрать персонажа">{avatars}</div><button class="btn btn-glass btn-sm" data-hero-open data-open-char="{first['id']}">Подробнее ↗</button></div>
</div>
<div class="marquee" aria-hidden="true"><div class="marquee-track">{mq}{mq}</div></div></section>

<section class="section wrap" id="characters"><div class="section-head rv"><div><span class="kicker">01 · Концепты</span><h2>К кому <em>тянет?</em></h2></div><p>Два направления, в которых мы работаем. Отмечай сердечком тех, кто откликается, — соберём из них мудборд и добавим в бриф.</p></div>
<div class="toolbar"><div class="filters" role="group" aria-label="Стиль"><button class="active" aria-pressed="true" data-filter="all">Все</button><button aria-pressed="false" data-filter="pastel">Pastel Kawaii</button><button aria-pressed="false" data-filter="neon">Neon Cyberpunk</button></div>
<label class="inline-search">{ICON_SEARCH}<input id="gallery-search" type="search" placeholder="Неко, ангел, демон, хакер…" aria-label="Поиск по персонажам"></label></div>
<div class="chars">{cards}</div><p class="empty gallery-empty" hidden>Никого не нашли. Попробуй другой запрос — или <a class="link" href="#" data-brief>опиши своего персонажа</a>.</p>
<p class="note-ai">Концепт-арты показывают стиль и подачу. Твой персонаж разрабатывается с нуля под твою идею.</p></section>

<section class="section wrap" id="services"><div class="section-head rv"><div><span class="kicker">02 · Услуги</span><h2>Три папки — <em>один персонаж</em></h2></div><p>Нажми на папку: внутри этапы работы и всё, что стоит прочитать до заказа.</p></div>
<div class="folders">{folders}</div></section>

<section class="section wrap" id="process"><div class="section-head rv"><div><span class="kicker">03 · Процесс</span><h2>От идеи <em>до эфира</em></h2></div><p>Состав работ, сроки и бюджет фиксируем до старта — без сюрпризов в конце.</p></div>
<div class="bento">
<div class="tile w4 glow rv"><div><h3>Как проходит заказ</h3><p>Каждый этап согласуем с тобой и показываем промежуточный результат.</p></div><ol class="steps"><li>Бриф и референсы<span>ты рассказываешь об идее</span></li><li>Концепт и смета<span>фиксируем стиль, состав и сроки</span></li><li>Арт и модель<span>показываем эскизы и рендеры</span></li><li>Риг, мимика, физика<span>проверяем в движении</span></li><li>Экспорт и настройка<span>готово к стриму</span></li></ol></div>
<div class="tile w2 rv"><span class="num">2</span><div><h3>стиля на выбор</h3><p>Pastel Kawaii для уютных стримов или Neon Cyberpunk для игровых — или твой собственный.</p></div></div>
<div class="tile w3 rv"><div><h3>Под твою программу</h3><p>Формат и трекинг выбираем до начала работы и проверяем перед передачей.</p></div><div class="pills"><span>VSeeFace</span><span>Warudo</span><span>VRChat</span><span>VNyan</span><span>VRM</span><span>GLB</span></div></div>
<div class="tile w3 rv"><div><h3>Бюджет — по брифу</h3><p>Цена зависит от концепта, костюма, волос, количества эмоций и требований к трекингу.</p></div><a class="link" href="/journal/3d-vtuber-price/">Из чего складывается цена ↗</a></div>
</div></section>

<section class="section wrap" id="journal"><div class="section-head rv"><div><span class="kicker">04 · Журнал</span><h2>Прочитать <em>до заказа</em></h2></div><p>Немного ясности перед большим перевоплощением.</p></div>
<div class="posts"><a class="post rv" href="/journal/3d-vtuber-price/"><span class="mono">01 · Бюджет</span><span class="go">↗</span><h3>Сколько стоит новое «я»</h3><p>Из чего складывается цена VTuber-модели и как сравнивать предложения.</p></a>
<a class="post rv" href="/journal/2d-or-3d/"><span class="mono">02 · Формат</span><span class="go">↗</span><h3>Плоскость или объём</h3><p>2D или 3D: какой персонаж нужен твоим стримам.</p></a>
<a class="post rv" href="/journal/vtuber-brief/"><span class="mono">03 · Замысел</span><span class="go">↗</span><h3>Собрать вдохновение</h3><p>Как подготовить референсы, чтобы персонаж получился тем самым.</p></a></div></section>

<section class="section wrap faq" id="faq"><div class="rv"><span class="kicker">05 · Вопросы</span><h2 style="font-size:clamp(40px,5vw,68px);margin-top:14px">Поговорим <em>о важном</em></h2><p style="color:var(--mute);margin-top:18px">Не нашёл ответ? Напиши в <a class="link" data-contact="telegram" href="{TG}">Telegram</a>.</p></div>
<div class="faq-list"><details class="rv"><summary>У меня нет рисунка. С чего начать?</summary><p>С описания и подборки референсов: характер, одежда, палитра, настроение. Отметь понравившиеся концепты сердечком — они попадут в бриф. Разработку дизайна согласуем отдельным этапом.</p></details>
<details class="rv"><summary>Где будет работать модель?</summary><p>Программу выбираем до начала проекта. Для VSeeFace, Warudo и VRChat нужны разные настройки и форматы. Поддержку трекинга фиксируем в составе работ.</p></details>
<details class="rv"><summary>Можно доработать существующую модель?</summary><p>Да, начнём с аудита. Понадобятся исходные файлы и право на их изменение. Проверим геометрию, материалы и риг, затем предложим доработки.</p></details>
<details class="rv"><summary>Можно заказать персонажа как в концептах?</summary><p>Концепты показывают стиль. Мы сделаем оригинального персонажа в этой эстетике под твою идею — копии чужих образов не делаем.</p></details>
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
<p class="small-note">Персонаж дышит и следит за курсором. Нажми на него ♡</p>
<div class="hero-actions" style="margin-top:auto"><button class="btn btn-lime btn-sm" data-brief>Хочу персонажа в этом стиле ↗</button><button class="like" id="char-like" data-like="mimi" aria-pressed="false" aria-label="В мудборд" style="position:static">{ICON_HEART}</button></div></div></div></dialog>'''
    (DIST / 'index.html').write_text(page(head, body, True, char_dialog), encoding='utf-8')

