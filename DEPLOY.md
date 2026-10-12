# Запуск NORMAS на Vercel

Проект уже содержит vercel.json: Framework Other, Build Command npm run build, Output Directory dist. Серверные функции не нужны. Все GLB загружаются по выбору, а не одновременно.

## Деплой

Самый быстрый путь без GitHub: открыть PowerShell в этой папке, выполнить npx vercel, войти в свой аккаунт, выбрать команду и создать проект normas. Проверить выданный preview URL. Затем npx vercel --prod публикует production.

Альтернатива для регулярных обновлений: загрузить проект в свой GitHub-репозиторий без node_modules и .git старого Sites-проекта, импортировать репозиторий через Vercel → Add New → Project. Конфигурация берётся из vercel.json. Обновления ветки будут запускать деплой автоматически.

Для коммерческого сайта студии нужен подходящий коммерческий план: Hobby предназначен для личного некоммерческого использования.

## Домен

В Vercel → Project → Settings → Domains добавить normas.eu.cc. В GNAME → управление normas.eu.cc → Resolution now добавить запись с типом, именем и значением, которые покажет Vercel. Не копировать фиксированный IP из старых инструкций: использовать данные своего проекта. При CNAME на @ DNS-провайдер должен поддерживать такую запись; если он запрещает CNAME вместе с TXT на этом имени, использовать предложенный Vercel вариант A или способ подтверждения поисковиков через HTML-файл.

Добавить www.normas.eu.cc в Vercel, создать DNS-запись для www с выданным значением и выбрать перенаправление www → normas.eu.cc. Nameservers GNAME можно оставить. Подождать Valid Configuration и выпуск HTTPS.

## Открыть индексацию

Когда готов публичный запуск, в этой папке выполнить:

    node prepare-seo.mjs https://normas.eu.cc public
    npx vercel --prod

Команда меняет canonical, og:url, robots и sitemap на основной домен и убирает noindex. Проверить https://normas.eu.cc/robots.txt и https://normas.eu.cc/sitemap.xml. До этого сайт закрыт от индексации.

## Яндекс и Google

В https://webmaster.yandex.ru добавить https://normas.eu.cc/, выбрать подтверждение через TXT. Добавить в DNS GNAME отдельную запись с точным значением от Яндекса, затем нажать Проверить. В Индексирование → Файлы Sitemap добавить https://normas.eu.cc/sitemap.xml.

В https://search.google.com/search-console добавить доменный ресурс normas.eu.cc без https, получить TXT, добавить отдельной записью в GNAME и подтвердить. В Sitemaps отправить https://normas.eu.cc/sitemap.xml. Если доменный ресурс недоступен или CNAME мешает TXT, выбрать URL-prefix https://normas.eu.cc/ и подтверждение HTML-файлом: положить файл в dist/ и повторить деплой.

Записи подтверждения не удалять. Наличие sitemap и подтверждения не гарантирует индексацию или позиции; проверять статусы страниц в обеих консолях после запуска.

Официальные инструкции:
- https://vercel.com/docs/deployments
- https://vercel.com/docs/domains/working-with-domains/add-a-domain
- https://vercel.com/docs/plans/hobby
- https://yandex.ru/support/webmaster/ru/service/rights
- https://yandex.ru/support/webmaster/ru/indexing-options/sitemap
- https://support.google.com/webmasters/answer/9008080?hl=ru
