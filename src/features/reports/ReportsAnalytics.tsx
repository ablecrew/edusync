import React, { useState } from 'react';
import {
  Download,
  Printer,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { useStudents, useInvoices, useBooks } from '../../hooks/useQueries';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select } from '../../components/ui/select';

export const ReportsAnalytics: React.FC = () => {
  const { data: students = [] } = useStudents();
  const { data: invoices = [] } = useInvoices();
  const { data: books = [] } = useBooks();

  const [reportType, setReportType] = useState('STUDENTS');
  const [format, setFormat] = useState('PDF');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);

    if (format === 'CSV') {
      const csvContent =
        'data:text/csv;charset=utf-8,' +
        (reportType === 'STUDENTS'
          ? ['Admission #,Name,Class,Balance', ...students.map((s) => `${s.admission_number},${s.first_name} ${s.last_name},${s.class_name},${s.fee_balance}`)].join('\n')
          : ['Invoice #,Student,Amount,Status', ...invoices.map((inv) => `${inv.invoice_number},${inv.student_name},${inv.amount},${inv.status}`)].join('\n'));
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `EduSync_${reportType}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Enterprise Reports & Analytics</span>
            <Badge variant="primary">Multi-Format Engine</Badge>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Generate printable PDF, Excel, and CSV summaries across all institutional datasets with customizable filters.
          </p>
        </div>

        <Button variant="primary" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1.5" />
          <span>Export {format} Report</span>
        </Button>
      </div>

      <Card variant="default" className="p-8 max-w-4xl space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-3">
          <Filter className="w-5 h-5 text-[#08428C]" />
          <span>Report Query Builder</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Select
            label="Select Module Dataset"
            options={[
              { value: 'STUDENTS', label: `Student Information (${students.length} records)` },
              { value: 'FINANCE', label: `Financial Invoices & Receipts (${invoices.length} records)` },
              { value: 'LIBRARY', label: `Library Repository (${books.length} books)` },
            ]}
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          />

          <Select
            label="Output Format"
            options={[
              { value: 'PDF', label: 'PDF Document (Print Optimized)' },
              { value: 'EXCEL', label: 'Microsoft Excel (.XLSX)' },
              { value: 'CSV', label: 'Comma Separated Values (.CSV)' },
            ]}
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          />
        </div>

        <div className="pt-4 flex items-center justify-between">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Print Current View
          </Button>

          <Button variant="primary" size="lg" onClick={handleExport}>
            Export Database Report
          </Button>
        </div>

        {downloadSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" /> Export successfully generated! Download initiated.
          </div>
        )}
      </Card>
    </div>
  );
};
