# Vexa.ai - Следующие шаги

**Дата**: 21 ноября 2025
**Статус**: ✅ Frontend готов к настройке Clerk Dashboard и тестированию

---

## 🎯 Что уже сделано

### ✅ Backend (Полностью готов)
- 5-узловой Kubernetes кластер на Contabo Cloud
- 6 микросервисов развернуты и работают
- PostgreSQL 15 + Redis 7 настроены
- Calico CNI + Nginx Ingress + Longhorn Storage
- База данных с таблицами для пользователей и встреч
- API Gateway доступен по https://voice.axiomic.com.cy/api

### ✅ Frontend (Код готов)
- Next.js 15 App Router + TypeScript
- Clerk authentication интегрирован
- shadcn/ui компоненты
- Страницы: sign-in, sign-up, meetings, record, settings
- API клиент с JWT токенами
- Docker образ готов к сборке
- Документация создана

### ✅ Clerk API (Автоматически настроен)
- Allowed origins: voice.axiomic.com.cy + localhost:3000
- Instance ID: ins_35kLBDP9yYI0I1q4pgsxoy9iC53
- Application: axiomic-voice
- API ключи в `.env.local`

---

## 🔧 Что нужно сделать СЕЙЧАС (10-15 минут)

### Шаг 1: Настроить Clerk Dashboard вручную

**Открыть**: https://dashboard.clerk.com
**Выбрать приложение**: axiomic-voice

#### 1.1 Создать Webhook (КРИТИЧНО!)

**Навигация**: Dashboard → Configure → Webhooks

1. Нажать **"Add Endpoint"** или **"Create Endpoint"**
2. **Endpoint URL**: `https://voice.axiomic.com.cy/api/webhooks/clerk`
3. **Description**: `Vexa user sync webhook`
4. **Выбрать события**:
   - ☑️ `user.created`
   - ☑️ `user.updated`
   - ☑️ `user.deleted`
5. Нажать **"Create"**
6. **СКОПИРОВАТЬ Signing Secret** (начинается с `whsec_...`)

**Добавить в `.env.local`**:
```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Открыть файл и добавить:
CLERK_WEBHOOK_SECRET=whsec_ВАШ_СКОПИРОВАННЫЙ_СЕКРЕТ
```

#### 1.2 Настроить домены и URL

**Навигация**: Dashboard → Configure → Domains (или URLs)

Установить эти значения:

| Настройка | Значение |
|-----------|----------|
| **Home URL** | `https://voice.axiomic.com.cy` |
| **Sign in URL** | `https://voice.axiomic.com.cy/sign-in` |
| **Sign up URL** | `https://voice.axiomic.com.cy/sign-up` |
| **After sign in** | `https://voice.axiomic.com.cy/meetings` |
| **After sign up** | `https://voice.axiomic.com.cy/meetings` |

#### 1.3 Проверить пути (Paths)

**Навигация**: Dashboard → Paths (или Components)

Убедиться, что установлены:
```
Sign-in path: /sign-in
Sign-up path: /sign-up
```

#### 1.4 Включить социальные сети (Опционально)

**Навигация**: Dashboard → User & Authentication → Social Connections

**Рекомендуется**:
- ✅ **Google** - Переключить → Нажать "Apply"
- ✅ **Microsoft** - Переключить → Нажать "Apply"

---

### Шаг 2: Локальное тестирование

После добавления webhook secret в `.env.local`:

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev

# Открыть в браузере
open http://localhost:3000
```

#### Тестовый чеклист:

- [ ] Главная страница загружается
- [ ] Кнопка "Sign In" работает
- [ ] Clerk модальное окно открывается
- [ ] Можно создать тестовый аккаунт
- [ ] После регистрации → редирект на `/meetings`
- [ ] UserButton появляется в хедере
- [ ] Можно зайти в /record и /settings
- [ ] Можно выйти и зайти снова
- [ ] В консоли браузера нет ошибок

#### Ожидаемое поведение:

1. **/**  - Публичная страница (главная)
2. **/sign-in** - Clerk модальное окно входа
3. **/sign-up** - Clerk модальное окно регистрации
4. **/meetings** - Защищенная страница, требует авторизацию
5. **/record** - Защищенная страница, интерфейс записи
6. **/settings** - Защищенная страница, настройки

---

### Шаг 3: Production Deployment

После успешного локального тестирования:

#### 3.1 Собрать Docker образ

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Собрать production образ
docker build -t ghcr.io/adminitbcomcy/vexa-frontend:1.0.0 .

# Загрузить в registry
docker push ghcr.io/adminitbcomcy/vexa-frontend:1.0.0
```

#### 3.2 Добавить секреты в Kubernetes

