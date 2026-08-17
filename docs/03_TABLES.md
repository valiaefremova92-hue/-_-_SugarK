# Таблиці

## Settings

`key | value`

Ключові значення:
- `SLOT_STEP_MINUTES` = 30
- `BUFFER_MINUTES` = 15
- `CANCEL_BEFORE_MINUTES` = 90
- `REMINDER_1_HOURS` = 24
- `REMINDER_2_HOURS` = 2

Тут же зберігається тема.

## Services

`id | name | price | duration | type | active | sort`

## Schedule

`date | start | end | active`

## Blocks

`id | date | start | end | reason | createdAt`

## Bookings

Заповнюється системою.

## Clients

Заповнюється системою.

### Непередбачувана тривалість

Для автоматичного запису потрібна конкретна тривалість у хвилинах. Для альгінатної маски треба вибрати 15 або 20 хв; для механічної чистки — визначити правило або залишити ручний запис. У шаблоні стартово стоять 15 і 30 хв як технічні значення, їх треба підтвердити перед продакшеном.
