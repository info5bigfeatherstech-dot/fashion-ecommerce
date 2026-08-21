import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import { Input, InputGroup } from '@/components/ui/Input'
import { OtpInput } from '@/components/ui/OtpInput'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  getSecurityQuestions,
  register as registerUser,
  verifyRegistrationOtp,
  login,
  forgotPasswordFindUser,
  forgotPasswordVerifyAnswers,
  forgotPasswordVerifyOtpFallback,
  forgotPasswordResetDirect,
} from '@/features/auth/api'

const loginSchema = z.object({
  identifier: z.string().min(3, 'Email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Valid email required'),
    phone: z
      .string()
      .transform((v) => v.replace(/\D/g, ''))
      .refine((v) => v.length === 10, 'Enter a 10-digit phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
    questionId: z.string().min(1, 'Select a security question'),
    securityAnswer: z.string().min(2, 'Security answer is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

const forgotFindSchema = z.object({
  identifier: z.string().min(3, 'Email or phone is required'),
})

const forgotAnswerSchema = z.object({
  answer: z.string().min(1, 'Answer is required'),
})

const forgotResetSchema = z
  .object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.message || error?.details?.message || fallback
}

export function AuthForms({
  mode = 'login',
  onModeChange,
  onAuthenticated,
  error,
  setError,
}) {
  const [view, setView] = useState(mode === 'register' ? 'register' : 'login')
  const [otp, setOtp] = useState('')
  const [pendingIdentifier, setPendingIdentifier] = useState('')
  const [challengeToken, setChallengeToken] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [securityQuestion, setSecurityQuestion] = useState(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState(null)
  const [emailHint, setEmailHint] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  })
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      questionId: '',
      securityAnswer: '',
    },
  })
  const forgotFindForm = useForm({
    resolver: zodResolver(forgotFindSchema),
    defaultValues: { identifier: '' },
  })
  const forgotAnswerForm = useForm({
    resolver: zodResolver(forgotAnswerSchema),
    defaultValues: { answer: '' },
  })
  const forgotResetForm = useForm({
    resolver: zodResolver(forgotResetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const { data: securityQuestions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['auth', 'security-questions'],
    queryFn: getSecurityQuestions,
    staleTime: 1000 * 60 * 30,
    enabled: view === 'register',
  })

  useEffect(() => {
    setView(mode === 'register' ? 'register' : 'login')
    setError('')
    setInfoMessage('')
    setOtp('')
  }, [mode, setError])

  const switchTo = (nextMode, nextView = nextMode) => {
    setError('')
    setInfoMessage('')
    setOtp('')
    setView(nextView)
    onModeChange?.(nextMode === 'register' ? 'register' : 'login')
  }

  const handleLogin = async (data) => {
    try {
      setSubmitting(true)
      setError('')
      const result = await login({
        identifier: data.identifier.trim(),
        password: data.password,
      })
      onAuthenticated?.(result)
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email/phone or password'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (data) => {
    try {
      setSubmitting(true)
      setError('')
      const result = await registerUser({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword,
        securityAnswers: [
          {
            questionId: data.questionId,
            answer: data.securityAnswer.trim(),
          },
        ],
      })
      setPendingIdentifier(result.identifier)
      setInfoMessage(result.message)
      setView('register-otp')
      onModeChange?.('register')
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyRegisterOtp = async (event) => {
    event.preventDefault()
    if (otp.length < 6) {
      setError('Enter the 6-digit OTP sent to your email')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      const result = await verifyRegistrationOtp({
        identifier: pendingIdentifier,
        otp,
      })
      onAuthenticated?.(result)
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid or expired OTP'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotFind = async (data) => {
    try {
      setSubmitting(true)
      setError('')
      const result = await forgotPasswordFindUser({
        identifier: data.identifier.trim(),
      })
      setChallengeToken(result.challengeToken)
      setSecurityQuestion(result.question)
      setAttemptsRemaining(result.maxAttempts)
      setPendingIdentifier(data.identifier.trim())
      setInfoMessage(result.message)
      setView('forgot-answer')
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to start password reset'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotAnswer = async (data) => {
    try {
      setSubmitting(true)
      setError('')
      const result = await forgotPasswordVerifyAnswers({
        challengeToken,
        answers: [
          {
            questionId: securityQuestion?.id,
            answer: data.answer.trim(),
          },
        ],
      })

      if (result.requiresOtpFallback) {
        setChallengeToken(result.challengeToken)
        setEmailHint(result.emailHint || '')
        setAttemptsRemaining(0)
        setInfoMessage(result.message)
        setOtp('')
        setView('forgot-otp')
        return
      }

      if (result.resetToken) {
        setResetToken(result.resetToken)
        setInfoMessage(result.message)
        setView('forgot-reset')
        return
      }

      setError(result.message || 'Could not verify security answer')
    } catch (err) {
      const remaining = err?.details?.attemptsRemaining
      if (typeof remaining === 'number') setAttemptsRemaining(remaining)
      setError(getErrorMessage(err, 'Incorrect answer'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotOtp = async (event) => {
    event.preventDefault()
    if (otp.length < 6) {
      setError('Enter the 6-digit OTP sent to your email')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      const result = await forgotPasswordVerifyOtpFallback({
        challengeToken,
        otp,
      })
      setResetToken(result.resetToken)
      setInfoMessage(result.message)
      setView('forgot-reset')
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid OTP'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgotReset = async (data) => {
    try {
      setSubmitting(true)
      setError('')
      const result = await forgotPasswordResetDirect({
        resetToken,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
      setInfoMessage(result.message)
      loginForm.reset({
        identifier: pendingIdentifier || result.phone || '',
        password: '',
      })
      setView('login')
      onModeChange?.('login')
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to reset password'))
    } finally {
      setSubmitting(false)
    }
  }

  const alertBlock = (
    <>
      {error ? (
        <p className="text-error body-sm" style={{ marginBottom: 'var(--space-3)' }} role="alert">
          {error}
        </p>
      ) : null}
      {infoMessage && !error ? (
        <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-3)' }} role="status">
          {infoMessage}
        </p>
      ) : null}
    </>
  )

  if (view === 'register-otp') {
    return (
      <div className="auth-flow">
        <h3 className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>Verify your email</h3>
        <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
          Enter the OTP sent to <strong>{pendingIdentifier}</strong>
        </p>
        {alertBlock}
        <form onSubmit={handleVerifyRegisterOtp} className="form-grid" style={{ gap: 'var(--space-3)' }}>
          <OtpInput value={otp} onChange={setOtp} maxLength={6} />
          <Button type="submit" variant="accent" fullWidth disabled={submitting || otp.length < 6}>
            {submitting ? 'Verifying…' : 'Verify & continue'}
          </Button>
          <button type="button" className="section-header__link" onClick={() => switchTo('register', 'register')}>
            Back to registration
          </button>
        </form>
      </div>
    )
  }

  if (view === 'forgot-find') {
    return (
      <div className="auth-flow">
        <h3 className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>Forgot password</h3>
        <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
          Enter your registered email or 10-digit phone number.
        </p>
        {alertBlock}
        <form onSubmit={forgotFindForm.handleSubmit(handleForgotFind)} className="form-grid" style={{ gap: 'var(--space-3)' }}>
          <InputGroup label="Email or phone" htmlFor="forgot-id" error={forgotFindForm.formState.errors.identifier?.message}>
            <Input
              id="forgot-id"
              placeholder="you@example.com or 9876543210"
              error={forgotFindForm.formState.errors.identifier}
              {...forgotFindForm.register('identifier')}
            />
          </InputGroup>
          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Checking…' : 'Continue'}
          </Button>
          <button type="button" className="section-header__link" onClick={() => switchTo('login', 'login')}>
            Back to sign in
          </button>
        </form>
      </div>
    )
  }

  if (view === 'forgot-answer') {
    return (
      <div className="auth-flow">
        <h3 className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>Security question</h3>
        <p className="body-sm" style={{ marginBottom: 'var(--space-3)' }}>
          {securityQuestion?.text || 'Answer your security question to continue.'}
        </p>
        {typeof attemptsRemaining === 'number' ? (
          <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-2)' }}>
            Attempts remaining: {attemptsRemaining}
          </p>
        ) : null}
        {alertBlock}
        <form onSubmit={forgotAnswerForm.handleSubmit(handleForgotAnswer)} className="form-grid" style={{ gap: 'var(--space-3)' }}>
          <InputGroup label="Your answer" htmlFor="forgot-answer" error={forgotAnswerForm.formState.errors.answer?.message}>
            <Input
              id="forgot-answer"
              placeholder="Enter your answer"
              error={forgotAnswerForm.formState.errors.answer}
              {...forgotAnswerForm.register('answer')}
            />
          </InputGroup>
          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify answer'}
          </Button>
          <button type="button" className="section-header__link" onClick={() => switchTo('login', 'login')}>
            Cancel
          </button>
        </form>
      </div>
    )
  }

  if (view === 'forgot-otp') {
    return (
      <div className="auth-flow">
        <h3 className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>Email OTP</h3>
        <p className="body-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
          Enter the OTP sent to {emailHint || 'your registered email'}.
        </p>
        {alertBlock}
        <form onSubmit={handleForgotOtp} className="form-grid" style={{ gap: 'var(--space-3)' }}>
          <OtpInput value={otp} onChange={setOtp} maxLength={6} />
          <Button type="submit" variant="primary" fullWidth disabled={submitting || otp.length < 6}>
            {submitting ? 'Verifying…' : 'Verify OTP'}
          </Button>
          <button type="button" className="section-header__link" onClick={() => switchTo('login', 'login')}>
            Cancel
          </button>
        </form>
      </div>
    )
  }

  if (view === 'forgot-reset') {
    return (
      <div className="auth-flow">
        <h3 className="heading-sm" style={{ marginBottom: 'var(--space-2)' }}>Set new password</h3>
        {alertBlock}
        <form onSubmit={forgotResetForm.handleSubmit(handleForgotReset)} className="form-grid" style={{ gap: 'var(--space-3)' }}>
          <InputGroup label="New password" htmlFor="forgot-new-pass" error={forgotResetForm.formState.errors.newPassword?.message}>
            <Input
              id="forgot-new-pass"
              type="password"
              placeholder="New password"
              error={forgotResetForm.formState.errors.newPassword}
              {...forgotResetForm.register('newPassword')}
            />
          </InputGroup>
          <InputGroup
            label="Confirm password"
            htmlFor="forgot-confirm-pass"
            error={forgotResetForm.formState.errors.confirmPassword?.message}
          >
            <Input
              id="forgot-confirm-pass"
              type="password"
              placeholder="Confirm password"
              error={forgotResetForm.formState.errors.confirmPassword}
              {...forgotResetForm.register('confirmPassword')}
            />
          </InputGroup>
          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Saving…' : 'Reset password'}
          </Button>
        </form>
      </div>
    )
  }

  if (view === 'register') {
    return (
      <div className="auth-modal__register-form">
        {alertBlock}
        <form onSubmit={registerForm.handleSubmit(handleRegister)} noValidate>
          <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
            <div className="form-grid form-grid--2">
              <InputGroup label="Full Name" htmlFor="reg-name" error={registerForm.formState.errors.name?.message}>
                <Input
                  id="reg-name"
                  placeholder="Ali Khan"
                  error={registerForm.formState.errors.name}
                  {...registerForm.register('name')}
                />
              </InputGroup>
              <InputGroup label="Phone Number" htmlFor="reg-phone" error={registerForm.formState.errors.phone?.message}>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="9876543210"
                  error={registerForm.formState.errors.phone}
                  {...registerForm.register('phone')}
                />
              </InputGroup>
            </div>

            <InputGroup label="Email" htmlFor="reg-email" error={registerForm.formState.errors.email?.message}>
              <Input
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                error={registerForm.formState.errors.email}
                {...registerForm.register('email')}
              />
            </InputGroup>

            <div className="form-grid form-grid--2">
              <InputGroup label="Password" htmlFor="reg-password" error={registerForm.formState.errors.password?.message}>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Create a password"
                  error={registerForm.formState.errors.password}
                  {...registerForm.register('password')}
                />
              </InputGroup>
              <InputGroup
                label="Confirm Password"
                htmlFor="reg-confirm-password"
                error={registerForm.formState.errors.confirmPassword?.message}
              >
                <Input
                  id="reg-confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  error={registerForm.formState.errors.confirmPassword}
                  {...registerForm.register('confirmPassword')}
                />
              </InputGroup>
            </div>

            <InputGroup
              label="Security question"
              htmlFor="reg-question"
              error={registerForm.formState.errors.questionId?.message}
            >
              <Controller
                control={registerForm.control}
                name="questionId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={questionsLoading || !securityQuestions.length}
                  >
                    <SelectTrigger id="reg-question" className="select-trigger--full">
                      <SelectValue placeholder={questionsLoading ? 'Loading questions…' : 'Select a question'} />
                    </SelectTrigger>
                    <SelectContent>
                      {securityQuestions.map((question) => (
                        <SelectItem key={question.id} value={question.id}>
                          {question.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </InputGroup>

            <InputGroup
              label="Security answer"
              htmlFor="reg-answer"
              error={registerForm.formState.errors.securityAnswer?.message}
            >
              <Input
                id="reg-answer"
                placeholder="Your answer"
                error={registerForm.formState.errors.securityAnswer}
                {...registerForm.register('securityAnswer')}
              />
            </InputGroup>

            <Button type="submit" variant="accent" fullWidth disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create Account'}
            </Button>

            <p className="body-sm text-muted" style={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <button className="section-header__link" type="button" onClick={() => switchTo('login', 'login')}>
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="auth-modal__form">
      {alertBlock}
      <form onSubmit={loginForm.handleSubmit(handleLogin)} noValidate>
        <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
          <InputGroup label="Email or phone" htmlFor="login-identifier" error={loginForm.formState.errors.identifier?.message}>
            <Input
              id="login-identifier"
              placeholder="you@example.com or 9876543210"
              error={loginForm.formState.errors.identifier}
              {...loginForm.register('identifier')}
            />
          </InputGroup>
          <InputGroup label="Password" htmlFor="login-password" error={loginForm.formState.errors.password?.message}>
            <Input
              id="login-password"
              type="password"
              placeholder="Your password"
              error={loginForm.formState.errors.password}
              {...loginForm.register('password')}
            />
          </InputGroup>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="section-header__link body-sm"
              onClick={() => {
                setError('')
                setInfoMessage('')
                setView('forgot-find')
              }}
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </div>

        <p className="body-sm text-muted" style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
          <button className="section-header__link" type="button" onClick={() => switchTo('register', 'register')}>
            Create an account
          </button>
        </p>
      </form>
    </div>
  )
}
