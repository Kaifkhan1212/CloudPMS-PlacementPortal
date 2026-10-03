import { useState, useEffect } from 'react';
import { emailApi } from '../../api/emailApi';
import { placementApi } from '../../api/placementApi';
import { getApiError, formatDate } from '../../utils/helpers';
import { PageLoader, EmptyState, filterTabClass, filterTabStyle } from '../../components/common/UI';
import PageTitle from '../../components/common/PageTitle';
import PageHero from '../../components/common/PageHero';
import { Mail, History, Send, Search, CheckCircle2, XCircle, ChevronRight, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState('compose');

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg-page)', animation: 'fadeIn 0.3s ease both' }}>
      <PageTitle title="Communication Center" />
      <PageHero
        title="Communication Center"
        subtitle="Manage outbound emails, configure recipients, and track communication history."
      />
      
      <div className="page-container max-w-6xl flex-1 flex flex-col">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('compose')}
            className={filterTabClass(activeTab === 'compose')}
            style={filterTabStyle(activeTab === 'compose')}
          >
            <Mail className="w-4 h-4" />
            Compose Email
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={filterTabClass(activeTab === 'history')}
            style={filterTabStyle(activeTab === 'history')}
          >
            <History className="w-4 h-4" />
            Email History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'compose' ? <ComposeEmailTab /> : <EmailHistoryTab />}
      </div>
    </div>
  );
}

