import type { FetchError } from 'ofetch'
import { findModules } from '@/services/module.service'
import type { ModuleData } from '@/types/dto/module.dto'

// TODO: mock data
export const moduleItems: ModuleData[] = [
  {
    id: 1,
    code: 'DOC_AI',
    name: 'Doc AI',
    description: 'Doc AI instantly transforms paper documents, PDFs, and emails into accurate, system-readable data, eliminating manual entry and unlocking Al-powered supply chain efficiency.',
    iconKey: 'doc-ai',
    iconUrl: 'https://syncra-staging.s3.ap-southeast-1.amazonaws.com/syncra-doc-ai/icon/20251202-cae190af-f78a-478e-a4f0-f460deac7cb6.png',
    active: true,
    sortOrder: 1,
    createdAt: '2025-11-18T13:57:27.889152',
    updatedAt: '2025-12-03T10:13:36.676467',
    plans: [
      {
        id: 1,
        moduleId: 1,
        moduleCode: 'DOC_AI',
        code: 'DOC_AI_STARTER',
        name: 'Let\'s Talk',
        shortDescription: 'Starter plan for Doc AI module.',
        currency: 'USD',
        priceMonthly: 49.9900,
        priceAnnual: 499.0000,
        ctaLabel: 'Contact Sale',
        popular: true,
        active: true,
        sortOrder: 1,
        features: [
          'Lower lorem ipsum dolor sit amet',
          'Lorem ipsum dolor amet',
          'Lower lorem ipsum dolor sit amet lorem',
        ],
        createdAt: '2025-11-18T13:57:27.993488',
        updatedAt: '2025-11-18T13:57:27.993488',
      },
      {
        id: 5,
        moduleId: 1,
        moduleCode: 'DOC_AI',
        code: 'DOC_AI_PRO',
        name: 'Let\'s Talk',
        shortDescription: 'Pro plan for Doc AI module',
        currency: 'USD',
        priceMonthly: 0,
        priceAnnual: 0,
        ctaLabel: 'Contact Sale',
        popular: false,
        active: true,
        sortOrder: 1,
        features: [],
        createdAt: '2025-12-21T13:57:27.993488',
        updatedAt: '2025-12-21T13:57:27.993488',
      },
    ],
  },
  {
    id: 2,
    code: 'SCORE_CARD',
    name: 'Score Card',
    description: 'Score Card is a visual dashboard that summarizes your most important metrics in one place. It highlights performance trends, progress toward goals, and areas that need attention — making it easy to track results and take action.',
    iconKey: 'score-card',
    iconUrl: 'https://syncra-staging.s3.ap-southeast-1.amazonaws.com/syncra-doc-ai/icon/20251202-e1713ddb-e036-4bab-9c05-a359b5f5ea6b.png',
    active: true,
    sortOrder: 2,
    createdAt: '2025-11-18T13:57:27.957525',
    updatedAt: '2025-12-03T10:13:36.956337',
    plans: [
      {
        id: 2,
        moduleId: 2,
        moduleCode: 'SCORE_CARD',
        code: 'SCORE_CARD_STARTER',
        name: 'Let\'s Talk',
        shortDescription: 'Starter plan for Score Card.',
        currency: 'USD',
        priceMonthly: 49.9900,
        priceAnnual: 499.0000,
        ctaLabel: 'Contact Sale',
        popular: false,
        active: true,
        sortOrder: 1,
        features: [
          'Standard usage',
          'Email export support',
          'Basic analytics',
          'Team insights overview',
        ],
        createdAt: '2025-11-18T13:57:28.037583',
        updatedAt: '2025-11-18T13:57:28.037583',
      },
    ],
  },
  {
    id: 8,
    code: 'PNL_ANALYTICS',
    name: 'P&L Analytics',
    description: 'P&L Analytics is a financial intelligence tool that analyzes your profit and loss statements. It breaks down revenue, expenses, and margins across business units, products, and time periods—helping you identify trends, optimize costs, and improve profitability.',
    iconKey: 'pnl-analytics',
    iconUrl: 'https://syncra-staging.s3.ap-southeast-1.amazonaws.com/syncra-doc-ai/icon/20251202-c0e20939-599c-4076-8766-de08fa12ebc0.png',
    active: true,
    sortOrder: 3,
    createdAt: '2025-12-03T10:13:37.155443',
    updatedAt: '2025-12-03T10:13:37.155443',
    plans: [],
  },
  {
    id: 3,
    code: 'QC',
    name: 'QC',
    description: 'QC (Quality Control) monitors production quality through systematic inspections and testing. It helps identify defects early, reduce rework, and ensure consistent product quality across batches.',
    iconKey: 'qc',
    iconUrl: 'https://syncra-staging.s3.ap-southeast-1.amazonaws.com/syncra-doc-ai/icon/20251202-f3ca7245-c3bf-489d-b9ff-4f61f66b6dd1.png',
    active: true,
    sortOrder: 4,
    createdAt: '2025-11-18T13:57:27.966535',
    updatedAt: '2025-12-03T10:13:37.443687',
    plans: [
      {
        id: 3,
        moduleId: 3,
        moduleCode: 'QC',
        code: 'QC_STARTER',
        name: 'Let\'s Talk',
        shortDescription: 'Starter plan for QC.',
        currency: 'USD',
        priceMonthly: 49.9900,
        priceAnnual: 499.0000,
        ctaLabel: 'Contact Sale',
        popular: false,
        active: true,
        sortOrder: 1,
        features: [
          'Standard usage',
          'Email export support',
          'Basic analytics',
          'Team insights overview',
        ],
        createdAt: '2025-11-18T13:57:28.050776',
        updatedAt: '2025-11-18T13:57:28.050776',
      },
    ],
  },
  {
    id: 9,
    code: 'CARBON_OFFSET',
    name: 'Carbon Offset',
    description: 'Carbon Offset allows organizations to compensate for their carbon emissions by investing in certified environmental projects. These projects reduce or remove carbon dioxide from the atmosphere, helping to achieve net-zero goals and support sustainable development.',
    iconKey: 'carbon-offset',
    iconUrl: 'https://syncra-staging.s3.ap-southeast-1.amazonaws.com/syncra-doc-ai/icon/20251202-9aac035a-4d36-4e70-8e1c-3e6c47a5ad82.png',
    active: true,
    sortOrder: 5,
    createdAt: '2025-12-03T10:13:37.657803',
    updatedAt: '2025-12-03T10:13:37.657803',
    plans: [],
  },
  {
    id: 4,
    code: 'ALERT',
    name: 'Alert',
    description: 'Alert is a system notification designed to notify users about urgent events, exceptions, or anomalies. It helps you respond quickly to potential issues and maintain smooth operations.',
    iconKey: 'alert',
    iconUrl: 'https://syncra-staging.s3.ap-southeast-1.amazonaws.com/syncra-doc-ai/icon/20251202-652bee28-ec2b-45a3-bda5-836c070445f5.png',
    active: true,
    sortOrder: 6,
    createdAt: '2025-11-18T13:57:27.971927',
    updatedAt: '2025-12-03T10:13:37.919185',
    plans: [
      {
        id: 4,
        moduleId: 4,
        moduleCode: 'ALERT',
        code: 'ALERT_STARTER',
        name: 'Let\'s Talk',
        shortDescription: 'Starter plan for Alert.',
        currency: 'USD',
        priceMonthly: 49.9900,
        priceAnnual: 499.0000,
        ctaLabel: 'Contact Sale',
        popular: false,
        active: true,
        sortOrder: 1,
        features: [
          'Standard usage',
          'Email export support',
          'Basic analytics',
          'Team insights overview',
        ],
        createdAt: '2025-11-18T13:57:28.063179',
        updatedAt: '2025-11-18T13:57:28.063179',
      },
    ],
  },
  {
    id: 10,
    code: 'PRODUCTION_STATUS',
    name: 'Production Status',
    description: 'Production Status is a summary view that shows all key order information in one place—such as products, quantities, pricing, shipping status, and any special notes—helping you confirm accuracy and track progress.',
    iconKey: 'order-recap',
    iconUrl: 'https://syncra-staging.s3.ap-southeast-1.amazonaws.com/syncra-doc-ai/icon/20251202-89ee83fe-ad2c-459e-bc3a-82ebe94fe3e1.png',
    active: true,
    sortOrder: 7,
    createdAt: '2025-12-03T10:13:38.112946',
    updatedAt: '2025-12-03T10:13:38.112946',
    plans: [],
  },
  {
    id: 11,
    code: 'PRODUCTION_PLANNING',
    name: 'Production Planning',
    description: 'Production Planning is the process of coordinating resources, materials, and schedules to meet production targets. It ensures that the right products are manufactured at the right time, optimizing capacity, reducing waste, and improving delivery performance.',
    iconKey: 'production-planning',
    iconUrl: 'https://syncra-staging.s3.ap-southeast-1.amazonaws.com/syncra-doc-ai/icon/20251202-4451ba42-6bc3-4478-a759-55e6cdc7919c.png',
    active: true,
    sortOrder: 8,
    createdAt: '2025-12-03T10:13:38.321198',
    updatedAt: '2025-12-03T10:13:38.321198',
    plans: [],
  },
]

export function useModule() {
  const toast = useToast()

  const { execute: moduleExecute, pending, data: moduleData } = useAsyncData('syncra-modules',
    async () => {
      try {
        const { data, success, reason } = await findModules({ activeOnly: true })
        if (success) {
          return data
        }
        toast.add({
          title: 'Failed',
          description: reason,
          color: 'error',
        })
      }
      catch (err) {
        const e = err as FetchError
        toast.add({
          title: 'Error',
          description: e.data?.reason ?? 'Server error',
          color: 'error',
        })
      }
    },
    {
      immediate: false,
      server: false,
    },
  )

  return {
    moduleData,
    pending,
    moduleExecute,
  }
}
