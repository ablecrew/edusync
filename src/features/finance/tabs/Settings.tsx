import React, { useState } from 'react';
import { Plus, Settings as Cog, Shield, History, CreditCard, ListChecks } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { useFinanceStore } from '../store';
import { money } from '@/utils/cn';
import { PAYMENT_METHODS, FEE_CATEGORIES } from '../constants';
import type { FeeItem } from '../types';

export const Settings: React.FC<{ store: ReturnType<typeof useFinanceStore> }> = ({ store }) => {
  const [section, setSection] = useState<'fees' | 'methods' | 'approvals' | 'audit'>('fees');
  const [newFeeOpen, setNewFeeOpen] = useState(false);
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeCategory, setFeeCategory] = useState<FeeItem['category']>('Tuition');

  const handleAddFee = async () => {
    if (!feeName || !feeAmount) return;
    await store.addFeeItem({
      name: feeName,
      category: feeCategory,
      amount: Number(feeAmount),
    });
    setNewFeeOpen(false);
    setFeeName('');
    setFeeAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit flex-wrap">
        {(
          [
            { id: 'fees', label: 'Fee Items', icon: ListChecks },
            { id: 'methods', label: 'Payment Methods', icon: CreditCard },
            { id: 'approvals', label: 'Approval Rules', icon: Shield },
            { id: 'audit', label: 'Audit Trail', icon: History },
          ] as const
        ).map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSection(s.id as any)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                section === s.id
                  ? 'bg-white dark:bg-slate-900 text-[#08428C] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          );
        })}
      </div>

      {section === 'fees' && (
        <Card className="overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div>
              <h4 className="font-bold">Fee Items Catalogue</h4>
              <p className="text-xs text-slate-500">
                Reusable line items for invoices — tuition, boarding, transport, activities, exam, etc.
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => setNewFeeOpen(true)}>
              <Plus className="w-3.5 h-3.5" /> New Fee Item
            </Button>
          </div>
          {store.feeItems.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="w-6 h-6" />}
              title="No fee items yet"
              description="Add your first fee item to build fee structures and invoices."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Name</th>
                  <th className="py-3 px-5 text-left">Category</th>
                  <th className="py-3 px-5 text-left">Applies To</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-center">Mandatory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.feeItems.map((f) => (
                  <tr key={f.id}>
                    <td className="py-3 px-5 font-semibold">{f.name}</td>
                    <td className="py-3 px-5">
                      <Badge variant="info">{f.category}</Badge>
                    </td>
                    <td className="py-3 px-5 text-xs text-slate-500">
                      {[
                        f.applies_to.classes?.join(', '),
                        f.applies_to.boarding?.join(', '),
                        f.applies_to.transport_routes?.join(', '),
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'All learners'}
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-bold">{money(f.amount)}</td>
                    <td className="py-3 px-5 text-center">
                      {f.mandatory ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="muted">Optional</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {section === 'methods' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PAYMENT_METHODS.map((m: string) => (
            <Card key={m} className="p-4">
              <CreditCard className="w-5 h-5 text-[#08428C] mb-2" />
              <p className="font-bold text-sm">{m}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {m === 'MPESA' || m === 'Paybill' || m === 'Till'
                  ? 'Auto-reconciles from mobile money statements.'
                  : m === 'Bank Transfer' || m === 'Cheque'
                  ? 'Matched against uploaded bank statements.'
                  : 'Recorded manually by bursary staff.'}
              </p>
            </Card>
          ))}
          <Card className="p-4">
            <Cog className="w-5 h-5 text-slate-400 mb-2" />
            <p className="font-bold text-sm">Terms Configured</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {store.terms.length > 0 ? store.terms.join(' · ') : 'No terms configured yet.'}
            </p>
          </Card>
        </div>
      )}

      {section === 'approvals' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold flex items-center gap-2">
              <Shield className="w-4 h-4" /> Approval Workflow Rules
            </h4>
            <p className="text-xs text-slate-500">
              Only authorized staff can approve adjustments and bursary awards above these thresholds.
            </p>
          </div>
          {store.approvalRules.length === 0 ? (
            <EmptyState
              icon={<Shield className="w-6 h-6" />}
              title="No approval rules configured"
              description="Insert rows into the approval_rules table to enforce approver thresholds."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-5 text-left">Scope</th>
                  <th className="py-3 px-5 text-right">Threshold (≤)</th>
                  <th className="py-3 px-5 text-left">Required Approver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {store.approvalRules.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 px-5">
                      <Badge variant="primary">{r.scope}</Badge>
                    </td>
                    <td className="py-3 px-5 text-right font-mono font-bold">{money(r.threshold)}</td>
                    <td className="py-3 px-5 font-semibold">{r.approver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pending adjustments awaiting approval */}
          <div className="p-5 border-t border-slate-100 dark:border-slate-800">
            <h5 className="font-bold text-sm mb-2">Pending Adjustments</h5>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {store.adjustments
                .filter((a) => a.approval_status === 'Pending')
                .map((a) => {
                  const st = store.studentById(a.student_id);
                  return (
                    <li key={a.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {a.kind} · {money(a.amount)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {st?.first_name} {st?.last_name} — {a.reason}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Requested by {a.requested_by}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => store.decideAdjustment(a.id, 'Approved', 'Approver')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => store.decideAdjustment(a.id, 'Rejected', 'Approver')}
                        >
                          Reject
                        </Button>
                      </div>
                    </li>
                  );
                })}
              {store.adjustments.filter((a) => a.approval_status === 'Pending').length === 0 && (
                <li className="py-4 text-xs text-slate-400 text-center">
                  No adjustments awaiting approval.
                </li>
              )}
            </ul>
          </div>
        </Card>
      )}

      {section === 'audit' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h4 className="font-bold flex items-center gap-2">
              <History className="w-4 h-4" /> Audit Trail
            </h4>
            <p className="text-xs text-slate-500">
              Every financial change and bursary decision is logged for compliance.
            </p>
          </div>
          {store.audit.length === 0 ? (
            <EmptyState
              icon={<History className="w-6 h-6" />}
              title="No audit entries yet"
              description="Financial changes recorded through this interface will appear here."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 text-sm max-h-[500px] overflow-y-auto">
              {store.audit.map((a) => (
                <li key={a.id} className="p-4 flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#08428C] mt-1.5" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{a.action}</span>
                      <Badge variant="muted">{a.entity}</Badge>
                      <span className="text-[11px] text-slate-400 font-mono">{a.entity_id}</span>
                    </div>
                    {a.details && <p className="text-xs text-slate-500 mt-1">{a.details}</p>}
                    <p className="text-[11px] text-slate-400 mt-1">
                      {a.actor} · {a.date}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Dialog
        isOpen={newFeeOpen}
        onClose={() => setNewFeeOpen(false)}
        title="Add Fee Item"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <Input label="Name" value={feeName} onChange={(e) => setFeeName(e.target.value)} />
          <Select
            label="Category"
            value={feeCategory}
            onChange={(e) => setFeeCategory(e.target.value as FeeItem['category'])}
            options={FEE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="Amount"
            type="number"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
          />
          <Button variant="primary" className="w-full" onClick={handleAddFee}>
            Save Fee Item
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
