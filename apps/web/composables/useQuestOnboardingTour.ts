import type { Config, DriveStep, PopoverDOM } from 'driver.js'
import type { Ref } from 'vue'

type StartQuestTourOptions = {
  storageKey: string
  steps: DriveStep[]
  force?: boolean
  waitFor?: string[]
}

type ActiveDriver = {
  destroy: () => void
  drive: () => void
}

let activeDriver: ActiveDriver | null = null
let markDoneOnDestroy = true

const addClasses = (element: HTMLElement | undefined, classes: string[]) => {
  element?.classList.add(...classes)
}

const applyQuestTourPopoverClasses = (popover: PopoverDOM) => {
  const gothicFontClass = "![font-family:'Gothic_60',system-ui,sans-serif]"

  addClasses(popover.wrapper, [
    '!w-[calc(100vw-32px)]',
    '!max-w-[320px]',
    '!rounded-[16px]',
    '!p-4',
    '!bg-white',
    '!font-gothic',
    gothicFontClass,
    '!text-slate-950',
    '!shadow-[0_18px_50px_rgba(15,23,42,0.22)]',
    'sm:!w-auto',
  ])

  addClasses(popover.title, [
    '!text-[20px]',
    gothicFontClass,
    '!font-normal',
    '!leading-tight',
    '!text-slate-950',
  ])

  addClasses(popover.description, [
    '!text-[13px]',
    gothicFontClass,
    '!leading-snug',
    '!text-slate-600',
  ])

  addClasses(popover.progress, [
    '!text-[10px]',
    gothicFontClass,
    '!leading-none',
    '!text-slate-400',
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
    '!bg-slate-100',
    '!text-slate-900',
  ])

  addClasses(popover.closeButton, [
    gothicFontClass,
    '!text-[22px]',
    '!text-slate-500',
  ])
}

const waitForTourTargets = async (selectors: string[]) => {
  if (selectors.length === 0)
    return

  for (let i = 0; i < 20; i += 1) {
    await nextTick()

    if (selectors.every(selector => document.querySelector(selector)))
      return

    await new Promise(resolve => window.setTimeout(resolve, 100))
  }
}

const waitForTourSlot = async (isTourRunning: Ref<boolean>) => {
  for (let i = 0; i < 30; i += 1) {
    if (!isTourRunning.value)
      return true

    await new Promise(resolve => window.setTimeout(resolve, 100))
  }

  return !isTourRunning.value
}

const getVisibleTourSteps = (steps: DriveStep[]) => {
  return steps.filter((step) => {
    if (typeof step.element !== 'string')
      return true

    return Boolean(document.querySelector(step.element))
  })
}

export const useQuestOnboardingTour = () => {
  const isTourRunning = useState('quest-onboarding-tour-running', () => false)

  const stopQuestTour = (markDone = false) => {
    if (!activeDriver)
      return

    markDoneOnDestroy = markDone
    activeDriver.destroy()
    activeDriver = null
    isTourRunning.value = false
  }

  const startQuestTour = async (options: StartQuestTourOptions) => {
    if (!import.meta.client)
      return

    const canStart = await waitForTourSlot(isTourRunning)
    if (!canStart)
      return

    if (!options.force && window.localStorage.getItem(options.storageKey) === 'done')
      return

    await waitForTourTargets(options.waitFor ?? [])

    const steps = getVisibleTourSteps(options.steps)
    if (steps.length === 0)
      return

    const { driver } = await import('driver.js')

    isTourRunning.value = true
    markDoneOnDestroy = true

    const config: Config = {
      steps,
      animate: true,
      allowClose: true,
      allowKeyboardControl: true,
      disableActiveInteraction: true,
      overlayColor: '#0f172a',
      overlayOpacity: 0.58,
      progressText: '{{current}} из {{total}}',
      showButtons: ['next', 'previous', 'close'],
      showProgress: true,
      nextBtnText: 'Дальше',
      prevBtnText: 'Назад',
      doneBtnText: 'Готово',
      onPopoverRender: applyQuestTourPopoverClasses,
      onDestroyed: () => {
        if (markDoneOnDestroy)
          window.localStorage.setItem(options.storageKey, 'done')

        activeDriver = null
        markDoneOnDestroy = true
        isTourRunning.value = false
      },
    }

    activeDriver = driver(config)
    activeDriver.drive()
  }

  return {
    startQuestTour,
    stopQuestTour,
  }
}
