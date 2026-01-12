'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/components/Toast'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })

// Quill modules configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link'],
    ['clean']
  ]
}

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet',
  'align',
  'link'
]

interface OutreachTarget {
  id: string
  email: string
  business_name: string
  city: string
  state: string
  trade_type: string
  phone: string
  website: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  created_at: string
}

export default function ComposeEmailPage() {
  const { showToast } = useToast()

  // Form state
  const [recipients, setRecipients] = useState<string[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  // Recipients selection
  const [showRecipientSearch, setShowRecipientSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableTargets, setAvailableTargets] = useState<OutreachTarget[]>([])
  const [selectedTargets, setSelectedTargets] = useState<OutreachTarget[]>([])

  // Templates
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')

  useEffect(() => {
    fetchTargets()
    fetchTemplates()
  }, [])

  async function fetchTargets() {
    const { data } = await supabase
      .from('outreach_targets')
      .select('*')
      .eq('email_found', true)
      .not('email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)

    setAvailableTargets(data || [])
  }

  async function fetchTemplates() {
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })

    setTemplates(data || [])
  }

  function toggleRecipient(target: OutreachTarget) {
    const isSelected = selectedTargets.some(t => t.id === target.id)

    if (isSelected) {
      setSelectedTargets(selectedTargets.filter(t => t.id !== target.id))
    } else {
      setSelectedTargets([...selectedTargets, target])
    }
  }

  function loadTemplate(template: EmailTemplate) {
    setSubject(template.subject)
    setBody(template.body)
    setShowTemplates(false)
    showToast('Template loaded', 'success')
  }

  async function saveAsTemplate() {
    if (!templateName.trim()) {
      showToast('Please enter a template name', 'error')
      return
    }

    const { error } = await supabase
      .from('email_templates')
      .insert({
        name: templateName,
        subject,
        body
      })

    if (error) {
      showToast('Failed to save template', 'error')
      return
    }

    showToast('Template saved successfully', 'success')
    setTemplateName('')
    setShowSaveTemplate(false)
    fetchTemplates()
  }

  async function sendEmails() {
    if (selectedTargets.length === 0) {
      showToast('Please select at least one recipient', 'error')
      return
    }

    if (!subject.trim()) {
      showToast('Please enter a subject', 'error')
      return
    }

    if (!body.trim()) {
      showToast('Please enter an email body', 'error')
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/admin/send-manual-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: selectedTargets.map(t => ({
            id: t.id,
            email: t.email,
            business_name: t.business_name
          })),
          subject,
          body
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails')
      }

      showToast(`Successfully sent ${data.sent} email(s)`, 'success')

      // Reset form
      setSelectedTargets([])
      setSubject('')
      setBody('')

    } catch (error: any) {
      showToast(error.message || 'Failed to send emails', 'error')
    } finally {
      setSending(false)
    }
  }

  const filteredTargets = availableTargets.filter(t =>
    t.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.trade_type?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: 'var(--spacing-2xl)'
      }}>
        <h1 style={{
          fontSize: 'var(--font-3xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--ds-text-primary)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          Compose Email
        </h1>
        <p style={{
          color: 'var(--ds-text-secondary)',
          fontSize: 'var(--font-md)'
        }}>
          Send manual emails to technicians using SendGrid
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: 'var(--spacing-xl)'
      }}>
        {/* Left Sidebar - Recipients */}
        <div>
          <div style={{
            background: 'var(--container-bg)',
            border: 'var(--container-border)',
            borderRadius: 'var(--container-border-radius)',
            padding: 'var(--spacing-lg)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-md)'
            }}>
              <h3 style={{
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Recipients ({selectedTargets.length})
              </h3>
              <button
                onClick={() => setShowRecipientSearch(!showRecipientSearch)}
                style={{
                  background: 'var(--accent-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--btn-corner-radius)',
                  padding: '6px 12px',
                  fontSize: 'var(--font-sm)',
                  cursor: 'pointer',
                  fontWeight: 'var(--font-weight-semibold)'
                }}
              >
                + Add
              </button>
            </div>

            {/* Selected Recipients */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-sm)'
            }}>
              {selectedTargets.length === 0 ? (
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--font-sm)',
                  textAlign: 'center',
                  padding: 'var(--spacing-lg) 0'
                }}>
                  No recipients selected
                </p>
              ) : (
                selectedTargets.map(target => (
                  <div key={target.id} style={{
                    background: 'rgba(101, 98, 144, 0.1)',
                    border: '1px solid rgba(101, 98, 144, 0.3)',
                    borderRadius: 'var(--btn-corner-radius)',
                    padding: 'var(--spacing-sm)'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 'var(--font-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--spacing-xs)'
                        }}>
                          {target.business_name}
                        </div>
                        <div style={{
                          fontSize: 'var(--font-xs)',
                          color: 'var(--text-secondary)'
                        }}>
                          {target.email}
                        </div>
                        <div style={{
                          fontSize: 'var(--font-xs)',
                          color: 'var(--text-secondary)',
                          marginTop: 'var(--spacing-xs)'
                        }}>
                          {target.trade_type} • {target.city}, {target.state}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleRecipient(target)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: '4px',
                          fontSize: 'var(--font-lg)'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recipient Search Modal */}
          {showRecipientSearch && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }} onClick={() => setShowRecipientSearch(false)}>
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: '#2F2F2F',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: 'var(--container-border)',
                  borderRadius: 'var(--modal-border-radius)',
                  padding: 'var(--spacing-xl)',
                  maxWidth: 600,
                  width: '90%',
                  maxHeight: '80vh',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <h2 style={{
                  fontSize: 'var(--font-2xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  Select Recipients
                </h2>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Search by name, email, city, or trade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md)',
                    background: 'rgba(178, 173, 201, 0.05)',
                    border: 'var(--container-border)',
                    borderRadius: 'var(--btn-corner-radius)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-md)',
                    marginBottom: 'var(--spacing-lg)'
                  }}
                />

                {/* Targets List */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-sm)'
                }}>
                  {filteredTargets.map(target => {
                    const isSelected = selectedTargets.some(t => t.id === target.id)
                    return (
                      <div
                        key={target.id}
                        onClick={() => toggleRecipient(target)}
                        style={{
                          background: isSelected ? 'rgba(101, 98, 144, 0.2)' : 'rgba(178, 173, 201, 0.05)',
                          border: isSelected ? '2px solid var(--accent-primary)' : 'var(--container-border)',
                          borderRadius: 'var(--btn-corner-radius)',
                          padding: 'var(--spacing-md)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-md)'
                        }}>
                          <div style={{
                            width: 20,
                            height: 20,
                            borderRadius: '4px',
                            border: isSelected ? '2px solid var(--accent-primary)' : '2px solid rgba(255, 255, 255, 0.3)',
                            background: isSelected ? 'var(--accent-primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {isSelected && <span style={{ color: 'white', fontSize: '12px' }}>✓</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 'var(--font-md)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--text-primary)'
                            }}>
                              {target.business_name}
                            </div>
                            <div style={{
                              fontSize: 'var(--font-sm)',
                              color: 'var(--text-secondary)'
                            }}>
                              {target.email} • {target.trade_type} • {target.city}, {target.state}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{
                  display: 'flex',
                  gap: 'var(--spacing-md)',
                  marginTop: 'var(--spacing-lg)',
                  paddingTop: 'var(--spacing-lg)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <button
                    onClick={() => setShowRecipientSearch(false)}
                    style={{
                      flex: 1,
                      padding: 'var(--spacing-md)',
                      background: 'transparent',
                      border: '1px solid var(--accent-primary)',
                      borderRadius: 'var(--btn-corner-radius)',
                      color: 'var(--accent-primary)',
                      fontSize: 'var(--font-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      cursor: 'pointer'
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Main Area - Email Composer */}
        <div style={{
          background: 'var(--container-bg)',
          border: 'var(--container-border)',
          borderRadius: 'var(--container-border-radius)',
          padding: 'var(--spacing-xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-lg)'
        }}>
          {/* Template Actions */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)'
          }}>
            <button
              onClick={() => setShowTemplates(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(101, 98, 144, 0.2)',
                border: '1px solid rgba(101, 98, 144, 0.4)',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer'
              }}
            >
              📋 Load Template
            </button>
            <button
              onClick={() => setShowSaveTemplate(true)}
              style={{
                padding: '8px 16px',
                background: 'rgba(101, 98, 144, 0.2)',
                border: '1px solid rgba(101, 98, 144, 0.4)',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                cursor: 'pointer'
              }}
            >
              💾 Save as Template
            </button>
          </div>

          {/* Subject */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'rgba(178, 173, 201, 0.05)',
                border: 'var(--container-border)',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-md)'
              }}
            />
          </div>

          {/* Body */}
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Email Body
            </label>
            <div style={{
              background: 'white',
              borderRadius: 'var(--btn-corner-radius)',
              minHeight: 400
            }}>
              <style jsx global>{`
                .ql-container {
                  font-size: 14px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                }
                .ql-editor {
                  min-height: 300px;
                  color: #1a1a1a !important;
                }
                .ql-editor.ql-blank::before {
                  color: #999;
                  font-style: italic;
                }
                .ql-toolbar {
                  border-top-left-radius: var(--btn-corner-radius);
                  border-top-right-radius: var(--btn-corner-radius);
                  background: #f8f8f8;
                }
                .ql-container {
                  border-bottom-left-radius: var(--btn-corner-radius);
                  border-bottom-right-radius: var(--btn-corner-radius);
                }
              `}</style>
              <ReactQuill
                value={body}
                onChange={setBody}
                theme="snow"
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your email message..."
                style={{
                  height: 350,
                  borderRadius: 'var(--btn-corner-radius)'
                }}
              />
            </div>
          </div>

          {/* Send Button */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={sendEmails}
              disabled={sending || selectedTargets.length === 0}
              style={{
                flex: 1,
                padding: 'var(--spacing-lg)',
                background: sending ? 'rgba(101, 98, 144, 0.5)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'white',
                fontSize: 'var(--font-lg)',
                fontWeight: 'var(--font-weight-bold)',
                cursor: sending ? 'not-allowed' : 'pointer',
                opacity: selectedTargets.length === 0 ? 0.5 : 1
              }}
            >
              {sending ? '📤 Sending...' : `✉️ Send to ${selectedTargets.length} Recipient${selectedTargets.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>

      {/* Template Library Modal */}
      {showTemplates && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowTemplates(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#2F2F2F',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: 'var(--container-border)',
              borderRadius: 'var(--modal-border-radius)',
              padding: 'var(--spacing-xl)',
              maxWidth: 600,
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Email Templates
            </h2>

            {templates.length === 0 ? (
              <p style={{
                color: 'var(--text-secondary)',
                textAlign: 'center',
                padding: 'var(--spacing-2xl) 0'
              }}>
                No templates saved yet
              </p>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-md)'
              }}>
                {templates.map(template => (
                  <div
                    key={template.id}
                    onClick={() => loadTemplate(template)}
                    style={{
                      background: 'rgba(178, 173, 201, 0.05)',
                      border: 'var(--container-border)',
                      borderRadius: 'var(--btn-corner-radius)',
                      padding: 'var(--spacing-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      fontSize: 'var(--font-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                      marginBottom: 'var(--spacing-xs)'
                    }}>
                      {template.name}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-secondary)'
                    }}>
                      Subject: {template.subject}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowSaveTemplate(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#2F2F2F',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: 'var(--container-border)',
              borderRadius: 'var(--modal-border-radius)',
              padding: 'var(--spacing-xl)',
              maxWidth: 500,
              width: '90%'
            }}
          >
            <h2 style={{
              fontSize: 'var(--font-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--spacing-lg)'
            }}>
              Save as Template
            </h2>

            <label style={{
              display: 'block',
              fontSize: 'var(--font-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--spacing-sm)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., HVAC Follow-up"
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'rgba(178, 173, 201, 0.05)',
                border: 'var(--container-border)',
                borderRadius: 'var(--btn-corner-radius)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-md)',
                marginBottom: 'var(--spacing-lg)'
              }}
            />

            <div style={{
              display: 'flex',
              gap: 'var(--spacing-md)'
            }}>
              <button
                onClick={() => setShowSaveTemplate(false)}
                style={{
                  flex: 1,
                  padding: 'var(--spacing-md)',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: 'var(--btn-corner-radius)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveAsTemplate}
                style={{
                  flex: 1,
                  padding: 'var(--spacing-md)',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: 'var(--btn-corner-radius)',
                  color: 'white',
                  fontSize: 'var(--font-md)',
                  fontWeight: 'var(--font-weight-bold)',
                  cursor: 'pointer'
                }}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
