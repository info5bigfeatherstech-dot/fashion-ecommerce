import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  RotateCcw,
  Send,
  Phone,
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

function formatInlineText(text) {
  if (!text || typeof text !== 'string') return text;
  if (!text.includes('**')) return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ fontWeight: '700', color: 'inherit' }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderLineContent(line) {
  // Bold point headings (e.g. "• Online Payments: Refund..." or "1. Cash on Delivery (COD): Available...")
  const pointMatch = line.match(/^((?:\d+[.)]|[•\-*])\s+)([^:\n]{2,50}):\s*(.*)$/);
  if (pointMatch) {
    const [, bullet, pointTitle, rest] = pointMatch;
    const cleanTitle = pointTitle.replace(/\*\*/g, '').trim();
    return (
      <>
        <span>{bullet}</span>
        <strong style={{ fontWeight: '700', color: 'inherit' }}>{cleanTitle}:</strong>
        {rest ? ' ' : ''}
        {formatInlineText(rest)}
      </>
    );
  }
  return formatInlineText(line);
}

export function ChatWidget() {
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

      // C. Support ticket
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

    // 1. Order tracking flow: either active tracking context, or order-like query
    const cleanId = query.replace(/[#\s]/g, '');
    const isOrderPattern =
      /^\d{4,12}$/i.test(cleanId) ||
      /^(?:FAB|ECOMM|ORD|ORDER)[-_]?\w+/i.test(cleanId) ||
      /\b(?:track|status|order)\b.*[#\d]/i.test(query);

    if (inputContext === 'ORDER_TRACK' || isOrderPattern) {
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
          // Keep inputContext as ORDER_TRACK so user can immediately retry or provide phone
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

    // 2. Ticket / custom inquiry
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
            text: 'Could not send ticket. You can reach us directly on WhatsApp.',
          },
        ]);
      } finally {
        setLoading(false);
        showRootPills();
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
                          {renderLineContent(trimmed)}
                        </div>
                      );
                    })}
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

                {/* ── LUXURY COUPON CARDS ── */}
                {msg.type === 'COUPONS' && msg.coupons && (
                  <div
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {msg.coupons.map((coupon) => {
                      const isCopied = copiedCoupon === coupon.code;
                      return (
                        <div
                          key={coupon.id || coupon.code}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1.5px dashed #D1A743',
                            borderRadius: '16px',
                            padding: '14px 16px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              marginBottom: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(209, 167, 67, 0.12)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#A88430',
                                }}
                              >
                                <Tag style={{ width: '14px', height: '14px' }} />
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '700', color: '#14120F' }}>
                                {coupon.name}
                              </span>
                            </div>
                            <span
                              style={{
                                backgroundColor: '#FAF7F2',
                                color: '#A88430',
                                border: '1px solid rgba(209, 167, 67, 0.3)',
                                padding: '3px 9px',
                                borderRadius: '9999px',
                                fontSize: '11px',
                                fontWeight: '800',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                              }}
                            >
                              {coupon.discountLabel}
                            </span>
                          </div>

                          {coupon.description && (
                            <p
                              style={{
                                margin: '0 0 10px 0',
                                fontSize: '11px',
                                color: '#635B54',
                                lineHeight: '1.4',
                              }}
                            >
                              {coupon.description}
                            </p>
                          )}

                          <div
                            style={{
                              backgroundColor: '#FAF7F2',
                              border: '1px solid #EDE7DD',
                              borderRadius: '10px',
                              padding: '8px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: '9.5px',
                                  color: '#8C827A',
                                  textTransform: 'uppercase',
                                  fontWeight: '700',
                                  letterSpacing: '0.05em',
                                  display: 'block',
                                }}
                              >
                                Promo Code
                              </span>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '14px',
                                  fontWeight: '800',
                                  color: '#14120F',
                                  letterSpacing: '0.08em',
                                }}
                              >
                                {coupon.code}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyCoupon(coupon.code)}
                              style={{
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                backgroundColor: isCopied ? '#EAF8F1' : '#14120F',
                                color: isCopied ? '#0A7A48' : '#FAF7F2',
                                border: isCopied ? '1px solid #B7E8CE' : 'none',
                                fontSize: '11px',
                                fontWeight: '700',
                                transition: 'all 0.15s ease',
                              }}
                              className="active:scale-95 hover:opacity-90"
                              title={isCopied ? 'Copied code!' : 'Copy promo code'}
                            >
                              {isCopied ? (
                                <>
                                  <Check style={{ width: '12px', height: '12px', color: '#0A7A48' }} />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy style={{ width: '12px', height: '12px' }} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div
                            style={{
                              marginTop: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '10.5px',
                              color: '#8C827A',
                              padding: '0 2px',
                            }}
                          >
                            <span>
                              {coupon.minOrderValue > 0
                                ? `Min order: ₹${coupon.minOrderValue}`
                                : 'No minimum order'}
                            </span>
                            <span>{coupon.expiryDate ? `Valid till: ${coupon.expiryDate}` : 'No expiry'}</span>
                          </div>

                          <div style={{ marginTop: '10px' }}>
                            <a
                              href="/checkout"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                backgroundColor: '#FAF7F2',
                                border: '1px solid #DDD7CC',
                                borderRadius: '8px',
                                color: '#14120F',
                                fontSize: '11.5px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                transition: 'all 0.15s ease',
                              }}
                              className="hover:border-[#D1A743] hover:bg-[#FFFFFF] active:scale-95"
                            >
                              <span>Apply at Checkout</span>
                              <ExternalLink style={{ width: '11px', height: '11px' }} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── LUXURY ORDER TRACKING RESULT CARDS ── */}
                {msg.type === 'ORDER_RESULT' && (msg.orders || msg.order) && (() => {
                  const ordersList = msg.orders && msg.orders.length > 0 ? msg.orders : [msg.order];
                  return (
                    <div
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
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
                              border: '1.5px solid #DDD7CC',
                              borderRadius: '16px',
                              padding: '16px',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                              fontFamily: "var(--font-ui, 'Montserrat', sans-serif)",
                              boxSizing: 'border-box',
                              width: '100%',
                            }}
                          >
                            {/* Top Header: ID + Copy Icon + Status Pill */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: '8px',
                                paddingBottom: '12px',
                                borderBottom: '1px solid #EBE5DA',
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span
                                    style={{
                                      fontFamily: "var(--font-serif, 'Playfair Display', Georgia, serif)",
                                      fontSize: '15px',
                                      fontWeight: '700',
                                      color: '#14120F',
                                      letterSpacing: '0.02em',
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
                                      justifyContent: 'center',
                                      background: isCopied ? '#EAF8F1' : '#FAF7F2',
                                      border: isCopied ? '1px solid #B7E8CE' : '1px solid #EDE7DD',
                                      borderRadius: '6px',
                                      padding: '3px 6px',
                                      cursor: 'pointer',
                                      color: isCopied ? '#059669' : '#8C827A',
                                      fontSize: '11px',
                                      fontWeight: '600',
                                      gap: '4px',
                                      transition: 'all 0.15s ease',
                                    }}
                                    className="hover:text-[#14120F] hover:border-[#D1A743] active:scale-95"
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check style={{ width: '12px', height: '12px', color: '#059669' }} />
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
                                {orderItem.orderDate && (
                                  <div
                                    style={{
                                      fontSize: '11px',
                                      color: '#8C827A',
                                      marginTop: '3px',
                                    }}
                                  >
                                    {orderItem.orderDate}
                                  </div>
                                )}
                              </div>

                              {/* Status Badge */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                <span
                                  style={{
                                    backgroundColor: statusStyle.bg,
                                    color: statusStyle.color,
                                    border: statusStyle.border,
                                    padding: '3px 9px',
                                    borderRadius: '9999px',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    lineHeight: '1.3',
                                    flexShrink: 0,
                                  }}
                                >
                                  {statusStyle.label}
                                </span>
                              </div>
                            </div>

                            {/* Item Highlight (if available) */}
                            {orderItem.itemName && (
                              <div
                                style={{
                                  marginTop: '10px',
                                  backgroundColor: '#FAF7F2',
                                  border: '1px solid #EDE7DD',
                                  borderRadius: '10px',
                                  padding: '8px 10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '8px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <Package style={{ width: '15px', height: '15px', color: '#A88430', flexShrink: 0 }} />
                                  <span
                                    style={{
                                      fontSize: '11.5px',
                                      fontWeight: '600',
                                      color: '#14120F',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                    title={orderItem.itemName}
                                  >
                                    {orderItem.itemName}
                                  </span>
                                </div>
                                {orderItem.itemsCount > 1 && (
                                  <span
                                    style={{
                                      fontSize: '10.5px',
                                      color: '#8C827A',
                                      fontWeight: '600',
                                      backgroundColor: '#FFFFFF',
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      border: '1px solid #EDE7DD',
                                      flexShrink: 0,
                                    }}
                                  >
                                    +{orderItem.itemsCount - 1} more
                                  </span>
                                )}
                              </div>
                            )}

                            {/* 4-Column Financial Breakdown matching Web UI */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                                gap: '6px',
                                marginTop: '10px',
                                padding: '8px 10px',
                                backgroundColor: '#FAF7F2',
                                border: '1px solid #EDE7DD',
                                borderRadius: '10px',
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '9.5px', fontWeight: '600', color: '#8C827A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Subtotal
                                </div>
                                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#14120F', marginTop: '2px' }}>
                                  ₹{orderItem.subtotal != null ? orderItem.subtotal : orderItem.totalAmount || 0}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '9.5px', fontWeight: '600', color: '#8C827A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Delivery
                                </div>
                                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#14120F', marginTop: '2px' }}>
                                  ₹{orderItem.deliveryCharges || 0}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '9.5px', fontWeight: '600', color: '#8C827A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Tax
                                </div>
                                <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#14120F', marginTop: '2px' }}>
                                  ₹{orderItem.tax || 0}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: '9.5px', fontWeight: '700', color: '#A88430', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Total
                                </div>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: '#14120F', marginTop: '2px' }}>
                                  ₹{orderItem.totalAmount || 0}
                                </div>
                              </div>
                            </div>

                            {/* Payment & Delivery Info Grid */}
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: '6px',
                                marginTop: '8px',
                              }}
                            >
                              <div style={{ backgroundColor: '#FAF7F2', border: '1px solid #EDE7DD', borderRadius: '8px', padding: '6px 8px' }}>
                                <span style={{ fontSize: '9.5px', color: '#8C827A', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Payment Method</span>
                                <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#14120F' }}>
                                  {orderItem.paymentMethod || 'ONLINE'} {orderItem.amountPaid != null ? `(Paid ₹${orderItem.amountPaid})` : ''}
                                </span>
                              </div>
                              <div style={{ backgroundColor: '#FAF7F2', border: '1px solid #EDE7DD', borderRadius: '8px', padding: '6px 8px' }}>
                                <span style={{ fontSize: '9.5px', color: '#8C827A', textTransform: 'uppercase', fontWeight: '600', display: 'block' }}>Courier / City</span>
                                <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#14120F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }} title={`${orderItem.courier || 'Shadowfax Surface'} - ${orderItem.customerCity || 'India'}`}>
                                  {orderItem.courier || 'Shadowfax'} {orderItem.customerCity ? `· ${orderItem.customerCity}` : ''}
                                </span>
                              </div>
                            </div>

                            {/* Tracking Number / AWB if present */}
                            {orderItem.trackingNumber && (
                              <div
                                style={{
                                  marginTop: '8px',
                                  padding: '6px 10px',
                                  backgroundColor: '#FAF7F2',
                                  border: '1px solid #EDE7DD',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span style={{ fontWeight: '600', color: '#8C827A' }}>AWB / Tracking:</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#14120F' }}>
                                  {orderItem.trackingNumber}
                                </span>
                              </div>
                            )}

                            {/* Action Buttons: Carrier tracking link or View Orders */}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              {orderItem.trackingUrl ? (
                                <a
                                  href={orderItem.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    backgroundColor: '#14120F',
                                    color: '#FAF7F2',
                                    borderRadius: '8px',
                                    fontSize: '11.5px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                    transition: 'all 0.15s ease',
                                  }}
                                  className="hover:bg-black hover:scale-[1.01] active:scale-[0.99]"
                                >
                                  <Truck style={{ width: '13px', height: '13px' }} />
                                  <span>Track Shipment</span>
                                  <ExternalLink style={{ width: '11px', height: '11px' }} />
                                </a>
                              ) : null}
                              <a
                                href="/account/orders"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  padding: '8px 12px',
                                  backgroundColor: orderItem.trackingUrl ? '#FAF7F2' : '#14120F',
                                  color: orderItem.trackingUrl ? '#14120F' : '#FAF7F2',
                                  border: orderItem.trackingUrl ? '1px solid #DDD7CC' : 'none',
                                  borderRadius: '8px',
                                  fontSize: '11.5px',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                  transition: 'all 0.15s ease',
                                }}
                                className="hover:scale-[1.01] active:scale-[0.99]"
                              >
                                <span>Track on Store</span>
                                <ExternalLink style={{ width: '11px', height: '11px' }} />
                              </a>
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
                        Concierge Hours: <strong style={{ color: '#14120F' }}>{msg.contactCard.hours}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`https://wa.me/91${msg.contactCard.whatsapp}?text=Hi%20FABUNIQO%20Support`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 14px',
                          backgroundColor: '#25D366',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          fontWeight: '700',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(37, 211, 102, 0.25)',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                        className="hover:brightness-105 active:scale-95"
                      >
                        <MessageCircle style={{ width: '15px', height: '15px' }} />
                        <span>WhatsApp</span>
                      </a>
                      <a
                        href={`tel:${msg.contactCard.phone}`}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 14px',
                          backgroundColor: '#14120F',
                          color: '#FAF7F2',
                          fontSize: '12px',
                          fontWeight: '700',
                          borderRadius: '10px',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease',
                          cursor: 'pointer',
                        }}
                        className="hover:bg-black active:scale-95"
                      >
                        <Phone style={{ width: '15px', height: '15px', color: '#D1A743' }} />
                        <span>Call Support</span>
                      </a>
                    </div>
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
