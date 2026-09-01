"use client"
import React, { useState, useEffect } from "react"
import { fetchApi } from "@/api-client"
import { Card } from "@/components/ui/Card"
import { DiamondIcon } from "@/components/ui/Icons"
import { AnnouncementComposer } from "./AnnouncementComposer"

export default function EmailSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [testEmail, setTestEmail] = useState("")
  const [logs, setLogs] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"CONFIG" | "ANNOUNCE">("CONFIG")

  const [formData, setFormData] = useState({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: "",
    pass: "",
    fromEmail: "",
    fromName: "HC Recruitment"
  })

  useEffect(() => {
    fetchApi("/api/settings/email")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setFormData({
            host: data.host || "smtp.gmail.com",
            port: data.port || 587,
            secure: data.secure || false,
            user: data.user || "",
            pass: data.pass || "",
            fromEmail: data.fromEmail || "",
            fromName: data.fromName || "HC Recruitment"
          })
        }
      })
      .catch(err => {
        console.error(err)
        setError("Failed to load settings.")
      })

    fetchApi("/api/settings/email/logs")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLogs(data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetchApi("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings")
      }
      
      setSuccess("Settings saved successfully!")
      if (data.settings) {
        setFormData(prev => ({
          ...prev,
          pass: data.settings.pass
        }))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testEmail) {
      setError("Please enter a test email address.")
      return
    }
    setTesting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetchApi("/api/settings/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, testRecipient: testEmail })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(`${data.error} ${data.details || ""}`.trim())
      }
      
      setSuccess("Test email sent successfully! Please check the inbox.")
      
      // Refresh logs
      fetchApi("/api/settings/email/logs")
        .then(res => res.json())
        .then(data => Array.isArray(data) && setLogs(data))
        .catch(console.error)
    } catch (err: any) {
      setError(`Test Failed: ${err.message}`)
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-[#bfa8a2] font-mono">LOADING CONFIGURATION...</div>
  }

  return (
    <div className="flex flex-col gap-10 animate-[fadeIn_0.5s_ease-out] pb-10 max-w-4xl">
      <div className="flex flex-col gap-2 border-b border-[#2a2a2a] pb-6">
        <h1 className="text-3xl tracking-tight text-[#f4e4df] uppercase flex items-center gap-3 font-medium">
          <DiamondIcon />
          Email Configuration
        </h1>
        <p className="text-[#bfa8a2] text-sm uppercase tracking-wider font-mono">
          Manage SMTP server settings for automated recruitment notifications.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 font-mono text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-950/40 border border-green-500/30 text-green-400 font-mono text-sm">
          {success}
        </div>
      )}

      <div className="flex gap-4 border-b border-[#2a2a2a] pb-2">
        <button
          onClick={() => setActiveTab("CONFIG")}
          className={`font-mono text-sm uppercase tracking-wider px-4 py-2 transition-colors ${activeTab === "CONFIG" ? "text-[#ff5925] border-b-2 border-[#ff5925]" : "text-[#bfa8a2] hover:text-[#f4e4df]"}`}
        >
          Server Settings & Logs
        </button>
        <button
          onClick={() => setActiveTab("ANNOUNCE")}
          className={`font-mono text-sm uppercase tracking-wider px-4 py-2 transition-colors ${activeTab === "ANNOUNCE" ? "text-[#ff5925] border-b-2 border-[#ff5925]" : "text-[#bfa8a2] hover:text-[#f4e4df]"}`}
        >
          Custom Announcements
        </button>
      </div>

      {activeTab === "ANNOUNCE" && (
        <div className="animate-[fadeIn_0.3s_ease-out]">
          <AnnouncementComposer 
            onSuccess={(msg) => { setSuccess(msg); setError(null); }}
            onError={(msg) => { setError(msg); setSuccess(null); }}
          />
        </div>
      )}

      {activeTab === "CONFIG" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 animate-[fadeIn_0.3s_ease-out]">
        
        {/* SETTINGS FORM */}
        <Card className="p-6">
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <h2 className="text-[#f4e4df] font-medium border-b border-[#2a2a2a] pb-2">SMTP SERVER</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">Host</label>
                <input
                  type="text"
                  required
                  value={formData.host}
                  onChange={(e) => setFormData({...formData, host: e.target.value})}
                  className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">Port</label>
                <input
                  type="number"
                  required
                  value={formData.port}
                  onChange={(e) => setFormData({...formData, port: parseInt(e.target.value) || 587})}
                  className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="secure"
                checked={formData.secure}
                onChange={(e) => setFormData({...formData, secure: e.target.checked})}
                className="w-4 h-4 bg-[#111111] border border-[#2a2a2a] accent-[#ff5925]"
              />
              <label htmlFor="secure" className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono cursor-pointer">
                Use Secure (true for 465, false for 587/STARTTLS)
              </label>
            </div>

            <h2 className="text-[#f4e4df] font-medium border-b border-[#2a2a2a] pb-2 mt-4">AUTHENTICATION</h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">SMTP Username / Email</label>
                <input
                  type="email"
                  required
                  value={formData.user}
                  onChange={(e) => setFormData({...formData, user: e.target.value})}
                  className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">
                  SMTP Password (Google App Password)
                </label>
                <input
                  type="password"
                  placeholder={formData.pass === "********" ? "******** (Unchanged)" : ""}
                  value={formData.pass === "********" ? "" : formData.pass}
                  onChange={(e) => setFormData({...formData, pass: e.target.value})}
                  className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <h2 className="text-[#f4e4df] font-medium border-b border-[#2a2a2a] pb-2 mt-4">SENDER INFO</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">From Name</label>
                <input
                  type="text"
                  required
                  value={formData.fromName}
                  onChange={(e) => setFormData({...formData, fromName: e.target.value})}
                  className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider text-[#bfa8a2] font-mono">From Email</label>
                <input
                  type="email"
                  required
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({...formData, fromEmail: e.target.value})}
                  className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#ff5925] hover:bg-[#e04e20] text-white px-6 py-2 font-mono text-sm tracking-wider uppercase transition-colors disabled:opacity-50"
              >
                {saving ? "SAVING..." : "SAVE SETTINGS"}
              </button>
            </div>
          </form>
        </Card>

        {/* SIDEBAR FOR TEST AND DOCS */}
        <div className="flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-4 bg-[#111111]/50 border-[#2a2a2a]">
            <h2 className="text-[#f4e4df] font-medium border-b border-[#2a2a2a] pb-2">TEST CONFIGURATION</h2>
            <p className="text-xs text-[#bfa8a2] font-mono leading-relaxed">
              Send a real test email to verify that your SMTP credentials are valid.
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Test Recipient Email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="bg-[#111111] border border-[#2a2a2a] px-3 py-2 text-[#f4e4df] font-mono text-sm focus:border-[#ff5925] focus:outline-none transition-colors"
              />
              <button 
                type="button" 
                onClick={handleTest}
                disabled={testing}
                className="bg-[#1e1e1e] border border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#f4e4df] px-4 py-2 font-mono text-sm tracking-wider uppercase transition-colors disabled:opacity-50 mt-2"
              >
                {testing ? "TESTING..." : "SEND TEST EMAIL"}
              </button>
            </div>
          </Card>

          <Card className="p-6 flex flex-col gap-4 bg-[#111111]/50 border-[#2a2a2a]">
            <h2 className="text-[#f4e4df] font-medium border-b border-[#2a2a2a] pb-2">GMAIL INSTRUCTIONS</h2>
            <div className="text-xs text-[#bfa8a2] font-mono leading-relaxed flex flex-col gap-3">
              <p>To use Gmail as your SMTP server, follow these exact steps:</p>
              <ol className="list-decimal pl-4 flex flex-col gap-2">
                <li>Use a normal Google account (or Google Workspace account).</li>
                <li>Ensure <strong>2-Step Verification</strong> is enabled for the account.</li>
                <li>Go to Google Account Manage -{">"} Security -{">"} App Passwords.</li>
                <li>Create a new App Password (e.g., name it "HC Recruitment").</li>
                <li>Copy the generated 16-character password and paste it into the <strong>SMTP Password</strong> field here.</li>
              </ol>
              <p className="text-red-400 mt-2">
                IMPORTANT: Do NOT use your normal Gmail password. Only use the App Password.
              </p>
              <p>
                <strong>Host:</strong> smtp.gmail.com<br/>
                <strong>Port:</strong> 587<br/>
                <strong>Secure:</strong> False (STARTTLS is automatic)
              </p>
            </div>
          </Card>
        </div>

      </div>

      {/* EMAIL LOGS */}
      <Card className="p-6 mt-6">
        <h2 className="text-[#f4e4df] font-medium border-b border-[#2a2a2a] pb-2 mb-4 uppercase flex items-center justify-between">
          <span>Delivery History</span>
          <span className="text-xs text-[#bfa8a2] font-mono lowercase">Last 100 events</span>
        </h2>
        
        {logs.length === 0 ? (
          <div className="text-sm text-[#bfa8a2] font-mono text-center py-8">
            No email delivery logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-mono border-collapse">
              <thead>
                <tr className="border-b border-[#2a2a2a] text-[#bfa8a2] text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-normal">Timestamp</th>
                  <th className="py-3 px-4 font-normal">Event Type</th>
                  <th className="py-3 px-4 font-normal">Recipients</th>
                  <th className="py-3 px-4 font-normal">Status</th>
                  <th className="py-3 px-4 font-normal">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#2a2a2a]/50 hover:bg-[#1a1a1a] transition-colors text-[#e0e0e0]">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {log.event_type}
                      {log.entity_id && <span className="text-[#bfa8a2] ml-2 text-xs">[{log.entity_id}]</span>}
                    </td>
                    <td className="py-3 px-4">{log.recipient_count}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${log.status === "SUCCESS" ? "bg-green-950/40 text-green-400" : "bg-red-950/40 text-red-400"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#bfa8a2] truncate max-w-xs" title={log.error_message || "OK"}>
                      {log.error_message || "Delivered"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      </>
      )}
    </div>
  )
}
