import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  Boxes,
  ChevronRight,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  LayoutTemplate,
  Package,
  Pencil,
  Percent,
  Search,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

const MEMBERSHIP_EXPIRES = '13/12/2026'

const MEMBERSHIP_FEATURES = [
  {
    title: 'Pan India Shipping',
    desc: 'Pan India Deliveries. Deliver anything, anywhere. Now shipping over 26000 pincodes all over India. Go ahead & start shipping now',
    tone: 'red',
    Icon: Truck,
  },
  {
    title: 'Website Themes',
    desc: 'Create a professional website with access to unlimited themes',
    tone: 'amber',
    Icon: LayoutTemplate,
  },
  {
    title: 'Coupons & Vouchers',
    desc: 'Customers love discounts & offers. Create your own personalised coupons & generate more orders.',
    tone: 'blue',
    Icon: Tag,
  },
  {
    title: 'Store Analytics',
    desc: 'View traffic Analysis across domain',
    tone: 'rose',
    Icon: BarChart3,
  },
  {
    title: 'Prepaid Orders',
    desc: 'Upgrade your ordering experience for Customers. Let them make payment while placing the order.',
    tone: 'indigo',
    Icon: CreditCard,
  },
  {
    title: 'Payment Options',
    desc: 'Now collect payment digitally using wallets, credit & debit cards from your customers, get money directly in your bank account',
    tone: 'emerald',
    Icon: Wallet,
  },
  {
    title: 'Google Analytics',
    desc: 'Analyses the traffic & provides you real-time analysis, behaviour of your users on your website.',
    tone: 'orange',
    Icon: BarChart3,
  },
  {
    title: 'Facebook Pixel',
    desc: 'Verify your store with Facebook Business Manager and improve performance of Facebook ads with Pixel integration.',
    tone: 'fb',
    Icon: Search,
  },
  {
    title: 'Google Tag Manager',
    desc: 'To track the effectiveness of your website, you can use Google tag to transfer data from your website to the associated products.',
    tone: 'slate',
    Icon: Boxes,
  },
  {
    title: 'Google Shopping',
    desc: 'Lets you list your product and show them to users across all Google products: Search, Shopping, Maps & more.',
    tone: 'yellow',
    Icon: ShoppingBag,
  },
  {
    title: 'ePOS',
    desc: 'Send digital bill & easily collect money online from your customers.',
    tone: 'cyan',
    Icon: FileText,
  },
  {
    title: 'Bulk Uploads',
    desc: 'Easily manage your catalog by uploading & editing product details in bulk using excel sheet.',
    tone: 'violet',
    Icon: FileSpreadsheet,
  },
  {
    title: 'Download Order Reports',
    desc: 'Keep updated with your orders and accounts by downloading daily, monthly & quarterly order reports',
    tone: 'pink',
    Icon: Download,
  },
  {
    title: 'Staff Login',
    desc: 'Run your online store with the help of your staffs by giving them permissions to manage your store.',
    tone: 'gray',
    Icon: UserCog,
  },
  {
    title: 'Inventory Management',
    desc: 'Add, update & track stock of your products. Show low stock alert to customers on your site to boost orders.',
    tone: 'lime',
    Icon: Package,
  },
  {
    title: 'Customer Management',
    desc: 'Manage, analyse and connect with your customers now to increase retention and get more orders.',
    tone: 'teal',
    Icon: Users,
  },
  {
    title: 'Lead Generation',
    desc: 'Capture Email IDs/Phone number of customers visiting your store and convert them into sales',
    tone: 'sky',
    Icon: Users,
  },
  {
    title: 'Abandoned Cart',
    desc: 'Connect with customers who have abandoned their carts and help them place orders!',
    tone: 'amber-deep',
    Icon: ShoppingCart,
  },
  {
    title: 'Out of Stock Query',
    desc: 'Get your customer get notified when the product is back in stock',
    tone: 'indigo-deep',
    Icon: Package,
  },
  {
    title: 'Customer Reviews And Ratings',
    desc: 'Allow your customers to share their experience with your products.',
    tone: 'yellow-deep',
    Icon: Star,
  },
  {
    title: 'GST Billing',
    desc: 'Generate GST invoice for every order and download GST report of orders (GSTR – 1)',
    tone: 'emerald-deep',
    Icon: FileText,
  },
  {
    title: 'Bulk Edit',
    desc: 'Effortlessly manage your product catalog by making simultaneous edits to multiple items.',
    tone: 'slate-deep',
    Icon: Pencil,
  },
  {
    title: 'Partial Payment',
    desc: 'Boosting flexibility and trust, Pay a portion in advance rest on delivery with Partial Payment.',
    tone: 'orange-deep',
    Icon: Percent,
  },
  {
    title: 'Advance Custom SEO',
    desc: 'Ability to create customised SEO settings for the products, categories, and collections.',
    tone: 'blue-deep',
    Icon: Search,
  },
]

export default function AdminEcommercePage() {
  const navigate = useNavigate()

  return (
    <div className="admin-page admin-ecommerce">
      <header className="admin-ecommerce__hero">
        <div className="admin-ecommerce__hero-inner">
          <button
            type="button"
            className="admin-ecommerce__back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft size={22} />
          </button>

          <div>
            <h1 className="admin-ecommerce__welcome">
              Welcome to your
              <span className="admin-ecommerce__welcome-line">
                eCommerce
                <span className="admin-ecommerce__elite">
                  <Star size={12} fill="currentColor" aria-hidden />
                  ELITE
                </span>
                Membership
              </span>
            </h1>
            <p className="admin-ecommerce__expires">
              Membership expires on {MEMBERSHIP_EXPIRES}
            </p>
          </div>
        </div>
      </header>

      <div className="admin-ecommerce__list">
        {MEMBERSHIP_FEATURES.map((feature, index) => {
          const Icon = feature.Icon
          return (
            <div key={feature.title} className="admin-ecommerce__item-wrap">
              <button
                type="button"
                className="admin-ecommerce__item"
                onClick={() =>
                  toast.message(feature.title, {
                    description: 'Feature details will open when connected.',
                  })
                }
              >
                <span className={`admin-ecommerce__icon admin-ecommerce__icon--${feature.tone}`} aria-hidden>
                  <Icon size={26} strokeWidth={1.5} />
                </span>
                <span className="admin-ecommerce__copy">
                  <span className="admin-ecommerce__item-title">{feature.title}</span>
                  <span className="admin-ecommerce__item-desc">{feature.desc}</span>
                </span>
                <ChevronRight size={22} className="admin-ecommerce__chevron" aria-hidden />
              </button>
              {index !== MEMBERSHIP_FEATURES.length - 1 ? (
                <div className="admin-ecommerce__divider" />
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
