import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  RotateCcw,
  Send,
  Mail,
  Truck,
  Package,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  RotateCw,
  ExternalLink,
  LogIn,
  Loader2,
  Tag,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { chatbotApi } from '../services/chatbotApi';

function formatInlineText(text, onNavigate) {
  if (!text || typeof text !== 'string') return text;

  // Pattern matching [label](url) OR **bold**
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g;
  if (!pattern.test(text)) return text.replace(/\*\*/g, '');

  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (!part) return null;

    // Markdown link: [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      const isInternal = url.startsWith('/');
      return (
        <a
          key={i}
          href={url}
          onClick={(e) => {
            if (isInternal && onNavigate) {
              e.preventDefault();
              onNavigate(url);
            }
          }}
          target={isInternal ? undefined : '_blank'}
          rel={isInternal ? undefined : 'noopener noreferrer'}
          style={{
            color: '#B38728',
            fontWeight: '600',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            cursor: 'pointer',
          }}
          className="hover:text-[#8C6B1F] transition-colors"
        >
          {label}
        </a>
      );
    }

    // Bold text: **text**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} style={{ fontWeight: '700', color: 'inherit' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part.replace(/\*\*/g, '');
  });
}

function renderLineContent(line, onNavigate) {
  if (!line || typeof line !== 'string') return line;

  // Clean any markdown bold colons, e.g. "• **Return Request:** rest" -> "• Return Request: rest"
  const cleanLine = line
    .replace(/^((?:\d+[.)]|[•\-*])\s+)\*\*([^*:\n]+):\*\*/, '$1$2:')
    .replace(/^((?:\d+[.)]|[•\-*])\s+)\*\*([^*:\n]+)\*\*:/, '$1$2:');

  // Bold point headings (e.g. "• Online Payments: Refund..." or "1. Cash on Delivery (COD): Available...")
  const pointMatch = cleanLine.match(/^((?:\d+[.)]|[•\-*])\s+)([^:\n]{2,50}):\s*(.*)$/);
  if (pointMatch) {
    const [, bullet, pointTitle, rest] = pointMatch;
    const cleanTitle = pointTitle.replace(/\*\*/g, '').trim();
    const cleanRest = rest.replace(/^\*\*\s*/, '').trim();
    return (
      <>
        <span>{bullet}</span>
        <strong style={{ fontWeight: '700', color: 'inherit' }}>{cleanTitle}:</strong>
        {cleanRest ? ' ' : ''}
        {formatInlineText(cleanRest, onNavigate)}
      </>
    );
  }
  return formatInlineText(cleanLine, onNavigate);
}

