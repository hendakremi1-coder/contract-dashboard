import React, { useState, useMemo, useRef } from 'react';
import { 
  CheckCircle, 
  Circle, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  AlertCircle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Upload
} from 'lucide-react';

// Helper function to generate 53 mock contracts simulating Excel data
const generateMockData = () => {
  const companies = ['Acme Corp', 'Globex', 'Soylent', 'Initech', 'Umbrella Corp', 'Stark Ind.', 'Wayne Ent.', 'Massive Dynamic'];
  return Array.from({ length: 53 }).map((_, index) => {
    const startMonth = Math.floor(Math.random() * 6) + 1;
    const endMonth = startMonth + Math.floor(Math.random() * 6) + 1;
    const receiveNote = Math.random() > 0.4; // 60% chance of being signed
    // Make invoice submission somewhat dependent on receive note
    const invoice = receiveNote ? Math.random() > 0.3 : Math.random() > 0.8; 
    
    return {
      id: `CTR-2026-${String(index + 1).padStart(3, '0')}`,
      client: companies[index % companies.length] + (index > 7 ? ` ${index}` : ''),
      startDate: `2026-${String(startMonth).padStart(2, '0')}-01`,
      endDate: `2026-${String(endMonth > 12 ? 12 : endMonth).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      receiveNoteSigned: receiveNote,
      invoiceSubmitted: invoice,
      value: Math.floor(Math.random() * 50000) + 10000,
    };
  });
};

export default function App() {
  const [contracts, setContracts] = useState(generateMockData());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const fileInputRef = useRef(null);
  const [uploadMessage, setUploadMessage] = useState('');

  // Toggle handlers for the interactive dashboard
  const toggleReceiveNote = (id) => {
    setContracts(contracts.map(c => 
      c.id === id ? { ...c, receiveNoteSigned: !c.receiveNoteSigned } : c
    ));
  };

  const toggleInvoice = (id) => {
    setContracts(contracts.map(c => 
      c.id === id ? { ...c, invoiceSubmitted: !c.invoiceSubmitted } : c
    ));
  };

  // Derived metrics
  const metrics = useMemo(() => {
    const total = contracts.length;
    const closed = contracts.filter(c => c.receiveNoteSigned && c.invoiceSubmitted).length;
    const pendingNotes = contracts.filter(c => !c.receiveNoteSigned).length;
    const pendingInvoices = contracts.filter(c => c.receiveNoteSigned && !c.invoiceSubmitted).length;
    
    return { total, closed, pendingNotes, pendingInvoices, completionRate: Math.round((closed / total) * 100) };
  }, [contracts]);

  // Filtered data for the table
  const filteredContracts = useMemo(() => {
    return contracts.filter(c => {
      const isClosed = c.receiveNoteSigned && c.invoiceSubmitted;
      const matchesSearch = c.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.client.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      if (statusFilter === 'Closed') return isClosed;
      if (statusFilter === 'Pending') return !isClosed;
      return true;
    });
  }, [contracts, searchTerm, statusFilter]);

  // --- File Upload Logic ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
          setUploadMessage('Error: CSV must contain a header row and data.');
          setTimeout(() => setUploadMessage(''), 5000);
          return;
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const idIdx = headers.findIndex(h => h.includes('id'));
        const clientIdx = headers.findIndex(h => h.includes('client'));
        const startIdx = headers.findIndex(h => h.includes('start'));
        const endIdx = headers.findIndex(h => h.includes('end'));
        const receiveIdx = headers.findIndex(h => h.includes('receive'));
        const invoiceIdx = headers.findIndex(h => h.includes('invoice'));

        if (idIdx === -1 || clientIdx === -1) {
           setUploadMessage('Error: CSV must contain "ID" and "Client" columns.');
           setTimeout(() => setUploadMessage(''), 5000);
           return;
        }

        const newContracts = lines.slice(1).map((line, index) => {
          const values = line.split(',').map(v => v.trim());
          
          const rVal = receiveIdx !== -1 ? (values[receiveIdx] || '').toLowerCase() : '';
          const iVal = invoiceIdx !== -1 ? (values[invoiceIdx] || '').toLowerCase() : '';
          
          return {
            id: values[idIdx] || `NEW-${index}`,
            client: values[clientIdx] || 'Unknown Client',
            startDate: startIdx !== -1 ? values[startIdx] : '2026-01-01',
            endDate: endIdx !== -1 ? values[endIdx] : '2026-12-31',
            receiveNoteSigned: rVal === 'true' || rVal === 'yes' || rVal === '1',
            invoiceSubmitted: iVal === 'true' || iVal === 'yes' || iVal === '1',
            value: 0
          };
        });
        
        setContracts(newContracts);
        setUploadMessage(`✅ Successfully loaded ${newContracts.length} contracts.`);
        setTimeout(() => setUploadMessage(''), 5000);
      } catch (err) {
        console.error(err);
        setUploadMessage('❌ Error parsing CSV file.');
        setTimeout(() => setUploadMessage(''), 5000);
      }
    };
    reader.readAsText(file);
    event.target.value = null; // Reset input so same file can be uploaded again
  };
  // --- End File Upload Logic ---

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Deliverables Dashboard</h1>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-slate-500 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> 
                Tracking {contracts.length} imported contracts
              </p>
              {uploadMessage && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${uploadMessage.includes('Error') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {uploadMessage}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            
            {/* Hidden Input and Visible Upload Button */}
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload Data (CSV)
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Contracts</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.total}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Contracts Closed</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{metrics.closed}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${metrics.completionRate}%` }}></div>
              </div>
              <span className="font-medium">{metrics.completionRate}%</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Missing Receive Notes</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{metrics.pendingNotes}</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4">Require client signature</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Missing Invoices</p>
                <p className="text-3xl font-bold text-rose-600 mt-2">{metrics.pendingInvoices}</p>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-4">Awaiting finance team</p>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Table Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between gap-4 items-center">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by ID or Client..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Active / Pending</option>
                <option value="Closed">Contract Closed</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Contract ID</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Client Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Timeline</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Receive Note Signed</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center">Invoice Submitted</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Progress</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Overall Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                      No contracts found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => {
                    const isClosed = contract.receiveNoteSigned && contract.invoiceSubmitted;
                    const progressPercent = (contract.receiveNoteSigned ? 50 : 0) + (contract.invoiceSubmitted ? 50 : 0);
                    
                    return (
                      <tr key={contract.id} className="bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                          {contract.id}
                        </td>
                        <td className="px-6 py-4">
                          {contract.client}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col text-xs">
                            <span className="text-slate-500">Start: <span className="font-medium text-slate-700">{contract.startDate}</span></span>
                            <span className="text-slate-500 mt-1">End: <span className="font-medium text-slate-700">{contract.endDate}</span></span>
                          </div>
                        </td>
                        
                        {/* Interactive Receive Note Toggle */}
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleReceiveNote(contract.id)}
                            className={`inline-flex items-center justify-center p-1 rounded-md transition-colors ${contract.receiveNoteSigned ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                            title="Click to toggle status"
                          >
                            {contract.receiveNoteSigned ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        </td>
                        
                        {/* Interactive Invoice Toggle */}
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleInvoice(contract.id)}
                            className={`inline-flex items-center justify-center p-1 rounded-md transition-colors ${contract.invoiceSubmitted ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                            title="Click to toggle status"
                          >
                            {contract.invoiceSubmitted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                        </td>

                        {/* Progress Bar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 sm:w-20 bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  progressPercent === 100 ? 'bg-emerald-500' : 
                                  progressPercent === 50 ? 'bg-amber-400' : 
                                  'bg-transparent'
                                }`} 
                                style={{ width: `${progressPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-500 font-medium w-8 text-right">
                              {progressPercent}%
                            </span>
                          </div>
                        </td>
                        
                        {/* Automated Status Label */}
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                            isClosed 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {isClosed ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                            {isClosed ? 'Contract Closed' : 'In Progress'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-slate-200 bg-white text-sm text-slate-500 flex justify-between items-center">
            <span>Showing {filteredContracts.length} of {contracts.length} contracts</span>
            <span className="text-xs italic text-slate-400">Click the checkboxes to test the automation logic</span>
          </div>
        </div>

      </div>
    </div>
  );
}
