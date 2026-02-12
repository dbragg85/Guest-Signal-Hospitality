'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [showMessage, setShowMessage] = useState(false)
  const [messageType, setMessageType] = useState('success')
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const name = e.target.name.value
    const email = e.target.email.value
    const phone = e.target.phone.value
    const message = e.target.message.value
    
    const subject = encodeURIComponent('Guest Intelligence Audit Request - ' + name)
    const body = encodeURIComponent(
      'Restaurant Name: ' + name + '\n\n' +
      'Email: ' + email + '\n\n' +
      'Phone: ' + (phone || 'Not provided') + '\n\n' +
      'Restaurant Details:\n' + (message || 'No additional details provided')
    )
    
    const mailtoLink = 'mailto:david@guestsignalhospitality.com?subject=' + subject + '&body=' + body
    
    window.location.href = mailtoLink
    
    setMessage('Thank you! Your email client should open. If it doesn\'t, please email us directly at david@guestsignalhospitality.com')
    setMessageType('success')
    setShowMessage(true)
    
    setTimeout(() => {
      e.target.reset()
      setShowMessage(false)
    }, 1000)
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Restaurant Name</label>
        <input type="text" id="name" name="name" required />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input type="email" id="email" name="email" required />
      </div>
      <div className="form-group">
        <label htmlFor="phone">Phone Number</label>
        <input type="tel" id="phone" name="phone" />
      </div>
      <div className="form-group">
        <label htmlFor="message">Tell us about your restaurant</label>
        <textarea id="message" name="message" rows="4" placeholder="Location, current rating, number of reviews, etc."></textarea>
      </div>
      <button type="submit" className="btn btn-primary btn-large">Request Your Audit</button>
      {showMessage && (
        <div className={`form-message form-message-${messageType}`} style={{
          padding: '16px 20px',
          borderRadius: '10px',
          marginTop: '20px',
          fontWeight: '500',
          textAlign: 'center',
          background: messageType === 'success' ? 'rgba(0, 180, 216, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: messageType === 'success' ? '#00b4d8' : '#ef4444',
          border: `1px solid ${messageType === 'success' ? '#00b4d8' : '#ef4444'}`,
        }}>
          {message}
        </div>
      )}
      <p className="form-note">We'll respond within 24 hours to discuss your Guest Intelligence Audit.</p>
    </form>
  )
}