export function ChatWidget() {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const user = useAppStore((s) => s.user);
  const openAuthModal = useAppStore((s) => s.openAuthModal);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [quickPills, setQuickPills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputContext, setInputContext] = useState(null); // 'ORDER_TRACK' | 'TICKET_MSG' | null
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  const [copiedEmailId, setCopiedEmailId] = useState(null);

  const handleCopyOrderId = (idToCopy, msgId) => {
    if (!idToCopy) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(idToCopy).catch(() => {});
    }
    setCopiedOrderId(msgId || idToCopy);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const handleCopyCoupon = (code) => {
    if (!code) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, quickPills]);

  // Load welcome state when chat opens first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadInitialState();
    }
  }, [isOpen, messages.length]);

  // When user logs in while chat is open, automatically greet them and show main categories
  const prevAuthRef = useRef(isAuthenticated);
  useEffect(() => {
    if (!prevAuthRef.current && isAuthenticated) {
      if (categories.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `auth_ok_${Date.now()}`,
            sender: 'bot',
            text: 'Welcome back! You are now logged in. How can I assist you today?',
          },
        ]);
        setQuickPills(
          categories.map((c) => ({
            id: c.key,
            label: c.title,
            type: 'CATEGORY',
            payload: c,
          }))
        );
        setInputContext(null);
      } else {
        loadInitialState();
      }
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, categories]);

  const loadInitialState = async () => {
    try {
      setLoading(true);
      const data = await chatbotApi.getWelcome();
      const cats = data.categories || [];
      setCategories(cats);

      // Initial bot welcome bubble (matches Tidio greeting)
      setMessages([
        {
          id: 'welcome_1',
          sender: 'bot',
          text: 'Welcome to our store 👋\nHow can I help you today?',
        },
      ]);

      // Pill chips (matching the Tidio layout)
      setQuickPills(
        cats.map((c) => ({
          id: c.key,
          label: c.title,
          type: 'CATEGORY',
          payload: c,
        }))
      );
      setInputContext(null);
    } catch {
      const fallbackCats = [
        { key: 'orders', title: 'Orders & Tracking' },
        { key: 'products', title: 'Products & Sizing' },
        { key: 'returns', title: 'Returns & Refunds' },
        { key: 'payments', title: 'Payments & Offers' },
        { key: 'support', title: 'Contact Support' },
      ];
      setCategories(fallbackCats);
      setMessages([
        {
          id: 'welcome_1',
          sender: 'bot',
          text: 'Welcome to our store 👋\nHow can I help you today?',
        },
      ]);
      setQuickPills(
        fallbackCats.map((c) => ({
          id: c.key,
          label: c.title,
          type: 'CATEGORY',
          payload: c,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInputText('');
    setInputContext(null);
    setQuickPills([]);
    loadInitialState();
  };

  // ── USER CLICKS A PILL CHIP ──
  const handlePillClick = async (pill) => {
    // 0. If clicking Login pill
    if (pill.type === 'LOGIN') {
      openAuthModal({ mode: 'login' });
      return;
    }

    // 0.1 If clicking Navigate pill (e.g. Go to Profile Orders)
    if (pill.type === 'NAVIGATE') {
      if (pill.payload?.path) {
        navigate(pill.payload.path);
      }
      return;
    }

    // 1. Append user's selection to conversation
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, sender: 'user', text: pill.label },
    ]);
    setQuickPills([]); // Clear previous pills

    // Require login if user is logged out and trying to query
    if (!isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        {
          id: `login_prompt_${Date.now()}`,
          sender: 'bot',
          type: 'LOGIN_REQUIRED',
          text: 'Please log in to your account to query our assistant, track orders, or access customer support.',
        },
      ]);
      setQuickPills([
        { id: 'login_pill', label: '🔒 Log In to Continue', type: 'LOGIN' },
      ]);
      return;
    }

    // Back to main menu pill
    if (pill.type === 'BACK_TO_MENU') {
      setMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          sender: 'bot',
          text: 'What else can I help you with?',
        },
      ]);
      setQuickPills(
        categories.map((c) => ({
          id: c.key,
          label: c.title,
          type: 'CATEGORY',
          payload: c,
        }))
      );
      setInputContext(null);
      return;
    }

    // Raise delivery escalation ticket pill
    if (pill.type === 'RAISE_DELIVERY_TICKET') {
      setLoading(true);
      try {
        const data = await chatbotApi.raiseDeliveryTicket({
          orderId: pill.payload?.orderId,
          customerName: user?.name,
          contact: user?.phone || user?.email,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `ticket_ack_${Date.now()}`,
            sender: 'bot',
            text: data.message,
            contactCard: data.contactCard,
          },
        ]);
        setQuickPills([
          { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'bot',
            text: 'Could not raise an escalation ticket right now. Please reach out to our team via email at support.fabuniqo@gmail.com.',
          },
        ]);
        showRootPills();
      } finally {
        setLoading(false);
      }
      return;
    }

    // Category selected -> fetch sub-questions
    if (pill.type === 'CATEGORY') {
      const cat = pill.payload;
      setLoading(true);

      try {
        const data = await chatbotApi.getCategoryQuestions(cat.key);
        const questions = data.questions || [];

        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: `Choose a question about ${cat.title}:`,
          },
        ]);

        const nextPills = questions.map((q) => ({
          id: q.questionId,
          label: q.question.replace(/^[^\w\s]+/g, '').trim(),
          type: 'QUESTION',
          payload: q,
        }));

        nextPills.push({
          id: 'back_main',
          label: '⬅ Main Menu',
          type: 'BACK_TO_MENU',
        });

        setQuickPills(nextPills);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'bot',
            text: 'Unable to load options. Please choose another topic.',
          },
        ]);
        showRootPills();
      } finally {
        setLoading(false);
      }
      return;
    }

    // Specific Question selected
    if (pill.type === 'QUESTION') {
      const q = pill.payload;

      // A. Order tracking
      if (q.actionType === 'ORDER_TRACK') {
        if (!isAuthenticated && !user?.phone && !user?.email && !user?.id && !user?._id) {
          setInputContext('ORDER_TRACK');
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              sender: 'bot',
              text: 'Please log in to view your orders automatically, or type your Order ID / phone number below:',
            },
          ]);
          setQuickPills([
            { id: 'login_pill', label: '🔐 Log In to View Orders', type: 'LOGIN' },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
          inputRef.current?.focus();
          return;
        }

        setLoading(true);
        try {
          const data = await chatbotApi.getUserOrders({
            userId: user?.id || user?._id,
            phone: user?.phone,
            email: user?.email,
            limit: 3,
          });

          if (data?.success && data.orders && data.orders.length > 0) {
            setInputContext(null);
            setMessages((prev) => [
              ...prev,
              {
                id: `b_${Date.now()}`,
                sender: 'bot',
                text:
                  data.orders.length === 1
                    ? 'Here is the tracking status of your recent order:'
                    : `Here are your ${data.orders.length} most recent orders:`,
                type: 'ORDER_RESULT',
                orders: data.orders,
                order: data.orders[0],
              },
            ]);
            setQuickPills([
              { id: 'track_by_id', label: '🔍 Search by Order ID #', type: 'QUESTION', payload: { actionType: 'MANUAL_ORDER_TRACK' } },
              { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
              { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
            ]);
          } else {
            setInputContext('ORDER_TRACK');
            setMessages((prev) => [
              ...prev,
              {
                id: `b_${Date.now()}`,
                sender: 'bot',
                text: "We couldn't find any recent orders associated with your account. If you placed an order as a guest or with a different phone number, please enter your Order ID or phone number below:",
              },
            ]);
            setQuickPills([
              { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
            ]);
            inputRef.current?.focus();
          }
        } catch {
          setInputContext('ORDER_TRACK');
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              sender: 'bot',
              text: 'Please type your Order ID (e.g. #1024) or phone number in the message box below:',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // A2. Manual Order Tracking pill
      if (q.actionType === 'MANUAL_ORDER_TRACK') {
        setInputContext('ORDER_TRACK');
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: 'Please type your Order ID (e.g. #FAB-ECOMM-554418) or phone number in the message box below:',
          },
        ]);
        setQuickPills([
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
        inputRef.current?.focus();
        return;
      }

      // B. Best sellers
      if (q.actionType === 'BEST_SELLERS') {
        setLoading(true);
        try {
          const data = await chatbotApi.getBestSellers();
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              sender: 'bot',
              text: 'Here are our current bestselling pieces:',
              type: 'PRODUCTS',
              products: data.products || [],
            },
          ]);
          setQuickPills([
            { id: 'view_cheap', label: '🪙 Cheaper Products', type: 'QUESTION', payload: { actionType: 'CHEAP_PRODUCTS' } },
            { id: 'view_exp', label: '💎 Luxury Products', type: 'QUESTION', payload: { actionType: 'EXPENSIVE_PRODUCTS' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { id: `err_${Date.now()}`, sender: 'bot', text: 'Could not load products right now.' },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B2. Cheaper / Budget-Friendly products
      if (q.actionType === 'CHEAP_PRODUCTS') {
        setLoading(true);
        try {
          const data = await chatbotApi.getCheaperProducts();
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              sender: 'bot',
              text: data.text || 'Here are our most affordable budget-friendly pieces starting at great prices:',
              type: 'PRODUCTS',
              products: data.products || [],
            },
          ]);
          setQuickPills([
            { id: 'view_exp', label: '💎 Luxury Products', type: 'QUESTION', payload: { actionType: 'EXPENSIVE_PRODUCTS' } },
            { id: 'bestsellers_more', label: '🔥 Best Sellers', type: 'QUESTION', payload: { actionType: 'BEST_SELLERS' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { id: `err_${Date.now()}`, sender: 'bot', text: 'Could not load products right now.' },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B3. Expensive / Luxury products
      if (q.actionType === 'EXPENSIVE_PRODUCTS') {
        setLoading(true);
        try {
          const data = await chatbotApi.getExpensiveProducts();
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              sender: 'bot',
              text: data.text || 'Here are our most exclusive, high-end luxury pieces:',
              type: 'PRODUCTS',
              products: data.products || [],
            },
          ]);
          setQuickPills([
            { id: 'view_cheap', label: '🪙 Cheaper Products', type: 'QUESTION', payload: { actionType: 'CHEAP_PRODUCTS' } },
            { id: 'bestsellers_more', label: '🔥 Best Sellers', type: 'QUESTION', payload: { actionType: 'BEST_SELLERS' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { id: `err_${Date.now()}`, sender: 'bot', text: 'Could not load products right now.' },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B4. Available Coupons & Offers
      if (q.actionType === 'VIEW_COUPONS') {
        setLoading(true);
        try {
          const data = await chatbotApi.getCoupons();
          if (data?.success && data.coupons && data.coupons.length > 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: `b_${Date.now()}`,
                sender: 'bot',
                text: 'Here are the active discount coupons available for you to apply at checkout:',
                type: 'COUPONS',
                coupons: data.coupons,
              },
            ]);
            setQuickPills([
              { id: 'bestsellers_more', label: '🔥 View Best Sellers', type: 'QUESTION', payload: { actionType: 'BEST_SELLERS' } },
              { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
              { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: `b_${Date.now()}`,
                sender: 'bot',
                text: "We don't currently have active promo codes, but all orders above ₹1099 automatically qualify for Free Shipping with a Free Gift on every order!",
              },
            ]);
            setQuickPills([
              { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
            ]);
          }
        } catch {
          setMessages((prev) => [
            ...prev,
            { id: `err_${Date.now()}`, sender: 'bot', text: 'Could not load coupons right now. Please try again later.' },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B5. PIN Code Serviceability Check
      if (
        q.actionType === 'CHECK_PINCODE' ||
        q.actionType === 'MANUAL_PIN_CHECK' ||
        q.questionId === 'check_pincode'
      ) {
        setInputContext('PINCODE_CHECK');
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: 'Please type the 6-digit destination PIN code (e.g. 110001, 400050, 560001) in the message box below to check live delivery & serviceability:',
          },
        ]);
        setQuickPills([
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return;
      }

      // B7. Check Return & Refund Status (Live DB check for logged-in user or by Order ID)
      if (q.actionType === 'CHECK_RETURN_REFUND') {
        setLoading(true);
        try {
          const data = await chatbotApi.checkReturnRefund({
            userId: user?.id || user?._id,
            phone: user?.phone,
            email: user?.email,
          });

          if (data?.found && data?.text) {
            setInputContext(null);
            setMessages((prev) => [
              ...prev,
              {
                id: `ret_ack_${Date.now()}`,
                sender: 'bot',
                text: data.text,
                redirectUrl: data.redirectUrl || '/account/orders',
                redirectLabel: data.redirectLabel || 'View All Orders in Profile',
              },
            ]);
            setQuickPills([
              { id: 'view_profile_orders', label: '📦 Go to My Orders', type: 'NAVIGATE', payload: { path: '/account/orders' } },
              { id: 'check_other_order_ret', label: '🔍 Check Another Order ID', type: 'QUESTION', payload: { actionType: 'MANUAL_RETURN_CHECK' } },
              { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
              { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
            ]);
          } else {
            setInputContext('RETURN_CHECK');
            setMessages((prev) => [
              ...prev,
              {
                id: `b_${Date.now()}`,
                sender: 'bot',
                text: data?.text || 'Please enter your Order ID (e.g. #1024 or FAB-ECOMM-...) to check live return & refund status from the database:',
                redirectUrl: data?.redirectUrl || '/account/orders',
                redirectLabel: data?.redirectLabel || 'Go to My Orders',
              },
            ]);
            setQuickPills([
              { id: 'view_profile_orders', label: '📦 Go to My Orders', type: 'NAVIGATE', payload: { path: '/account/orders' } },
              { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
            ]);
            inputRef.current?.focus();
          }
        } catch {
          setInputContext('RETURN_CHECK');
          setMessages((prev) => [
            ...prev,
            {
              id: `b_${Date.now()}`,
              sender: 'bot',
              text: 'Please enter your Order ID (e.g. #1024) to check your live return and refund status from the database:',
            },
          ]);
          setQuickPills([
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
          inputRef.current?.focus();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B7.2 Manual Return Check Input
      if (q.actionType === 'MANUAL_RETURN_CHECK') {
        setInputContext('RETURN_CHECK');
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: 'Please type your Order ID (e.g. #1024 or FAB-ECOMM-...) in the message box below:',
          },
        ]);
        setQuickPills([
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
        inputRef.current?.focus();
        return;
      }

      // B7.3 Delivery Dispute: Order marked delivered but not received
      if (
        q.actionType === 'DELIVERY_DISPUTE_PROMPT' ||
        q.actionType === 'DELIVERY_DISPUTE' ||
        q.questionId === 'delivered_not_received'
      ) {
        setInputContext('DELIVERY_DISPUTE_CHECK');
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: 'Please type your Order ID (e.g. #FAB-ECOMM-187286) below so we can verify the delivery status in our database and assist you:',
          },
        ]);
        setQuickPills([
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
        inputRef.current?.focus();
        return;
      }

      // B8. Exchange for a different size or item (Live policy & recent order check from DB)
      if (q.actionType === 'EXCHANGE_INQUIRY') {
        setLoading(true);
        try {
          const data = await chatbotApi.getExchangeInquiry({
            userId: user?.id || user?._id,
            phone: user?.phone,
            email: user?.email,
          });

          setMessages((prev) => [
            ...prev,
            {
              id: `exch_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'We gladly offer exchanges for size, fit, or design within 7 days of delivery.',
            },
          ]);
          setQuickPills([
            { id: 'check_ret_status', label: '🔍 Check Return / Refund Status', type: 'QUESTION', payload: { actionType: 'CHECK_RETURN_REFUND' } },
            { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_exch_${Date.now()}`,
              sender: 'bot',
              text: 'We offer size and item exchanges within 7 days of delivery. Please reach our support team via email at support.fabuniqo@gmail.com with your Order ID.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B9. COD Refund process (Live checkout settings check from DB)
      if (q.actionType === 'COD_REFUND_INFO') {
        setLoading(true);
        try {
          const data = await chatbotApi.getCodRefundInfo();
          setMessages((prev) => [
            ...prev,
            {
              id: `cod_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'For Cash on Delivery (COD) orders, refunds are credited directly to your Bank Account or UPI ID within 24–48 hours of warehouse inspection.',
            },
          ]);
          setQuickPills([
            { id: 'check_ret_status', label: '🔍 Check Return / Refund Status', type: 'QUESTION', payload: { actionType: 'CHECK_RETURN_REFUND' } },
            { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_cod_${Date.now()}`,
              sender: 'bot',
              text: 'For COD orders, refunds are transferred directly to your UPI ID or Bank Account within 24–48 hours of warehouse inspection.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B10. Partial Payment Info (Live DB checkout settings check)
      if (q.actionType === 'PARTIAL_PAYMENT_INFO') {
        setLoading(true);
        try {
          const data = await chatbotApi.getPartialPaymentInfo();
          setMessages((prev) => [
            ...prev,
            {
              id: `partial_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'Our store supports Partial Payment (30% online advance + 70% cash at delivery).',
            },
          ]);
          setQuickPills([
            { id: 'view_coupons_more', label: '🏷️ View Coupons', type: 'QUESTION', payload: { actionType: 'VIEW_COUPONS' } },
            { id: 'free_ship_more', label: '🚚 Free Shipping Offer', type: 'QUESTION', payload: { actionType: 'FREE_SHIPPING_INFO' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_partial_${Date.now()}`,
              sender: 'bot',
              text: 'Our store offers Partial Payment (30% online advance + 70% cash at delivery).',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B11. Free Shipping Info (Live DB threshold lookup)
      if (q.actionType === 'FREE_SHIPPING_INFO') {
        setLoading(true);
        try {
          const data = await chatbotApi.getFreeShippingInfo();
          setMessages((prev) => [
            ...prev,
            {
              id: `freeship_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'Free Express Shipping is active on all orders above ₹1099 across India.',
            },
          ]);
          setQuickPills([
            { id: 'view_cheap_p', label: '🪙 Budget Pieces from ₹29', type: 'QUESTION', payload: { actionType: 'CHEAP_PRODUCTS' } },
            { id: 'view_coupons_f', label: '🏷️ View Coupons', type: 'QUESTION', payload: { actionType: 'VIEW_COUPONS' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_freeship_${Date.now()}`,
              sender: 'bot',
              text: 'Free delivery is available on all orders above ₹1099 across India.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B12. EMI & Pay Later Info
      if (q.actionType === 'EMI_INFO') {
        setLoading(true);
        try {
          const data = await chatbotApi.getEmiInfo();
          setMessages((prev) => [
            ...prev,
            {
              id: `emi_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'Credit Card EMI and flexible payment options are available through our payment gateway at checkout.',
            },
          ]);
          setQuickPills([
            { id: 'partial_pay_opt', label: '🪙 Partial Payment (COD)', type: 'QUESTION', payload: { actionType: 'PARTIAL_PAYMENT_INFO' } },
            { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_emi_${Date.now()}`,
              sender: 'bot',
              text: 'Credit Card EMI is available on major bank credit cards during checkout.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B13. Payment Safety & Security Info
      if (q.actionType === 'PAYMENT_SAFETY_INFO') {
        setLoading(true);
        try {
          const data = await chatbotApi.getPaymentSafetyInfo();
          setMessages((prev) => [
            ...prev,
            {
              id: `safe_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'All online transactions are 100% safe, secure, and encrypted with bank-grade security.',
            },
          ]);
          setQuickPills([
            { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_safe_${Date.now()}`,
              sender: 'bot',
              text: 'All online transactions are 100% safe, secure, and encrypted with bank-grade security.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B14. GST Tax Invoice Info (Live DB check for recent orders)
      if (q.actionType === 'GST_INVOICE_INFO') {
        setLoading(true);
        try {
          const data = await chatbotApi.getGstInvoiceInfo({
            userId: user?.id || user?._id,
            phone: user?.phone,
            email: user?.email,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: `gst_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'Yes, every order includes a legitimate GST Tax invoice sent via email and enclosed in the parcel.',
            },
          ]);
          setQuickPills([
            { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_gst_${Date.now()}`,
              sender: 'bot',
              text: 'Every order includes a formal GST tax invoice with your package.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B15. Browse by Category (Dynamic categories & catalog products from DB)
      if (q.actionType === 'BROWSE_CATEGORIES') {
        setLoading(true);
        try {
          const catPayload = q.categoryId
            ? { categoryId: q.categoryId, category: q.categoryName, slug: q.categorySlug }
            : (q.categorySlug ? { slug: q.categorySlug } : (q.categoryName ? { category: q.categoryName } : {}));

          const hasSelectedCategory = Boolean(q.categoryId || q.categorySlug || q.categoryName);
          const data = await chatbotApi.browseCategories(catPayload);

          if (hasSelectedCategory && data?.type === 'PRODUCTS' && data?.products?.length > 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: `cat_prod_${Date.now()}`,
                sender: 'bot',
                text: data.text || `Here are 4 of our pieces in ${data.category || q.categoryLabel || 'this category'}:`,
                type: 'PRODUCTS',
                products: data.products,
              },
            ]);
            setQuickPills([
              { id: 'all_cats', label: '💍 Browse Other Categories', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES' } },
              { id: 'view_bestsellers', label: '🔥 Best Sellers', type: 'QUESTION', payload: { actionType: 'BEST_SELLERS' } },
              { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: `cat_ack_${Date.now()}`,
                sender: 'bot',
                text: data?.text || 'Please choose a category below to explore our jewelry collections:',
              },
            ]);

            const dynamicPills = [];
            if (Array.isArray(data?.categories) && data.categories.length > 0) {
              data.categories.forEach((c) => {
                dynamicPills.push({
                  id: `cat_${c.slug || c.id}`,
                  label: `${c.emoji || '✨'} ${c.label || c.name}`,
                  type: 'QUESTION',
                  payload: {
                    actionType: 'BROWSE_CATEGORIES',
                    categoryId: c.id,
                    categorySlug: c.slug,
                    categoryName: c.name,
                    categoryLabel: c.label || c.name,
                  },
                });
              });
            } else {
              dynamicPills.push(
                { id: 'cat_earrings', label: '✨ Earrings & Jhumkas', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES', categoryName: 'Earrings & Studs', categoryLabel: 'Earrings & Jhumkas' } },
                { id: 'cat_rings', label: '💍 Rings', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES', categoryName: 'rings', categoryLabel: 'Rings' } },
                { id: 'cat_necklaces', label: '📿 Necklaces & Pendants', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES', categoryName: 'necklace-pendants', categoryLabel: 'Necklaces & Pendants' } },
                { id: 'cat_sets', label: '💎 Necklace Sets', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES', categoryName: 'Necklace Sets', categoryLabel: 'Necklace Sets' } },
                { id: 'cat_mangalsutra', label: '⚜️ Mangalsutras', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES', categoryName: 'Mangalsutra', categoryLabel: 'Mangalsutras' } },
                { id: 'cat_bangles', label: '💫 Bangles & Bracelets', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES', categoryName: 'bracelets-bangles', categoryLabel: 'Bangles & Bracelets' } },
                { id: 'cat_anklets', label: '🌸 Anklets & Toe Rings', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES', categoryName: 'Anklets & Toe Rings', categoryLabel: 'Anklets & Toe Rings' } },
                { id: 'cat_nath', label: '👑 Nath & Nose Rings', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES', categoryName: 'Nath & Nose Rings', categoryLabel: 'Nath & Nose Rings' } }
              );
            }
            dynamicPills.push({ id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' });
            setQuickPills(dynamicPills);
          }
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_cat_${Date.now()}`,
              sender: 'bot',
              text: 'Browse our jewelry collections: Earrings, Necklaces, Rings, Bangles & Bracelets.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B16. Jewelry Care: Will it tarnish or fade (Live DB check for anti-tarnish micro-plating & alloy)
      if (q.actionType === 'JEWELRY_CARE_INFO') {
        setLoading(true);
        try {
          const data = await chatbotApi.getJewelryCareInfo();
          setMessages((prev) => [
            ...prev,
            {
              id: `care_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'Our jewelry is crafted with premium anti-tarnish micro-plating. Keep away from water and perfumes to maintain shine.',
            },
          ]);
          setQuickPills([
            { id: 'hypo_more', label: '🌿 Skin-Friendly & Hypoallergenic', type: 'QUESTION', payload: { actionType: 'HYPOALLERGENIC_INFO' } },
            { id: 'gift_more', label: '🎁 Gift Packaging & Cards', type: 'QUESTION', payload: { actionType: 'GIFT_PACKAGING_INFO' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_care_${Date.now()}`,
              sender: 'bot',
              text: 'Our jewelry features protective anti-tarnish micro-plating and stays bright with proper care.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B17. Gift Packaging & Personalized Message Cards (Live DB check for free gift offers & store settings)
      if (q.actionType === 'GIFT_PACKAGING_INFO') {
        setLoading(true);
        try {
          const data = await chatbotApi.getGiftPackagingInfo();
          setMessages((prev) => [
            ...prev,
            {
              id: `gift_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'Every item is delivered in a luxury rigid gift box with velvet cushioning and complimentary gift note.',
            },
          ]);
          setQuickPills([
            { id: 'browse_cats', label: '💍 Browse by Category', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES' } },
            { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_gift_${Date.now()}`,
              sender: 'bot',
              text: 'Every order comes in a signature luxury gift box with free personalized message card support.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }

      // B18. Skin-Friendly & Hypoallergenic (Live DB check for nickel-free & lead-free alloys)
      if (q.actionType === 'HYPOALLERGENIC_INFO') {
        setLoading(true);
        try {
          const data = await chatbotApi.getHypoallergenicInfo();
          setMessages((prev) => [
            ...prev,
            {
              id: `hypo_ack_${Date.now()}`,
              sender: 'bot',
              text: data?.text || 'All our jewelry is 100% skin-friendly, lead-free and nickel-free, safe for sensitive skin.',
            },
          ]);
          setQuickPills([
            { id: 'care_more', label: '✨ Jewelry Care: Will it tarnish?', type: 'QUESTION', payload: { actionType: 'JEWELRY_CARE_INFO' } },
            { id: 'browse_cats', label: '💍 Browse by Category', type: 'QUESTION', payload: { actionType: 'BROWSE_CATEGORIES' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `err_hypo_${Date.now()}`,
              sender: 'bot',
              text: 'Our jewelry is 100% nickel-free and lead-free, designed to be completely safe for sensitive skin.',
            },
          ]);
          showRootPills();
        } finally {
          setLoading(false);
        }
        return;
      }
      if (q.actionType === 'RAISE_TICKET') {
        setInputContext('TICKET_MSG');
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: 'Please enter your phone number or email followed by your question below:',
          },
        ]);
        inputRef.current?.focus();
        return;
      }

      // D. Standard FAQ Answer
      setLoading(true);
      try {
        const data = await chatbotApi.getAnswer(q.questionId);
        const faq = data.faq || {};

        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: faq.answerText,
            type: faq.actionType,
            contactCard: faq.contactCard,
          },
        ]);

        setQuickPills([
          { id: 'another_q', label: 'Ask Another Question', type: 'BACK_TO_MENU' },
          { id: 'talk_agent', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'bot',
            text: 'Sorry, I could not fetch that answer right now.',
          },
        ]);
        showRootPills();
      } finally {
        setLoading(false);
      }
    }
  };

  const showRootPills = () => {
    setQuickPills(
      categories.map((c) => ({
        id: c.key,
        label: c.title,
        type: 'CATEGORY',
        payload: c,
      }))
    );
  };

  // ── SUBMIT TEXT IN COMPOSER (Input + Circular Send Button) ──
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const query = inputText.trim();
    if (!query) return;

    setInputText('');
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, sender: 'user', text: query },
    ]);
    setQuickPills([]);

    // Require login if user is logged out and trying to query
    if (!isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        {
          id: `login_prompt_${Date.now()}`,
          sender: 'bot',
          type: 'LOGIN_REQUIRED',
          text: 'Please log in to your account to query our assistant, track orders, or access customer support.',
        },
      ]);
      setQuickPills([
        { id: 'login_pill', label: '🔒 Log In to Continue', type: 'LOGIN' },
      ]);
      return;
    }

    // ── PRIORITY 1: Handle Active Input Contexts First ──

    // 1A. PIN Code Serviceability Check Input
    if (inputContext === 'PINCODE_CHECK') {
      const pinCandidate = query.replace(/\D/g, '').trim();
      if (!pinCandidate || pinCandidate.length !== 6) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_pin_${Date.now()}`,
            sender: 'bot',
            text: `"${query}" is not a valid 6-digit PIN code. Please type a valid 6-digit destination PIN code (e.g. 110001, 400050, 560001):`,
          },
        ]);
        setQuickPills([
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
        return;
      }

      setInputContext(null);
      setLoading(true);

      try {
        const data = await chatbotApi.checkPincode({ pincode: pinCandidate });
        setMessages((prev) => [
          ...prev,
          {
            id: `pin_ack_${Date.now()}`,
            sender: 'bot',
            text: data.text || 'PIN code verification completed.',
          },
        ]);
        setQuickPills([
          { id: 'check_other_pin', label: '📍 Check Another PIN Code', type: 'QUESTION', payload: { actionType: 'MANUAL_PIN_CHECK' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_pin_${Date.now()}`,
            sender: 'bot',
            text: err?.message || 'Could not verify PIN code serviceability. Please try again.',
          },
        ]);
        showRootPills();
      } finally {
        setLoading(false);
      }
      return;
    }

    // 1B. Support Ticket Input
    if (inputContext === 'TICKET_MSG') {
      setInputContext(null);
      setLoading(true);

      try {
        const data = await chatbotApi.submitTicket({
          contact: query,
          message: query,
          category: 'Storefront Chat Inquiry',
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `ticket_ack_${Date.now()}`,
            sender: 'bot',
            text:
              data.message ||
              'Thank you! Your message has been sent to our customer care team.',
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_ticket_${Date.now()}`,
            sender: 'bot',
            text: 'Could not send ticket. You can reach us directly via email at support.fabuniqo@gmail.com.',
          },
        ]);
      } finally {
        setLoading(false);
        showRootPills();
      }
      return;
    }

    // 1C. Explicit Order Tracking Input Context
    if (inputContext === 'ORDER_TRACK') {
      setLoading(true);

      try {
        const data = await chatbotApi.trackOrder(query);
        if (data.found && data.order) {
          setInputContext(null);
          setMessages((prev) => [
            ...prev,
            {
              id: `track_res_${Date.now()}`,
              sender: 'bot',
              type: 'ORDER_RESULT',
              order: data.order,
            },
          ]);
        } else {
          setInputContext('ORDER_TRACK');
          setMessages((prev) => [
            ...prev,
            {
              id: `track_nf_${Date.now()}`,
              sender: 'bot',
              text:
                data.message ||
                `I could not find an order matching "${query}". Please check the ID or contact support.`,
            },
          ]);
        }

        setQuickPills([
          { id: 'track_again', label: '🔍 Track Another Order', type: 'QUESTION', payload: { actionType: 'MANUAL_ORDER_TRACK' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_track_${Date.now()}`,
            sender: 'bot',
            text: 'Order tracking service is momentarily busy. Please try again later.',
          },
        ]);
        showRootPills();
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2C. Live Return & Refund Status Check by typed Order ID
    if (inputContext === 'RETURN_CHECK') {
      setInputContext(null);
      setLoading(true);

      try {
        const data = await chatbotApi.checkReturnRefund({
          query,
          userId: user?.id || user?._id,
          phone: user?.phone,
          email: user?.email,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `ret_ack_${Date.now()}`,
            sender: 'bot',
            text: data.text || 'Return status details loaded.',
            redirectUrl: data.redirectUrl || '/account/orders',
            redirectLabel: data.redirectLabel || 'View All Orders in Profile',
          },
        ]);
        setQuickPills([
          { id: 'view_profile_orders', label: '📦 Go to My Orders', type: 'NAVIGATE', payload: { path: '/account/orders' } },
          { id: 'check_other_ret', label: '🔍 Check Another Order ID', type: 'QUESTION', payload: { actionType: 'MANUAL_RETURN_CHECK' } },
          { id: 'talk_agent', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_ret_${Date.now()}`,
            sender: 'bot',
            text: err?.message || 'Could not verify return status right now. Please try again or message support.',
          },
        ]);
        showRootPills();
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2D. Delivery Dispute Check by typed Order ID (Order marked delivered but not received)
    if (inputContext === 'DELIVERY_DISPUTE_CHECK') {
      setInputContext(null);
      setLoading(true);

      try {
        const data = await chatbotApi.checkDeliveryDispute({
          orderId: query,
          userId: user?.id || user?._id,
          phone: user?.phone,
          email: user?.email,
        });

        if (data.found && data.order) {
          if (data.isDelivered) {
            setMessages((prev) => [
              ...prev,
              {
                id: `deliv_ack_${Date.now()}`,
                sender: 'bot',
                text: data.text,
              },
            ]);
            setQuickPills([
              {
                id: 'raise_ticket_for_order',
                label: '📝 Raise Ticket for this Order',
                type: 'RAISE_DELIVERY_TICKET',
                payload: { orderId: data.order.orderId },
              },
              {
                id: 'check_other_order_deliv',
                label: '🔍 Check Another Order ID',
                type: 'QUESTION',
                payload: { actionType: 'DELIVERY_DISPUTE_PROMPT' },
              },
              { id: 'talk_agent', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
              { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
            ]);
          } else {
            // Not yet marked delivered! Show compact order card and live progress
            setMessages((prev) => [
              ...prev,
              {
                id: `deliv_not_yet_${Date.now()}`,
                sender: 'bot',
                text: data.text,
                type: 'ORDER_RESULT',
                order: data.order,
              },
            ]);
            setQuickPills([
              { id: 'talk_support', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
              { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
            ]);
          }
        } else {
          setInputContext('DELIVERY_DISPUTE_CHECK');
          setMessages((prev) => [
            ...prev,
            {
              id: `err_deliv_${Date.now()}`,
              sender: 'bot',
              text: data.message || `Could not find an order matching "${query}". Please check your Order ID and try again.`,
            },
          ]);
          setQuickPills([
            { id: 'raise_ticket_gen', label: '📝 Raise Support Ticket', type: 'QUESTION', payload: { actionType: 'RAISE_TICKET' } },
            { id: 'talk_agent', label: '📞 Talk to Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
            { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          ]);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_deliv_ex_${Date.now()}`,
            sender: 'bot',
            text: err?.message || 'Could not verify delivery status right now. Please try again or message support.',
          },
        ]);
        showRootPills();
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── PRIORITY 2: Free-form queries without active input context ──

    // 2A. Pure 6-digit PIN code check (e.g. user directly types "110045" or "pincode 110045")
    const cleanDigits = query.replace(/\D/g, '').trim();
    const isPurePincode =
      /^[1-9]\d{5}$/.test(query.trim()) ||
      (cleanDigits.length === 6 && /\b(pin|pincode|deliver|delivery|serviceable|serviceability|check)\b/i.test(query));

    if (isPurePincode) {
      setLoading(true);
      const pinCandidate = query.trim().length === 6 ? query.trim() : cleanDigits;
      try {
        const data = await chatbotApi.checkPincode({ pincode: pinCandidate });
        setMessages((prev) => [
          ...prev,
          {
            id: `pin_ack_${Date.now()}`,
            sender: 'bot',
            text: data.text || 'PIN code verification completed.',
          },
        ]);
        setQuickPills([
          { id: 'check_other_pin', label: '📍 Check Another PIN Code', type: 'QUESTION', payload: { actionType: 'MANUAL_PIN_CHECK' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_pin_${Date.now()}`,
            sender: 'bot',
            text: err?.message || 'Could not verify PIN code serviceability. Please try again.',
          },
        ]);
        showRootPills();
      } finally {
        setLoading(false);
      }
      return;
    }

    // 2B. Explicit order tracking pattern (e.g. #1024, FAB-ECOMM-..., or tracking words)
    const cleanId = query.replace(/[#\s]/g, '');
    const isExplicitOrderPattern =
      /^(?:FAB|ECOMM|ORD|ORDER)[-_]?\w+/i.test(cleanId) ||
      /^#\d{3,12}$/i.test(query.trim()) ||
      /\b(?:track|tracking|order\s*status|where\s*is\s*my\s*order)\b/i.test(query);

    if (isExplicitOrderPattern) {
      setLoading(true);
      try {
        const data = await chatbotApi.trackOrder(query);
        if (data.found && data.order) {
          setInputContext(null);
          setMessages((prev) => [
            ...prev,
            {
              id: `track_res_${Date.now()}`,
              sender: 'bot',
              type: 'ORDER_RESULT',
              order: data.order,
            },
          ]);
        } else {
          setInputContext('ORDER_TRACK');
          setMessages((prev) => [
            ...prev,
            {
              id: `track_nf_${Date.now()}`,
              sender: 'bot',
              text:
                data.message ||
                `I could not find an order matching "${query}". Please check the ID or contact support.`,
            },
          ]);
        }
        setQuickPills([
          { id: 'track_again', label: '🔍 Track Another Order', type: 'QUESTION', payload: { actionType: 'MANUAL_ORDER_TRACK' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_track_${Date.now()}`,
            sender: 'bot',
            text: 'Order tracking service is momentarily busy. Please try again later.',
          },
        ]);
        showRootPills();
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. General typed query: Smart 4-Tier Intent Pipeline
    setLoading(true);
    try {
      const data = await chatbotApi.sendGeneralQuery(query);

      if (data.type === 'PRODUCTS' && data.products && data.products.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: data.text,
            type: 'PRODUCTS',
            products: data.products,
          },
        ]);
        setQuickPills([
          { id: 'bestsellers_more', label: '⭐ View Best Sellers', type: 'QUESTION', payload: { actionType: 'BEST_SELLERS' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } else if (data.type === 'FAQ_ANSWER') {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: data.text,
          },
        ]);
        setQuickPills([
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
          { id: 'ask_support', label: '📞 Contact Support', type: 'CATEGORY', payload: { key: 'support', title: 'Contact Support' } },
        ]);
      } else if (data.type === 'SUPPORT_PROMPT') {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: data.text,
            contactCard: data.contactCard,
          },
        ]);
        setQuickPills([
          { id: 'leave_msg', label: '✉ Leave Support Note', type: 'QUESTION', payload: { actionType: 'RAISE_TICKET' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } else if (data.type === 'ORDER_RESULT' && data.order) {
        setMessages((prev) => [
          ...prev,
          {
            id: `track_res_${Date.now()}`,
            sender: 'bot',
            type: 'ORDER_RESULT',
            order: data.order,
          },
        ]);
        setQuickPills([
          { id: 'track_again', label: '🔍 Track Another Order', type: 'QUESTION', payload: { actionType: 'MANUAL_ORDER_TRACK' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } else if (data.type === 'ORDER_NOT_FOUND') {
        setInputContext('ORDER_TRACK');
        setMessages((prev) => [
          ...prev,
          {
            id: `track_nf_${Date.now()}`,
            sender: 'bot',
            text: data.text || 'We could not find any order matching that ID.',
          },
        ]);
        setQuickPills([
          { id: 'track_again', label: '🔍 Track Another Order', type: 'QUESTION', payload: { actionType: 'MANUAL_ORDER_TRACK' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } else if (data.type === 'ORDER_PROMPT') {
        setInputContext('ORDER_TRACK');
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: data.text || 'Please enter your Order ID (e.g. #1024 or FAB-ECOMM-...) or phone number:',
          },
        ]);
        setQuickPills([
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } else if (data.type === 'DELIVERY_DISPUTE_PROMPT') {
        setInputContext('DELIVERY_DISPUTE_CHECK');
        setMessages((prev) => [
          ...prev,
          {
            id: `deliv_p_${Date.now()}`,
            sender: 'bot',
            text: data.text || 'Please enter your Order ID (e.g. #FAB-ECOMM-187286) to verify delivery status in our database:',
          },
        ]);
        setQuickPills([
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
        inputRef.current?.focus();
      } else if (data.type === 'PINCODE_PROMPT') {
        setInputContext('PINCODE_CHECK');
        setMessages((prev) => [
          ...prev,
          {
            id: `pin_p_${Date.now()}`,
            sender: 'bot',
            text: data.text || 'Please type the 6-digit destination PIN code (e.g. 110001, 400050, 560001) in the message box below to check live delivery & serviceability:',
          },
        ]);
        setQuickPills([
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      } else if (data.type === 'COUPONS' && data.coupons && data.coupons.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: data.text || 'Here are our active coupons and discounts:',
            type: 'COUPONS',
            coupons: data.coupons,
          },
        ]);
        setQuickPills([
          { id: 'bestsellers_more', label: '🔥 View Best Sellers', type: 'QUESTION', payload: { actionType: 'BEST_SELLERS' } },
          { id: 'back_main', label: '⬅ Main Menu', type: 'BACK_TO_MENU' },
        ]);
      } else {
        // Fallback / standard options
        setMessages((prev) => [
          ...prev,
          {
            id: `b_${Date.now()}`,
            sender: 'bot',
            text: data.text || 'Thanks for your message! To help you right away, please select a topic:',
          },
        ]);
        showRootPills();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `b_${Date.now()}`,
          sender: 'bot',
          text: `Thanks for your message! To help you right away, please select a topic:`,
        },
      ]);
      showRootPills();
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusStyle = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('deliver') || s.includes('complet')) {
      return {
        bg: '#EAF8F1',
        color: '#0A7A48',
        border: '1px solid #B7E8CE',
        label: status?.toUpperCase() || 'DELIVERED',
      };
    }
    if (s.includes('cancel') || s.includes('fail') || s.includes('reject')) {
      return {
        bg: '#FDF2F2',
        color: '#C53030',
        border: '1px solid #F8B4B4',
        label: status?.toUpperCase() || 'CANCELLED',
      };
    }
    if (s.includes('ship') || s.includes('transit') || s.includes('dispatch') || s.includes('out')) {
      return {
        bg: '#EFF6FF',
        color: '#1D4ED8',
        border: '1px solid #BFDBFE',
        label: status?.toUpperCase() || 'IN TRANSIT',
      };
    }
    return {
      bg: '#FDF8EC',
      color: '#926A18',
      border: '1px solid #F5E5BE',
      label: status?.toUpperCase() || 'PROCESSING',
    };
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 999999,
        fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
      }}
    >
      <style>{`
        @keyframes fabTypingDot {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.35; }
          40% { transform: scale(1.2) translateY(-2px); opacity: 1; }
        }
      `}</style>
      {/* ── FLOATING LAUNCHER BUTTON ── */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'linear-gradient(135deg, rgb(168, 132, 48) 0%, rgb(196, 157, 64) 45%, rgb(209, 167, 67) 100%)',
            color: '#14120F',
            padding: '13px 20px',
            borderRadius: '9999px',
            boxShadow: '0 12px 28px -4px rgba(168, 132, 48, 0.45)',
            border: '1.5px solid rgba(255, 255, 255, 0.5)',
          }}
          className="group hover:brightness-105 transition-all duration-300 transform hover:scale-105 active:scale-95"
          aria-label="Open Chat"
        >
     
          <MessageCircle className="w-4 h-4 text-[#14120F] group-hover:rotate-6 transition-transform" />
          <span
            style={{
              fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
              letterSpacing: '0.06em',
            }}
            className="text-xs font-bold uppercase text-[#14120F]"
          >
            Need Help?
          </span>
        </button>
      )}

      {/* ── TIDIO-STRUCTURED CHAT WINDOW ── */}
      {isOpen && (
        <div
          style={{
            backgroundColor: '#FAF7F2',
            boxShadow: '0 25px 65px -15px rgba(20, 18, 15, 0.35)',
            border: '1px solid #DDD7CC',
            borderRadius: '24px',
            overflow: 'hidden',
          }}
          className="flex flex-col w-[350px] sm:w-[380px] h-[580px] max-h-[85vh] transition-all duration-200"
        >
          {/* ── 1. BRAND THEME GOLD HEADER WITH PROPER SPACING ── */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgb(168, 132, 48) 0%, rgb(196, 157, 64) 45%, rgb(209, 167, 67) 100%)',
              borderBottom: '1px solid rgba(20, 18, 15, 0.12)',
              padding: '18px 20px',
            }}
            className="relative text-[#14120F]"
          >
            <div className="flex items-center justify-between">
              {/* Avatar + Title Column with generous spacing */}
              <div className="flex items-center gap-3.5">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#14120F]/70 leading-none">
                    Chat with
                  </p>
                  <h3
                    style={{
                      fontFamily: "var(--font-display, 'Bodoni Moda', serif)",
                      letterSpacing: '0.04em',
                    }}
                    className="text-[15px] font-bold text-[#14120F] leading-tight"
                  >
                    FABUNIQO Assistant
                  </h3>
                  <div className="flex items-center gap-1.5 pt-0.5 text-[11px] font-semibold text-[#14120F]/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>We are online! Replies instantly</span>
                  </div>
                </div>
              </div>

              {/* Header Actions (Reset & Close) */}
              <div className="flex items-center gap-1 -mt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  title="Restart conversation"
                  style={{ cursor: 'pointer' }}
                  className="p-2 rounded-full text-[#14120F]/80 hover:text-[#14120F] hover:bg-black/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  style={{ cursor: 'pointer' }}
                  className="p-2 rounded-full text-[#14120F]/80 hover:text-[#14120F] hover:bg-black/10 transition-colors"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── 2. CONVERSATION CANVAS ── */}
          <div
            style={{
              overflowX: 'hidden',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#DDD7CC transparent',
              padding: '18px 16px',
            }}
            className="flex-1 space-y-4 bg-[#FAF7F2]"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  margin: '4px 0',
                }}
              >
                {/* Speech Bubble with Guaranteed Inline Padding & Spacing */}
                {msg.text && (
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      fontSize: '13px',
                      lineHeight: '1.6',
                      maxWidth: '85%',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                      fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                      wordBreak: 'break-word',
                      ...(msg.sender === 'user'
                        ? {
                            backgroundColor: '#14120F',
                            color: '#FAF7F2',
                            border: '1px solid rgba(209, 167, 67, 0.4)',
                          }
                        : {
                            backgroundColor: '#FFFFFF',
                            color: '#14120F',
                            border: '1px solid #DDD7CC',
                          }),
                    }}
                  >
                    {msg.text.split(/\n+/).filter(Boolean).map((line, pIdx) => {
                      const trimmed = line.trim();
                      const isPoint = /^(?:\d+[.)]|[•\-*])\s+/.test(trimmed);
                      return (
                        <div
                          key={pIdx}
                          style={{
                            marginTop: pIdx === 0 ? '0px' : isPoint ? '12px' : '8px',
                            lineHeight: '1.55',
                          }}
                        >
                          {renderLineContent(trimmed, navigate)}
                        </div>
                      );
                    })}

                    {/* Direct Redirect Action Button (e.g. Go to Profile Orders) */}
                    {msg.redirectUrl && (
                      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #EAE5DC' }}>
                        <a
                          href={msg.redirectUrl}
                          onClick={(e) => {
                            e.preventDefault();
                            if (navigate) navigate(msg.redirectUrl);
                            else window.location.href = msg.redirectUrl;
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '7px',
                            padding: '9px 12px',
                            backgroundColor: '#14120F',
                            color: '#FAF7F2',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            border: '1px solid #D1A743',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                            boxSizing: 'border-box',
                            transition: 'all 0.15s ease',
                          }}
                          className="hover:bg-[#2A2621] active:scale-95"
                        >
                          <Package style={{ width: '13px', height: '13px', color: '#D1A743' }} />
                          <span>{msg.redirectLabel || 'View All Orders in Profile'}</span>
                          <ExternalLink style={{ width: '11px', height: '11px' }} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Login Required Action Box */}
                {msg.type === 'LOGIN_REQUIRED' && (
                  <div
                    style={{
                      marginTop: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      maxWidth: '85%',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openAuthModal({ mode: 'login' })}
                      style={{
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, rgb(168, 132, 48) 0%, rgb(196, 157, 64) 100%)',
                        color: '#14120F',
                        fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                        fontWeight: '700',
                        fontSize: '13px',
                        padding: '12px 20px',
                        borderRadius: '9999px',
                        border: 'none',
                        outline: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(168, 132, 48, 0.35)',
                        transition: 'all 0.15s ease',
                      }}
                      className="hover:brightness-105 active:scale-95"
                    >
                      <LogIn style={{ width: '16px', height: '16px' }} />
                      <span>Log In / Sign In</span>
                    </button>
                  </div>
                )}

                {/* Best Sellers Cards */}
                {msg.type === 'PRODUCTS' && msg.products && (
                  <div
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '9px',
                    }}
                  >
                    {msg.products.map((prod) => (
                      <a
                        key={prod.id}
                        href={`/product/${prod.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#FFFFFF',
                          border: '1.5px solid #DDD7CC',
                          borderRadius: '16px',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'all 0.15s ease',
                        }}
                        className="hover:border-[#D1A743] hover:shadow-md hover:scale-[1.01] active:scale-[0.99] group"
                        title={`View ${prod.title}`}
                      >
                        {prod.thumbnail ? (
                          <img
                            src={prod.thumbnail}
                            alt={prod.title}
                            style={{
                              width: '50px',
                              height: '50px',
                              minWidth: '50px',
                              objectFit: 'cover',
                              borderRadius: '10px',
                              backgroundColor: '#FAF7F2',
                              border: '1px solid #DDD7CC',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '50px',
                              height: '50px',
                              minWidth: '50px',
                              borderRadius: '10px',
                              backgroundColor: '#FAF7F2',
                              border: '1px solid #DDD7CC',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#D1A743',
                            }}
                          >
                            <Sparkles style={{ width: '18px', height: '18px' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4
                            style={{
                              fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                              fontSize: '12px',
                              fontWeight: '600',
                              color: '#14120F',
                              lineHeight: '1.3',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              margin: 0,
                            }}
                            title={prod.title}
                          >
                            {prod.title}
                          </h4>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginTop: '4px',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#14120F',
                              }}
                            >
                              ₹{prod.price}
                            </span>
                            {prod.originalPrice && prod.originalPrice > prod.price && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  color: '#8C827A',
                                  textDecoration: 'line-through',
                                }}
                              >
                                ₹{prod.originalPrice}
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            padding: '8px',
                            borderRadius: '10px',
                            backgroundColor: '#FAF7F2',
                            border: '1px solid #DDD7CC',
                            color: '#14120F',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.15s ease',
                          }}
                          className="group-hover:bg-[#14120F] group-hover:text-[#FAF7F2] group-hover:border-[#14120F]"
                          title="View Product"
                        >
                          <ExternalLink style={{ width: '14px', height: '14px' }} />
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {/* ── COMPACT COUPON CARDS ── */}
                {msg.type === 'COUPONS' && msg.coupons && (
                  <div
                    style={{
                      width: '100%',
                      marginTop: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {msg.coupons.map((coupon) => {
                      const isCopied = copiedCoupon === coupon.code;
                      return (
                        <div
                          key={coupon.id || coupon.code}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #DDD7CC',
                            borderRadius: '10px',
                            padding: '9px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                            fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                            boxSizing: 'border-box',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                backgroundColor: 'rgba(209, 167, 67, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#A88430',
                                flexShrink: 0,
                              }}
                            >
                              <Tag style={{ width: '13px', height: '13px' }} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontSize: '13.5px',
                                    fontWeight: '800',
                                    color: '#14120F',
                                    letterSpacing: '0.06em',
                                  }}
                                >
                                  {coupon.code}
                                </span>
                                {coupon.discountLabel && (
                                  <span
                                    style={{
                                      backgroundColor: '#FAF7F2',
                                      color: '#A88430',
                                      border: '1px solid rgba(209, 167, 67, 0.35)',
                                      padding: '1px 6px',
                                      borderRadius: '9999px',
                                      fontSize: '10px',
                                      fontWeight: '800',
                                      letterSpacing: '0.02em',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {coupon.discountLabel}
                                  </span>
                                )}
                              </div>
                              {coupon.name && (
                                <span
                                  style={{
                                    fontSize: '10.5px',
                                    color: '#8C827A',
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {coupon.name}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyCoupon(coupon.code)}
                            style={{
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              borderRadius: '7px',
                              backgroundColor: isCopied ? '#EAF8F1' : '#14120F',
                              color: isCopied ? '#0A7A48' : '#FAF7F2',
                              border: isCopied ? '1px solid #B7E8CE' : 'none',
                              fontSize: '11px',
                              fontWeight: '700',
                              flexShrink: 0,
                              transition: 'all 0.15s ease',
                            }}
                            className="active:scale-95 hover:opacity-90"
                            title={isCopied ? 'Copied code!' : 'Copy promo code'}
                          >
                            {isCopied ? (
                              <>
                                <Check style={{ width: '12px', height: '12px', color: '#0A7A48' }} />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy style={{ width: '12px', height: '12px' }} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── COMPACT ORDER TRACKING RESULT CARDS ── */}
                {msg.type === 'ORDER_RESULT' && (msg.orders || msg.order) && (() => {
                  const ordersList = msg.orders && msg.orders.length > 0 ? msg.orders : [msg.order];
                  return (
                    <div
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {ordersList.map((orderItem) => {
                        const statusStyle = getOrderStatusStyle(orderItem.status);
                        const isCopied = copiedOrderId === orderItem.orderId;

                        return (
                          <div
                            key={orderItem.orderId}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1.5px solid #E8E2D8',
                              borderRadius: '14px',
                              padding: '12px',
                              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                              fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                              boxSizing: 'border-box',
                              width: '100%',
                            }}
                          >
                            {/* Top Row: Order ID + Copy + Status Badge */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                                paddingBottom: '8px',
                                borderBottom: '1px solid #F0ECE4',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                <span
                                  style={{
                                    fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)",
                                    fontSize: '13.5px',
                                    fontWeight: '700',
                                    color: '#14120F',
                                  }}
                                >
                                  #{orderItem.orderId}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyOrderId(orderItem.orderId)}
                                  title={isCopied ? 'Copied Order ID!' : 'Copy Order ID'}
                                  aria-label="Copy Order ID"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    background: isCopied ? '#EAF8F1' : '#FAF7F2',
                                    border: isCopied ? '1px solid #B7E8CE' : '1px solid #EDE7DD',
                                    borderRadius: '5px',
                                    padding: '2px 5px',
                                    cursor: 'pointer',
                                    color: isCopied ? '#059669' : '#8C827A',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    gap: '3px',
                                    transition: 'all 0.15s ease',
                                  }}
                                  className="hover:text-[#14120F] hover:border-[#D1A743] active:scale-95"
                                >
                                  {isCopied ? (
                                    <>
                                      <Check style={{ width: '10px', height: '10px', color: '#059669' }} />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy style={{ width: '10px', height: '10px' }} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <span
                                style={{
                                  backgroundColor: statusStyle.bg,
                                  color: statusStyle.color,
                                  border: statusStyle.border,
                                  padding: '2px 8px',
                                  borderRadius: '9999px',
                                  fontSize: '9.5px',
                                  fontWeight: '700',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                  flexShrink: 0,
                                }}
                              >
                                {statusStyle.label}
                              </span>
                            </div>

                            {/* Middle Row: Product Thumbnail + Details side-by-side */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                paddingTop: '8px',
                                paddingBottom: '8px',
                              }}
                            >
                              <div
                                style={{
                                  width: '52px',
                                  height: '52px',
                                  borderRadius: '10px',
                                  overflow: 'hidden',
                                  backgroundColor: '#FAF7F2',
                                  border: '1px solid #EDE7DD',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {orderItem.itemImage ? (
                                  <img
                                    src={orderItem.itemImage}
                                    alt={orderItem.itemName || 'Product'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <Package style={{ width: '22px', height: '22px', color: '#A88430' }} />
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: '#14120F',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                  title={orderItem.itemName}
                                >
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {orderItem.itemName || 'Ordered Item'}
                                  </span>
                                  {orderItem.itemsCount > 1 && (
                                    <span
                                      style={{
                                        fontSize: '9.5px',
                                        color: '#8C827A',
                                        backgroundColor: '#FAF7F2',
                                        border: '1px solid #EDE7DD',
                                        padding: '1px 5px',
                                        borderRadius: '4px',
                                        flexShrink: 0,
                                      }}
                                    >
                                      +{orderItem.itemsCount - 1}
                                    </span>
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '11px',
                                    color: '#5A524A',
                                    marginTop: '3px',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <span style={{ fontWeight: '700', color: '#14120F' }}>
                                    ₹{orderItem.totalAmount || 0}
                                  </span>
                                  <span>•</span>
                                  <span>{orderItem.paymentMethod || 'Online'}</span>
                                  {orderItem.orderDate && (
                                    <>
                                      <span>•</span>
                                      <span style={{ color: '#8C827A', fontSize: '10.5px' }}>
                                        {orderItem.orderDate.split(',')[0]}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Bottom Row: Single Compact Action Button */}
                            <div style={{ paddingTop: '2px' }}>
                              {orderItem.trackingUrl ? (
                                <a
                                  href={orderItem.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    backgroundColor: '#14120F',
                                    color: '#FAF7F2',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    boxSizing: 'border-box',
                                  }}
                                  className="hover:bg-black active:scale-95 transition-all"
                                >
                                  <Truck style={{ width: '12px', height: '12px' }} />
                                  <span>Track Live Shipment</span>
                                  <ExternalLink style={{ width: '10px', height: '10px' }} />
                                </a>
                              ) : (
                                <a
                                  href="/account/orders"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    backgroundColor: '#FAF7F2',
                                    color: '#14120F',
                                    border: '1px solid #DDD7CC',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    boxSizing: 'border-box',
                                  }}
                                  className="hover:border-[#D1A743] active:scale-95 transition-all"
                                >
                                  <span>View Order Details</span>
                                  <ExternalLink style={{ width: '10px', height: '10px' }} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Contact Support Card */}
                {msg.contactCard && (
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #DDD7CC',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                      marginTop: '10px',
                      width: '100%',
                      fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#6B6560',
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#10B981',
                          display: 'inline-block',
                        }}
                      />
                      <span>
                        Support Hours: <strong style={{ color: '#14120F' }}>{msg.contactCard.hours || '10:00 AM - 7:00 PM IST (Mon-Sat)'}</strong>
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: '#FAF7F2',
                        borderRadius: '12px',
                        border: '1px solid #ECE6DB',
                        marginBottom: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <Mail style={{ width: '16px', height: '16px', color: '#C49D40', flexShrink: 0 }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#14120F', wordBreak: 'break-all' }}>
                          {msg.contactCard.email || 'support.fabuniqo@gmail.com'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const emailToCopy = msg.contactCard.email || 'support.fabuniqo@gmail.com';
                          navigator.clipboard?.writeText(emailToCopy).catch(() => {});
                          setCopiedEmailId(msg.id || 'email');
                          setTimeout(() => setCopiedEmailId(null), 2000);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: copiedEmailId === (msg.id || 'email') ? '#10B981' : '#8C827A',
                          borderRadius: '6px',
                          transition: 'all 0.15s ease',
                        }}
                        title="Copy email address"
                      >
                        {copiedEmailId === (msg.id || 'email') ? (
                          <>
                            <Check style={{ width: '13px', height: '13px', color: '#10B981' }} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy style={{ width: '13px', height: '13px' }} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <a
                      href={`mailto:${msg.contactCard.email || 'support.fabuniqo@gmail.com'}?subject=FABUNIQO%20Customer%20Support%20Inquiry`}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '11px 16px',
                        backgroundColor: '#14120F',
                        color: '#FAF7F2',
                        fontSize: '13px',
                        fontWeight: '700',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        boxShadow: '0 3px 10px rgba(20, 18, 15, 0.2)',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                      }}
                      className="hover:bg-black active:scale-98"
                    >
                      <Mail style={{ width: '16px', height: '16px', color: '#D1A743' }} />
                      <span>Send Email to Support</span>
                    </a>
                  </div>
                )}
              </div>
            ))}

            {/* Elegant Luxury Typing Indicator */}
            {loading && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '8px 0',
                }}
              >
                {/* Mini Bot Avatar Badge */}
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    minWidth: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#14120F',
                    border: '1.5px solid #C49D40',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#D1A743',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                  }}
                >
                  <Sparkles style={{ width: '13px', height: '13px' }} />
                </div>

                {/* Animated Speech Bubble */}
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: '18px 18px 18px 4px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #DDD7CC',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#C49D40',
                      display: 'inline-block',
                      animation: 'fabTypingDot 1.4s infinite ease-in-out both',
                    }}
                  />
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#C49D40',
                      display: 'inline-block',
                      animation: 'fabTypingDot 1.4s infinite ease-in-out both',
                      animationDelay: '0.2s',
                    }}
                  />
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#C49D40',
                      display: 'inline-block',
                      animation: 'fabTypingDot 1.4s infinite ease-in-out both',
                      animationDelay: '0.4s',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#8C827A',
                      fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                      fontWeight: '500',
                      marginLeft: '6px',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Assistant is typing...
                  </span>
                </div>
              </div>
            )}

            {/* ── 3. QUICK-REPLY PILL CHIPS (Left-Aligned / Wrapping) ── */}
            {!loading && quickPills.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'flex-start',
                  padding: '6px 0 10px 0',
                }}
              >
                {quickPills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => handlePillClick(pill)}
                    style={{
                      cursor: 'pointer',
                      fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                      backgroundColor: pill.type === 'LOGIN' ? '#14120F' : '#FFFFFF',
                      borderColor: 'rgb(196, 157, 64)',
                      borderWidth: '1.5px',
                      borderStyle: 'solid',
                      color: pill.type === 'LOGIN' ? '#D1A743' : '#14120F',
                      padding: '8px 16px',
                      borderRadius: '9999px',
                      fontSize: '12px',
                      fontWeight: '600',
                      lineHeight: '1.4',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                    className={
                      pill.type === 'LOGIN'
                        ? 'hover:brightness-125 active:scale-95'
                        : 'hover:bg-[rgb(196,157,64)] hover:text-[#14120F] active:scale-95'
                    }
                  >
                    {pill.type === 'LOGIN' && <LogIn className="w-3.5 h-3.5 text-[#D1A743]" />}
                    <span>{pill.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── 4. TIDIO-STYLE FOOTER COMPOSER ── */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #DDD7CC',
              padding: '14px 16px 12px 16px',
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <form
              onSubmit={handleSendMessage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
              }}
            >
              <input
                ref={inputRef}
                type="text"
                disabled={loading}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={
                  loading
                    ? 'Assistant is replying...'
                    : !isAuthenticated
                    ? 'Please log in to query...'
                    : inputContext === 'ORDER_TRACK'
                    ? 'Enter Order ID (e.g. #1024)...'
                    : inputContext === 'DELIVERY_DISPUTE_CHECK'
                    ? 'Enter Order ID (e.g. #FAB-ECOMM-187286)...'
                    : inputContext === 'PINCODE_CHECK'
                    ? 'Enter 6-digit PIN code (e.g. 110001)...'
                    : inputContext === 'RETURN_CHECK'
                    ? 'Enter Order ID (e.g. #1024)...'
                    : inputContext === 'TICKET_MSG'
                    ? 'Enter your phone/message...'
                    : 'Enter your message...'
                }
                style={{
                  backgroundColor: loading ? '#F3EFEA' : '#FAF7F2',
                  border: isInputFocused ? '1.5px solid #C49D40' : '1.5px solid #DDD7CC',
                  boxShadow: isInputFocused ? '0 0 0 3px rgba(196, 157, 64, 0.2)' : 'none',
                  color: '#14120F',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                  fontWeight: '500',
                  lineHeight: '1.4',
                  borderRadius: '9999px',
                  outline: 'none',
                  flex: 1,
                  width: '100%',
                  boxSizing: 'border-box',
                  opacity: loading ? 0.75 : 1,
                  transition: 'all 0.18s ease',
                }}
                className="placeholder:text-[#8C827A]"
              />

              {/* Circular Send Action Button (Tidio style in brand gold) */}
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                style={{
                  cursor: inputText.trim() && !loading ? 'pointer' : 'not-allowed',
                  background: loading
                    ? 'linear-gradient(135deg, rgb(168, 132, 48) 0%, rgb(196, 157, 64) 100%)'
                    : inputText.trim()
                    ? 'linear-gradient(135deg, rgb(168, 132, 48) 0%, rgb(196, 157, 64) 100%)'
                    : '#EDE7DC',
                  color: inputText.trim() || loading ? '#14120F' : '#A89F91',
                  width: '42px',
                  height: '42px',
                  minWidth: '42px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: 'none',
                  outline: 'none',
                  boxShadow: (inputText.trim() || loading) ? '0 3px 10px rgba(168, 132, 48, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                className="hover:brightness-105 active:scale-95"
                title={loading ? 'Processing...' : 'Send message'}
              >
                {loading ? (
                  <Loader2 className="animate-spin" style={{ width: '16px', height: '16px', color: '#14120F' }} />
                ) : (
                  <Send
                    style={{
                      width: '16px',
                      height: '16px',
                      color: inputText.trim() ? '#14120F' : '#A89F91',
                      marginLeft: '-2px',
                    }}
                  />
                )}
              </button>
            </form>

            {/* Micro Branding & Quick Reset Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '10px',
                padding: '0 6px',
                fontSize: '11px',
                color: '#8C827A',
                fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'none',
                  border: 'none',
                  color: '#8C827A',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  fontSize: '11px',
                  fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                  fontWeight: '500',
                  transition: 'color 0.15s ease',
                }}
                className="hover:text-[#14120F]"
                title="Start from beginning"
              >
                <RotateCw style={{ width: '12px', height: '12px', color: '#D1A743' }} />
                <span>Restart</span>
              </button>

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>Powered by</span>
                <strong style={{ color: '#14120F', fontWeight: '700', letterSpacing: '0.03em' }}>
                  FABUNIQO
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
