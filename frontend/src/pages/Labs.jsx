import React, { useState, useEffect } from 'react';
import {
  Server,
  Plus,
  Search,
  Edit2,
  Trash2,
  Cpu,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { getLabs, createLab, updateLab, deleteLab } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { SlotBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

const ALL_SLOTS = ['S1', 'S2', 'S3', 'S4'];

const Labs = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlotFilter, setSelectedSlotFilter] = useState('');
  const toast = useToast();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [formData, setFormData] = useState({
    lab_name: '',
    capacity: 50,
    available_slots: ['S1', 'S2', 'S3'],
  });
  const [saving, setSaving] = useState(false);

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLabsList = async () => {
    try {
      setLoading(true);
      const res = await getLabs();
      setLabs(res.data);
    } catch (err) {
      toast.error('Failed to load laboratories: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabsList();
    const handleReset = () => fetchLabsList();
    window.addEventListener('dataset-reset', handleReset);
    return () => window.removeEventListener('dataset-reset', handleReset);
  }, []);

  const openCreateModal = () => {
    setEditingLab(null);
    setFormData({
      lab_name: '',
      capacity: 50,
      available_slots: ['S1', 'S2', 'S3'],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (lab) => {
    setEditingLab(lab);
    setFormData({
      lab_name: lab.lab_name,
      capacity: lab.capacity,
      available_slots: [...(lab.available_slots || [])],
    });
    setIsModalOpen(true);
  };

  const handleToggleSlot = (slot) => {
    setFormData((prev) => {
      const exists = prev.available_slots.includes(slot);
      const newSlots = exists
        ? prev.available_slots.filter((s) => s !== slot)
        : [...prev.available_slots, slot];
      return { ...prev, available_slots: newSlots };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.lab_name.trim()) {
      toast.error('Laboratory name is required.');
      return;
    }
    if (formData.capacity <= 0) {
      toast.error('Capacity must be greater than 0.');
      return;
    }
    if (formData.available_slots.length === 0) {
      toast.error('At least one available time slot must be selected.');
      return;
    }

    setSaving(true);
    try {
      if (editingLab) {
        await updateLab(editingLab.id, formData);
        toast.success(`Laboratory ${formData.lab_name} updated successfully!`);
      } else {
        await createLab(formData);
        toast.success(`Laboratory ${formData.lab_name} created successfully!`);
      }
      setIsModalOpen(false);
      fetchLabsList();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save laboratory.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteLab(deleteTarget.id);
      toast.success(`Laboratory ${deleteTarget.lab_name} deleted.`);
      setDeleteTarget(null);
      fetchLabsList();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete laboratory.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Labs
  const filteredLabs = labs.filter((lab) => {
    const matchesSearch = lab.lab_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSlot = selectedSlotFilter
      ? lab.available_slots?.includes(selectedSlotFilter)
      : true;
    return matchesSearch && matchesSlot;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            <span>Laboratory Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure computer lab capacities and open operational time slots
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Laboratory</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search laboratory name (e.g. Lab A)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedSlotFilter}
            onChange={(e) => setSelectedSlotFilter(e.target.value)}
            className="w-full sm:w-44 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Time Slots</option>
            <option value="S1">Slot S1</option>
            <option value="S2">Slot S2</option>
            <option value="S3">Slot S3</option>
            <option value="S4">Slot S4</option>
          </select>
        </div>
      </div>

      {/* Labs Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Laboratory</th>
                <th className="px-6 py-4">Capacity</th>
                <th className="px-6 py-4">Available Slots</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-400">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading laboratories...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLabs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                    No laboratories found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLabs.map((lab) => (
                  <tr
                    key={lab.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">
                            {lab.lab_name}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            ID: #{lab.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {lab.capacity}
                        </span>
                        <span className="text-slate-400 font-medium">computers</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lab.available_slots && lab.available_slots.length > 0 ? (
                          lab.available_slots.map((s) => (
                            <SlotBadge key={s} slot={s} />
                          ))
                        ) : (
                          <span className="text-rose-500 font-medium">None (Unavailable)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(lab)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition-colors"
                          title="Edit Laboratory"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(lab)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors"
                          title="Delete Laboratory"
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
        title={editingLab ? `Edit ${editingLab.lab_name}` : 'Add New Laboratory'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Laboratory Name
            </label>
            <input
              type="text"
              required
              value={formData.lab_name}
              onChange={(e) => setFormData({ ...formData, lab_name: e.target.value })}
              placeholder="e.g. Lab E"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Computer Capacity (Seats)
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Available Time Slots
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ALL_SLOTS.map((slot) => {
                const isSelected = formData.available_slots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleToggleSlot(slot)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Toggle slots when this laboratory is operational.
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
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingLab ? 'Update Lab' : 'Create Lab'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete Laboratory"
        message={`Are you sure you want to delete ${deleteTarget?.lab_name}? Associated schedule allocations will be cleared.`}
      />
    </div>
  );
};

export default Labs;

