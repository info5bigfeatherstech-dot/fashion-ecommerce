import AdminSectionPage from './AdminSectionPage'

const META = {
  profile: {
    title: 'Profile',
    description: 'Admin profile and store identity settings.',
  },
  controls: {
    title: 'Controls',
    description: 'Store feature toggles and operational controls.',
  },
  'product-display': {
    title: 'Product display',
    description: 'Control how products appear on the storefront.',
  },
  label: {
    title: 'Label settings',
    description: 'Shipping label and Shipmozo/Shiprocket label preferences.',
  },
  orders: {
    title: 'Order settings',
    description: 'Order workflow defaults and fulfillment preferences.',
  },
  customer: {
    title: 'Customer settings',
    description: 'Customer account and checkout-related store settings.',
  },
  policies: {
    title: 'Store policies',
    description: 'Return, shipping, and privacy policy content.',
  },
  help: {
    title: 'Help center',
    description: 'Help center articles and support content.',
  },
  ideas: {
    title: 'Suggest ideas',
    description: 'Collect and review product/store improvement ideas.',
  },
  other: {
    title: 'Other',
    description: 'Additional store settings from fabFE.',
  },
}

export default function AdminSettingsSectionPage({ section = 'profile' }) {
  const meta = META[section] || META.profile
  return (
    <AdminSectionPage
      eyebrow="Settings"
      title={meta.title}
      description={meta.description}
    />
  )
}