```bash
ssh root@212.47.66.31

# Добавить Clerk секреты (замените YOUR_WEBHOOK_SECRET на реальный)
kubectl patch secret vexa-secrets -n vexa --type='json' -p='[
  {"op":"add","path":"/data/clerk-publishable-key","value":"'$(echo -n "pk_test_ZG9taW5hbnQtcmFtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ" | base64)'"},
  {"op":"add","path":"/data/clerk-secret-key","value":"'$(echo -n "sk_test_qBeSaR5jRlNhE7A544epxNvse5hGPJtLAnyV8rk7Ci" | base64)'"},
  {"op":"add","path":"/data/clerk-webhook-secret","value":"'$(echo -n "YOUR_WEBHOOK_SECRET" | base64)'"}
]'
```

#### 3.3 Создать Helm манифест для frontend

На сервере создать файл `/root/helm/vexa-official/templates/frontend-deployment.yaml` (см. FRONTEND_DEPLOYMENT_STATUS.md для полного содержимого).

#### 3.4 Обновить custom-values.yaml

Добавить в `/root/helm/custom-values.yaml`:

```yaml
frontend:
  replicas: 2
  image:
    repository: ghcr.io/adminitbcomcy/vexa-frontend
    tag: "1.0.0"
    pullPolicy: Always
  resources:
    requests:
      memory: "256Mi"
      cpu: "200m"
    limits:
      memory: "512Mi"
      cpu: "500m"
```

#### 3.5 Обновить Ingress

Отредактировать `/root/helm/vexa-official/templates/ingress.yaml` чтобы маршрутизировать `/` на frontend (см. FRONTEND_DEPLOYMENT_STATUS.md).

#### 3.6 Развернуть

```bash
# На CP-1
ssh root@212.47.66.31

# Развернуть обновленный Helm chart
helm upgrade vexa /root/helm/vexa-official -n vexa -f /root/helm/custom-values.yaml

# Проверить статус
kubectl rollout status deployment/vexa-frontend -n vexa

# Проверить поды
kubectl get pods -n vexa -l app.kubernetes.io/component=frontend

# Проверить логи
kubectl logs -n vexa -l app.kubernetes.io/component=frontend --tail=50 -f
```

#### 3.7 Проверить Production

```bash
# Проверить главную страницу
curl -I https://voice.axiomic.com.cy

# Открыть в браузере
open https://voice.axiomic.com.cy
```

**Production тестовый чеклист**:
- [ ] Главная страница загружается
- [ ] Sign in/Sign up работает
- [ ] После авторизации → редирект на /meetings
- [ ] API вызовы к backend успешны
- [ ] TLS сертификат валиден
- [ ] Нет ошибок в консоли

---

## 📚 Документация

Вся документация находится в `/Users/leonid/Documents/vexa-production/`:

1. **FRONTEND_DEPLOYMENT_STATUS.md** - Полный статус и инструкции
2. **CLERK_QUICK_SETUP.md** - Быстрая настройка Clerk
3. **CLERK_DASHBOARD_LINKS.md** - Навигация по Clerk Dashboard
4. **frontend/scripts/configure-clerk.sh** - Скрипт автоматизации
5. **NEXT_STEPS.md** - Этот файл (следующие шаги)

---

## 🆘 Помощь

### Если не можете найти Webhooks в Dashboard:

Попробуйте эти разделы:
1. **Configure** → **Webhooks**
2. **Settings** → **Webhooks**
3. **Developers** → **Webhooks**
4. Ищите кнопку **"Svix"** или **"Webhook Portal"**

### Если webhook secret не работает:

Формат должен быть:
```bash
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
Без кавычек, без пробелов, начинается с `whsec_`.

### Если Sign In не работает:

1. Проверить консоль браузера на ошибки
2. Убедиться что `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` установлен в .env.local
3. Проверить что домен разрешен в Clerk Dashboard (allowed origins)
4. Очистить кэш и куки браузера
5. Перезапустить `npm run dev` после изменения .env.local

---

## ✅ Текущий статус

| Компонент | Статус |
|-----------|--------|
| Kubernetes кластер | ✅ Работает |
| Backend сервисы | ✅ Развернуты |
| База данных | ✅ Настроена |
| Frontend код | ✅ Готов |
| Clerk API config | ✅ Настроен |
| Clerk Dashboard | ⚠️ Требуется ручная настройка |
| Webhook secret | ⚠️ Нужно добавить в .env.local |
| Локальное тестирование | ⏭️ Готово к запуску |
| Docker образ | ⏭️ Готов к сборке |
| Production | ⏭️ Готово к развертыванию |

---

## 🎯 Следующее действие ПРЯМО СЕЙЧАС

**Открыть Clerk Dashboard и создать webhook:**

1. Перейти на https://dashboard.clerk.com
2. Выбрать приложение **axiomic-voice**
3. Навигация: **Configure** → **Webhooks**
4. Создать endpoint: `https://voice.axiomic.com.cy/api/webhooks/clerk`
5. Выбрать события: user.created, user.updated, user.deleted
6. Скопировать webhook secret
7. Добавить в `/Users/leonid/Documents/vexa-production/frontend/.env.local`

**После этого можно сразу запустить локальное тестирование!** 🚀

---

**GitHub Repository**: https://github.com/adminitbcomcy/vexa-production

**Все изменения сохранены и загружены в репозиторий.**
