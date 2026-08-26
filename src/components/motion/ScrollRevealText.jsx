import { Children, isValidElement, cloneElement } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { TextAnimate } from '@/components/ui/text-animate'

const SLOW_TEXT = {
  animation: 'slideRight',
  by: 'word',
  duration: 1.65,
  delay: 0.12,
  once: true,
  startOnView: true,
}

function isPlainText(children) {
  return Children.toArray(children).every(
    (child) => typeof child === 'string' || typeof child === 'number'
  )
}

function extractPlainText(children) {
  let text = ''
  Children.forEach(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') text += child
    else if (isValidElement(child)) text += extractPlainText(child.props.children)
  })
  return text
}

function animateNodes(children) {
  return Children.map(children, (child, index) => {
    if (child == null || typeof child === 'boolean') return child

    if (typeof child === 'string' || typeof child === 'number') {
      const text = String(child)
      if (!text) return null
      if (/^\s+$/.test(text)) return text
      return (
        <TextAnimate
          key={`ta-${index}`}
          as="span"
          className="text-animate-inline"
          {...SLOW_TEXT}
        >
          {text}
        </TextAnimate>
      )
    }

    if (isValidElement(child)) {
      return cloneElement(
        child,
        { key: child.key ?? `wrap-${index}` },
        animateNodes(child.props.children)
      )
    }

    return child
  })
}

/**
 * Home headings use Magic UI TextAnimate — words slide in slowly from the left.
 */
export function ScrollRevealText({
  as: Tag = 'h2',
  className,
  style,
  children,
}) {
  if (isPlainText(children)) {
    return (
      <TextAnimate as={Tag} className={className} style={style} {...SLOW_TEXT}>
        {extractPlainText(children)}
      </TextAnimate>
    )
  }

  return (
    <Tag className={className} style={style}>
      {animateNodes(children)}
    </Tag>
  )
}

const easeOut = [0.22, 1, 0.36, 1]

export function Reveal({
  className,
  children,
  delay = 0,
  y = 28,
  x = 0,
  once = true,
  amount = 0.2,
  ...rest
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y, x }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, x: 0 }}
      viewport={{ once, amount, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 1.05, ease: easeOut, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

export function ImageReveal({
  className,
  children,
  once = true,
  amount = 0.25,
  duration = 1.35,
}) {
  const reduceMotion = useReducedMotion()

  if (reduceMotion) {
    return <div className={`image-reveal ${className || ''}`.trim()}>{children}</div>
  }

  return (
    <motion.div
      className={`image-reveal ${className || ''}`.trim()}
      initial={{ xPercent: -100 }}
      whileInView={{ xPercent: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, ease: easeOut }}
    >
      <motion.div
        className="image-reveal__inner"
        initial={{ xPercent: 100 }}
        whileInView={{ xPercent: 0 }}
        viewport={{ once, amount }}
        transition={{ duration, ease: easeOut }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
