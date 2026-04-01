'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Navigation() {
  useEffect(() => {
    // Smooth scrolling for navigation links
    const handleAnchorClick = (e) => {
      const href = e.currentTarget.getAttribute('href')
      if (href && href.startsWith('#')) {
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) {
          const offsetTop = target.offsetTop - 80
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          })
        }
      }
    }

    const anchors = document.querySelectorAll('a[href^="#"]')
    anchors.forEach(anchor => {
      anchor.addEventListener('click', handleAnchorClick)
    })

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar')
    const handleScroll = () => {
      const currentScroll = window.pageYOffset
      if (currentScroll > 100) {
        navbar.style.background = 'rgba(26, 35, 50, 0.98)'
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.2)'
      } else {
        navbar.style.background = 'rgba(26, 35, 50, 0.95)'
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)'
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      anchors.forEach(anchor => {
        anchor.removeEventListener('click', handleAnchorClick)
      })
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleGetStarted = (e) => {
    e.preventDefault()
    const contactSection = document.querySelector('#contact')
    if (contactSection) {
      const offsetTop = contactSection.offsetTop - 80
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      })
    }
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link href="/" className="logo-container" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/logo.png" alt="Guest Signal Hospitality Logo" className="logo" />
            <div className="logo-text">
              <span className="logo-main">GUEST SIGNAL</span>
              <span className="logo-sub">HOSPITALITY</span>
            </div>
          </Link>
          <ul className="nav-links">
            <li><a href="#services">Services</a></li>
            <li><a href="#audit">Audit</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><Link href="/newsletter">Newsletter</Link></li>
            <li><Link href="/about">About</Link></li>
          </ul>
          <button className="cta-button-nav" onClick={handleGetStarted}>Get Started</button>
        </div>
      </div>
    </nav>
  )
}