function ComposeEmailTab() {
  const [loading, setLoading] = useState(false);
  const [drives, setDrives] = useState([]);
  const [form, setForm] = useState({
    recipientMode: 'single',
    recipients: '',
    driveId: '',
    subject: '',
    message: ''
  });

  useEffect(() => {
    placementApi.getMyDrives()
      .then(res => setDrives(res.data.data.drives))
      .catch(err => toast.error('Failed to load drives: ' + getApiError(err)));
  }, []);

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to queue these emails for sending?')) return;
    
    const payload = {
      recipientMode: form.recipientMode,
      subject: form.subject,
      message: form.message,
    };

    if (form.recipientMode === 'single' || form.recipientMode === 'multiple') {
      payload.recipients = form.recipients.split(',').map(s => s.trim()).filter(Boolean);
      if (payload.recipients.length === 0) {
        toast.error('Please enter at least one recipient email.');
        return;
      }
    } else {
      payload.driveId = form.driveId;
      if (!payload.driveId) {
        toast.error('Please select a drive.');
        return;
      }
    }

    setLoading(true);
    try {
      await emailApi.sendEmail(payload);
      toast.success('Emails queued for sending successfully!');
      setForm({ ...form, subject: '', message: '', recipients: '' });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const needsDrive = !['single', 'multiple'].includes(form.recipientMode);

  return (
    <div className="cpm-card w-full lg:max-w-4xl mx-auto shadow-card-md">
      <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
        <h3 className="type-h4 mb-0">New Message</h3>
      </div>
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Config */}
          <div className="p-5 rounded-lg border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border)' }}>
            <p className="type-label mb-4">Recipient Configuration</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Recipient Mode</label>
                <select className="form-select" value={form.recipientMode} onChange={handleChange('recipientMode')} required>
                  <option value="single">Custom Email Addresses</option>
                  <option value="all_applicants">Drive: All Applicants</option>
                  <option value="shortlisted">Drive: Shortlisted Only</option>
                  <option value="interview_scheduled">Drive: Interview Scheduled</option>
                  <option value="selected">Drive: Selected Students</option>
                </select>
              </div>

              {!needsDrive ? (
                <div>
                  <label className="form-label">Email Addresses</label>
                  <input type="text" className="form-input" placeholder="comma separated emails..." value={form.recipients} onChange={handleChange('recipients')} required />
                </div>
              ) : (
                <div>
                  <label className="form-label">Select Target Drive</label>
                  <select className="form-select" value={form.driveId} onChange={handleChange('driveId')} required>
                    <option value="">-- Select Drive --</option>
                    {drives.map(d => (
                      <option key={d._id} value={d._id}>{d.company} ({d.jobRole})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Email Content */}
          <div className="space-y-5">
            <div>
              <label className="form-label">Subject</label>
              <input type="text" className="form-input text-base font-semibold" placeholder="Email Subject" value={form.subject} onChange={handleChange('subject')} required />
            </div>

            <div>
              <label className="form-label flex justify-between">
                Message Body
                <span className="text-2xs font-normal normal-case opacity-70">Plain text format supported</span>
              </label>
              <textarea 
                className="form-textarea h-64 font-sans text-sm leading-relaxed" 
                placeholder="Type your message here..." 
                value={form.message} 
                onChange={handleChange('message')} 
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end" style={{ borderColor: 'var(--border)' }}>
            <button 
              type="submit" 
              className="btn-primary w-full sm:w-auto px-8 py-2.5 flex items-center justify-center gap-2 shadow-card transition-transform hover:-translate-y-0.5" 
              disabled={loading}
            >
              {loading ? 'Sending...' : <><Send className="w-4 h-4" /> Send Email</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmailHistoryTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 12, search: '', type: '', status: '' });
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = () => {
    setLoading(true);
    emailApi.getEmailLogs(filters)
      .then(res => {
        setLogs(res.data.data.logs);
        setTotalPages(res.data.data.pagination.pages);
      })
      .catch(err => toast.error(getApiError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.type, filters.status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchLogs();
  };

  if (loading && logs.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 rounded-lg shadow-sm" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
        <form onSubmit={handleSearch} className="flex-1 w-full flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input !pl-9 !py-2 w-full"
              placeholder="Search subject or recipient..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <button type="submit" className="hidden" />
        </form>
        
        <div className="comm-filters-row flex gap-3 w-full md:w-auto">
          <select 
            className="form-select !py-2 flex-1 md:flex-none" 
            value={filters.type} 
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
          >
            <option value="">All Types</option>
            <option value="manual">Manual Compose</option>
            <option value="application_confirmation">Application Confirmed</option>
            <option value="status_update">Status Update</option>
          </select>
          <select 
            className="form-select !py-2 flex-1 md:flex-none" 
            value={filters.status} 
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Statuses</option>
            <option value="sent">Delivered</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* List */}
      {logs.length === 0 ? (
        <EmptyState 
          icon={<History className="w-8 h-8" />} 
          title="No email logs found" 
          message="No communications match your current filter criteria." 
        />
      ) : (
        <div className="cpm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="cpm-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Recipients</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id} className="group hover:bg-surface-2 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <td className="font-sans text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-2xs font-bold" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                          {log.recipients.length}
                        </div>
                        <span className="text-sm font-medium truncate max-w-[150px]" style={{ color: 'var(--text)' }} title={log.recipients.join(', ')}>
                          {log.recipients[0]}{log.recipients.length > 1 && ' ...'}
                        </span>
                      </div>
                    </td>
                    <td className="font-sans font-semibold text-sm max-w-[250px] truncate" style={{ color: 'var(--text)' }}>
                      {log.subject}
                    </td>
                    <td>
                      <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-subtle)' }}>
                        {log.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-center">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-bold uppercase tracking-wider" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}>
                          <CheckCircle2 className="w-3 h-3" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-2xs font-bold uppercase tracking-wider" style={{ background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }}>
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <ChevronRight className="w-4 h-4 ml-auto transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface-2)' }}>
              <span className="font-sans text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Page {filters.page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })} className="btn-secondary !py-1.5 !px-3 text-sm">Previous</button>
                <button disabled={filters.page === totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })} className="btn-secondary !py-1.5 !px-3 text-sm">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email Detail Drawer/Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.88)' }}>
          <div className="w-full max-w-2xl shadow-card-lg animate-fade-rise rounded-xl flex flex-col overflow-hidden max-h-[90vh]" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderTop: '3px solid var(--accent)' }}>
            
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="type-h4 mb-0 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: 'var(--accent)' }} /> Email Details
              </h2>
              <button onClick={() => setSelectedLog(null)} className="p-1 rounded hover:bg-surface-2 transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Meta info block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-lg border" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                <div>
                  <p className="type-label mb-1">From Sender</p>
                  <p className="font-sans font-medium text-sm" style={{ color: 'var(--text)' }}>{selectedLog.senderEmail}</p>
                </div>
                <div>
                  <p className="type-label mb-1">Sent At</p>
                  <p className="font-sans font-medium text-sm" style={{ color: 'var(--text)' }}>{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="type-label mb-1 flex items-center gap-2">
                    Recipients 
                    <span className="px-1.5 py-0.5 rounded text-2xs font-bold" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>{selectedLog.recipients.length}</span>
                  </p>
                  <div className="max-h-24 overflow-y-auto p-3 rounded border text-xs font-mono" style={{ background: 'var(--bg-page)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    {selectedLog.recipients.join(', ')}
                  </div>
                </div>
              </div>
              
              {/* Message Content */}
              <div>
                <p className="type-label mb-2">Subject</p>
                <h3 className="type-h3 mb-4">{selectedLog.subject}</h3>
                
                <p className="type-label mb-2">Message Content</p>
                <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <div className="px-4 py-2 border-b flex items-center justify-between" style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                    <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-subtle)' }}>Preview</span>
                    <span className="text-2xs font-medium px-2 py-0.5 rounded" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid var(--warning-border)' }}>Email rendered in light mode</span>
                  </div>
                  <div
                    className="p-5 text-sm font-sans whitespace-pre-wrap leading-relaxed overflow-auto rounded-b-lg"
                    style={{ background: '#F8F9FA', color: '#111827', minHeight: '80px', borderTop: '1px solid #E2E6EE' }}
                    dangerouslySetInnerHTML={{ __html: selectedLog.messageText }}
                  />
                </div>
              </div>

              {/* Error Block */}
              {selectedLog.errorMessage && (
                <div className="p-4 rounded-lg border" style={{ background: 'var(--error-bg)', borderColor: 'var(--error-border)' }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--error-text)' }}>Delivery Error</p>
                  <p className="text-sm font-mono" style={{ color: 'var(--error-text)' }}>{selectedLog.errorMessage}</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
              <button onClick={() => setSelectedLog(null)} className="btn-secondary px-6">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
