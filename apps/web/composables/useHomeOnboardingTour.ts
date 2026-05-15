import type { Config, DriveStep, PopoverDOM } from 'driver.js'

const HOME_TOUR_DONE_STORAGE_PREFIX = 'kvt.homeTour.v1.done.'
const HOME_TOUR_PENDING_STORAGE_KEY = 'kvt.homeTour.v1.pendingUserId'

const tourStepConfigs: DriveStep[] = [
  {
    element: '[data-tour="home-screen"]',
    popover: {
      title: 'Главная',
      description: 'Это стартовый экран: отсюда удобно перейти к городу, сюжетам, профилю и уведомлениям.',
      side: 'over',
      align: 'center',
    },
  },
  {
    element: '[data-tour="home-profile"]',
    popover: {
      title: 'Профиль',
      description: 'Нажмите на верхний блок, чтобы открыть профиль игрока и посмотреть личные данные.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="home-profile-name"]',
    popover: {
      title: 'Имя игрока',
      description: 'Рядом с аватаром показано имя профиля.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="home-profile-exp"]',
    popover: {
      title: 'Опыт',
      description: 'EXP - внутриигровая валюта растёт за активность, прохождение заданий и участие в событиях.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="home-notifications"]',
    popover: {
      title: 'Уведомления',
      description: 'Колокольчик ведёт к сообщениям. Красная точка означает, что есть непрочитанные уведомления.',
      side: 'bottom',
      align: 'end',
    },
  },
  // {
  //   element: '[data-tour="home-city-section"]',
  //   popover: {
  //     title: 'Город',
  //     description: 'Здесь находится карточка города. Через неё можно перейти к городским событиям.',
  //     side: 'right',
  //     align: 'start',
  //   },
  // },
  {
    element: '[data-tour="home-city-card"]',
    popover: {
      title: 'Город',
      description: 'Откройте её, чтобы посмотреть активности города и записаться на доступные события и записаться на них.',
      side: 'right',
      align: 'center',
    },
  },
  // {
  //   element: '[data-tour="home-stories-section"]',
  //   popover: {
  //     title: 'Карты историй',
  //     description: 'В этом блоке собраны сюжетные карты. Их можно листать горизонтально.',
  //     side: 'top',
  //     align: 'start',
  //   },
  // },
  {
    element: '[data-tour="home-story-card"]',
    popover: {
      title: 'Карта',
      description: 'В ней находяться тематические локации за прохождение которых даеться EXP.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="footer-nav"]',
    popover: {
      title: 'Нижнее меню',
      description: 'Через нижнюю навигацию можно быстро переходить между основными разделами приложения.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="footer-nav-home"]',
    popover: {
      title: 'Главная',
      description: 'Возвращает на текущий экран с городом и сюжетами.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="footer-nav-shop"]',
    popover: {
      title: 'Магазин',
      description: 'Переход к покупкам и предметам для персонажа.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="footer-nav-rating"]',
    popover: {
      title: 'Рейтинг',
      description: 'Переход к таблице лидеров и сравнению прогресса.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="footer-nav-profile"]',
    popover: {
      title: 'Профиль',
      description: 'Быстрый переход в профиль и достижения.',
      side: 'top',
      align: 'center',
    },
  },
]

const waitForTourTargets = async () => {
  for (let i = 0; i < 20; i += 1) {
    await nextTick()

    if (document.querySelector('[data-tour="home-screen"]') && document.querySelector('[data-tour="footer-nav"]'))
      return

    await new Promise(resolve => window.setTimeout(resolve, 100))
  }
}

const getVisibleTourSteps = () => {
  return tourStepConfigs.filter((step) => {
    if (typeof step.element !== 'string')
      return true

    return Boolean(document.querySelector(step.element))
  })
}

const addClasses = (element: HTMLElement | undefined, classes: string[]) => {
  element?.classList.add(...classes)
}

const applyTourPopoverClasses = (popover: PopoverDOM) => {
  const gothicFontClass = "![font-family:'Gothic_60',system-ui,sans-serif]"

  addClasses(popover.wrapper, [
    '!w-[calc(100vw-32px)]',
    '!max-w-[300px]',
    '!rounded-[16px]',
    '!p-4',
    '!bg-[#efefef]',
    '!font-gothic',
    gothicFontClass,
    '!text-[#161616]',
    '!shadow-[0_10px_30px_rgba(0,0,0,0.14)]',
    'sm:!w-auto',
  ])

  addClasses(popover.title, [
    '!text-[20px]',
    gothicFontClass,
    '!font-normal',
    '!leading-none',
    '!text-[#131313]',
  ])

  addClasses(popover.description, [
    '!text-[12px]',
    gothicFontClass,
    '!leading-[1.05]',
    '!text-[#6f6f6f]',
  ])

  addClasses(popover.progress, [
    '!text-[10px]',
    gothicFontClass,
    '!leading-none',
    '!text-[#8c8c8c]',
  ])

  addClasses(popover.footerButtons, ['gap-2'])

  const buttonClasses = [
    '!rounded-[10px]',
    '!border-0',
    '!px-4',
    '!py-2',
    '!font-gothic',
    gothicFontClass,
    '!text-[12px]',
    '!leading-none',
    '!font-normal',
    '!shadow-none',
    '![text-shadow:none]',
  ]

  addClasses(popover.nextButton, [
    ...buttonClasses,
    '!bg-[#d33030]',
    '!text-white',
  ])

  addClasses(popover.previousButton, [
    ...buttonClasses,
    '!bg-[#e4e4e4]',
    '!text-[#161616]',
  ])

  addClasses(popover.closeButton, [
    gothicFontClass,
    '!text-[22px]',
    '!text-[#777777]',
  ])
}

const getUserTourDoneStorageKey = (userId: string) => `${HOME_TOUR_DONE_STORAGE_PREFIX}${userId}`

export const markHomeTourPendingForUser = (userId: string) => {
  if (!import.meta.client || !userId)
    return

  window.localStorage.setItem(HOME_TOUR_PENDING_STORAGE_KEY, userId)
}

export const useHomeOnboardingTour = () => {
  const isTourRunning = useState('home-onboarding-tour-running', () => false)

  const startHomeTour = async (options: { force?: boolean, userId?: string | number | null } = {}) => {
    if (!import.meta.client || isTourRunning.value)
      return

    const userId = options.userId != null ? String(options.userId) : ''
    const pendingUserId = window.localStorage.getItem(HOME_TOUR_PENDING_STORAGE_KEY)
    const hasSeenTour = userId
      ? window.localStorage.getItem(getUserTourDoneStorageKey(userId)) === 'done'
      : false

    if (!options.force && (!userId || pendingUserId !== userId || hasSeenTour))
      return

    await waitForTourTargets()

    const steps = getVisibleTourSteps()
    if (steps.length === 0)
      return

    const { driver } = await import('driver.js')

    isTourRunning.value = true

    const config: Config = {
      steps,
      animate: true,
      allowClose: true,
      allowKeyboardControl: true,
      disableActiveInteraction: true,
      overlayColor: '#111111',
      overlayOpacity: 0.58,
      progressText: '{{current}} из {{total}}',
      showButtons: ['next', 'previous', 'close'],
      showProgress: true,
      nextBtnText: 'Дальше',
      prevBtnText: 'Назад',
      doneBtnText: 'Готово',
      onPopoverRender: applyTourPopoverClasses,
      onDestroyed: () => {
        if (userId) {
          window.localStorage.setItem(getUserTourDoneStorageKey(userId), 'done')

          if (window.localStorage.getItem(HOME_TOUR_PENDING_STORAGE_KEY) === userId)
            window.localStorage.removeItem(HOME_TOUR_PENDING_STORAGE_KEY)
        }

        isTourRunning.value = false
      },
    }

    driver(config).drive()
  }

  const resetHomeTour = () => {
    if (!import.meta.client)
      return

    window.localStorage.removeItem(HOME_TOUR_PENDING_STORAGE_KEY)
  }

  return {
    startHomeTour,
    resetHomeTour,
  }
}
