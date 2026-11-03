import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Monitor,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { getRequests, getDepartments, createRequest, updateRequest, deleteRequest } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { SlotBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

const ALL_SLOTS = ['S1', 'S2', 'S3', 'S4'];

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const toast = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [formData, setFormData] = useState({
    request_code: '',
    department_id: '',
    computers_required: 40,
    allowed_slots: ['S1'],
  });
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqsRes, deptsRes] = await Promise.all([getRequests(), getDepartments()]);
      setRequests(reqsRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      toast.error('Failed to load requests: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleReset = () => fetchData();
    window.addEventListener('dataset-reset', handleReset);
    return () => window.removeEventListener('dataset-reset', handleReset);
  }, []);

  const openCreateModal = () => {
    setEditingReq(null);
    setFormData({
      request_code: `R${requests.length + 1}`,
      department_id: departments[0]?.id || '',
      computers_required: 40,
      allowed_slots: ['S1', 'S2'],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (req) => {
    setEditingReq(req);
    setFormData({
      request_code: req.request_code,
      department_id: req.department_id,
      computers_required: req.computers_required,
      allowed_slots: [...(req.allowed_slots || [])],
    });
    setIsModalOpen(true);
  };

  const handleToggleSlot = (slot) => {
    setFormData((prev) => {
      const exists = prev.allowed_slots.includes(slot);
      const newSlots = exists
        ? prev.allowed_slots.filter((s) => s !== slot)
        : [...prev.allowed_slots, slot];
      return { ...prev, allowed_slots: newSlots };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.request_code.trim()) {
      toast.error('Request Code is required (e.g. R6).');
      return;
    }
    if (!formData.department_id) {
      toast.error('Please select a requesting department.');
      return;
    }
    if (formData.computers_required <= 0) {
      toast.error('Computers required must be at least 1.');
      return;
    }
    if (formData.allowed_slots.length === 0) {
      toast.error('Select at least one allowed time slot.');
      return;
    }

    setSaving(true);
    try {
      if (editingReq) {
        await updateRequest(editingReq.id, formData);
        toast.success(`Request ${formData.request_code} updated!`);
      } else {
        await createRequest(formData);
        toast.success(`Request ${formData.request_code} created successfully!`);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save request.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteRequest(deleteTarget.id);
      toast.success(`Request ${deleteTarget.request_code} removed.`);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete request.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.request_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDeptFilter
      ? String(r.department_id) === String(selectedDeptFilter)
      : true;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            <span>Department Request Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Specify student count and allowed time slots for department lab sessions
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Request</span>
        </button>
      </div>

      {/* Filter / Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search request code or department..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.department_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Request Code</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Computers Needed</th>
                <th className="px-6 py-4">Allowed Slots</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    No requests found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded-lg border border-purple-200/70 dark:border-purple-800/60 font-mono">
                        {req.request_code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {req.department_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-slate-400" />
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {req.computers_required}
                        </span>
                        <span className="text-slate-400">seats</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {req.allowed_slots && req.allowed_slots.length > 0 ? (
                          req.allowed_slots.map((s) => <SlotBadge key={s} slot={s} />)
                        ) : (
                          <span className="text-rose-500 font-medium">No slots allowed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(req)}
                          className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-xl transition-colors"
                          title="Edit Request"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(req)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingReq ? `Edit Request ${editingReq.request_code}` : 'Create Demand Request'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Request Code
              </label>
              <input
                type="text"
                required
                value={formData.request_code}
                onChange={(e) => setFormData({ ...formData, request_code: e.target.value })}
                placeholder="e.g. R1, R2"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Department
              </label>
              <select
                required
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Computers Required (Seats)
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.computers_required}
              onChange={(e) => setFormData({ ...formData, computers_required: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Allowed Time Slots (Select all that apply)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_SLOTS.map((slot) => {
                const isSelected = formData.allowed_slots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleToggleSlot(slot)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              The optimizer will strictly respect these allowed slot constraints.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingReq ? 'Update Request' : 'Create Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Request"
        message={`Delete request ${deleteTarget?.request_code} (${deleteTarget?.department_name}, ${deleteTarget?.computers_required} computers)?`}
      />
    </div>
  );
};

export default Requests;

