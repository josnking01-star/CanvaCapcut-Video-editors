import React from 'react';
import { 
  FileText, 
  Printer, 
  X, 
  Download, 
  CheckCircle2, 
  Building, 
  Mail, 
  DollarSign, 
  ShieldCheck 
} from 'lucide-react';
import { Invoice } from '../../../types';
import { useStudio } from '../../../context/StudioContext';

interface InvoiceModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const { whiteLabel } = useStudio();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up my-8">
        {/* Modal Controls Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Official Commercial Tax Invoice
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div className="p-8 bg-slate-900 text-slate-100 font-sans space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                <span className="text-xl font-black tracking-tight text-white">{whiteLabel.softwareName}</span>
              </div>
              <p className="text-xs text-indigo-300 font-medium mt-1">{whiteLabel.companyName}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Enterprise Software Licensing & Distribution Division</p>
              <p className="text-[11px] text-slate-400">Support: {whiteLabel.supportEmail}</p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-2xl font-black text-white font-mono block">INVOICE</span>
              <div className="text-xs font-mono text-indigo-300 font-bold">{invoice.invoiceNumber}</div>
              <div className="text-[11px] text-slate-400 font-mono">Date: {invoice.issuedDate}</div>
              <div className="text-[11px] text-slate-400 font-mono">Due: {invoice.dueDate}</div>
              <span className={`inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                invoice.status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                STATUS: {invoice.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Bill To Info */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">
                Billed To (Licensee):
              </span>
              <div className="font-bold text-white text-sm">{invoice.customerName}</div>
              {invoice.customerCompany && (
                <div className="text-slate-300 font-medium">{invoice.customerCompany}</div>
              )}
              <div className="text-slate-400 font-mono mt-0.5">{invoice.customerEmail}</div>
              <div className="text-slate-400 mt-1">{invoice.customerAddress}</div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">
                Payment Verification:
              </span>
              <div className="text-slate-300 font-mono">Method: {invoice.paymentMethod}</div>
              <div className="text-slate-300 font-mono">Order Ref: {invoice.orderId}</div>
              <div className="text-emerald-400 text-[11px] flex items-center gap-1 mt-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Authorized Digital Commercial Receipt</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="bg-slate-900/60">
                    <td className="py-3 px-4 font-sans text-slate-200">{item.description}</td>
                    <td className="py-3 px-4 text-center text-slate-300">{item.qty}</td>
                    <td className="py-3 px-4 text-right text-slate-300">${item.unitPrice.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-white font-bold">${item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>${invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax Rate:</span>
                <span>{invoice.taxRate}%</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span>-${invoice.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                <span>Total Amount:</span>
                <span className="text-emerald-400">${invoice.total.toLocaleString()} {invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 leading-relaxed font-sans text-center">
            Thank you for licensing {whiteLabel.softwareName}. All software rights and licenses are governed by the Commercial Master EULA.
            <br />
            (c) {whiteLabel.copyrightYear} {whiteLabel.companyName}. All trademarks belong to their respective owners.
          </div>
        </div>
      </div>
    </div>
  );
};
